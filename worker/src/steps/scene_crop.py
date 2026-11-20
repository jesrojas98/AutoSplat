"""
Recorte y reorientación del modelo antes de subirlo al visor web.

Un entrenamiento de Gaussian Splatting reconstruye *todo* lo que ven las fotos: suelo, muros, árboles,
cielo. Con una captura alrededor de un auto, el auto es una parte pequeña del modelo y millones de
gaussianas del entorno (muchas alargadas, "agujas") quedan entre la cámara del visor y el vehículo.

Aquí se conserva solo la zona alrededor del auto, estimada a partir de dónde estaban las cámaras:
  - centro: el punto donde se cruzan los ejes ópticos de las cámaras (el auto),
  - radio: una fracción del radio al que orbitaban las cámaras,
  - altura: desde un poco bajo el suelo (el plano con más gaussianas) hasta la altura de un auto.

Todo es numpy puro. Las funciones trabajan en el marco de coordenadas del modelo entrenado
(z hacia arriba, centrado en las cámaras y escalado por nerfstudio).
"""
import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

# Calibrado con un auto real (Volkswagen Gol, 48 fotos guiadas): cámaras a radio 0,86 del centro;
# el recorte que dejaba el auto limpio y con algo de suelo tenía radio 0,70 y alturas -0,46…+0,08
# con el suelo en -0,40.
R_CROP_FACTOR = 0.82       # radio de recorte / radio medio de las cámaras
Z_BELOW_GROUND = 0.08      # tolerancia bajo el suelo, × radio de cámaras
Z_ABOVE_GROUND = 0.60      # altura máxima sobre el suelo, × radio de cámaras
MAX_SCALE_FACTOR = 0.30    # se descartan gaussianas más grandes que esto × radio de cámaras
MIN_ALPHA = 25             # 0-255: se descartan las casi transparentes
NEEDLE_ANISOTROPY = 50     # "agujas": gaussianas ≥50 veces más largas que anchas...
NEEDLE_MIN_SIZE = 0.01     # ...y de largo apreciable (× radio de cámaras); las diminutas no molestan
GROUND_PEAK_RATIO = 3.0    # el suelo debe ser un pico claro frente al resto del histograma
MIN_KEPT_FRACTION = 0.05   # si el recorte deja menos que esto, se considera fallido


@dataclass
class CropPlan:
    center: np.ndarray        # (3,) centro de la órbita de cámaras
    r_cam: float              # radio horizontal medio de las cámaras
    r_crop: float             # radio horizontal del recorte
    z_ground: float | None    # altura del suelo (None si no se pudo estimar)
    z_lo: float
    z_hi: float


def load_camera_poses(transforms_path: Path, dataparser_path: Path) -> np.ndarray:
    """
    Poses cámara→mundo (N, 3, 4) de cada foto en el marco del modelo entrenado, convención OpenGL.

    transforms.json (salida de ns-process-data) guarda poses cámara→mundo en convención OpenGL: la cámara
    mira por su eje -z. nerfstudio las reorienta/centra (transform, 3x4) y escala (scale) y lo guarda en
    dataparser_transforms.json junto al config.yml. Ojo: ese `transform` ya incluye el `applied_transform`
    con que ns-process-data había transformado las poses del archivo, así que se deshace antes.
    """
    meta = json.loads(Path(transforms_path).read_text())
    dp = json.loads(Path(dataparser_path).read_text())

    m4 = np.vstack([np.array(dp["transform"], dtype=np.float64), [0.0, 0.0, 0.0, 1.0]])
    applied = meta.get("applied_transform")
    if applied is not None:
        a4 = np.vstack([np.array(applied, dtype=np.float64), [0.0, 0.0, 0.0, 1.0]])
        m4 = m4 @ np.linalg.inv(a4)
    rot, trans = m4[:3, :3], m4[:3, 3]
    scale = float(dp["scale"])

    c2w = np.array([f["transform_matrix"] for f in meta["frames"]], dtype=np.float64)  # (N, 4, 4)
    out = np.empty((len(c2w), 3, 4))
    out[:, :, :3] = rot @ c2w[:, :3, :3]
    out[:, :, 3] = (c2w[:, :3, 3] @ rot.T + trans) * scale
    return out


def load_cameras(transforms_path: Path, dataparser_path: Path) -> tuple[np.ndarray, np.ndarray]:
    """Posición y dirección de mirada (eje -z de la cámara) de cada foto, en el marco del modelo."""
    poses = load_camera_poses(transforms_path, dataparser_path)
    fwd = -poses[:, :, 2]
    return poses[:, :, 3], fwd / (np.linalg.norm(fwd, axis=1, keepdims=True) + 1e-12)


def orbit_center(pos: np.ndarray, fwd: np.ndarray) -> np.ndarray:
    """Punto más cercano a todos los ejes ópticos (mínimos cuadrados): hacia donde miran las cámaras."""
    a = np.zeros((3, 3))
    b = np.zeros(3)
    for c, f in zip(pos, fwd):
        proj = np.eye(3) - np.outer(f, f)
        a += proj
        b += proj @ c
    return np.linalg.lstsq(a, b, rcond=None)[0]


def plan_crop(
    points: np.ndarray, alpha: np.ndarray, size: np.ndarray, cam_pos: np.ndarray, cam_fwd: np.ndarray,
) -> CropPlan | None:
    """
    Calcula el recorte. `points` (N,3), `alpha` (N,) en 0-255, `size` (N,) = escala máxima por gaussiana.
    Devuelve None si las cámaras no permiten estimarlo (p. ej. todas en el mismo punto).
    """
    if len(cam_pos) < 3:
        return None
    center = orbit_center(cam_pos, cam_fwd)
    rad = np.hypot(cam_pos[:, 0] - center[0], cam_pos[:, 1] - center[1])
    r_cam = float(np.median(rad))
    if not np.isfinite(r_cam) or r_cam < 1e-6:
        return None

    r_crop = R_CROP_FACTOR * r_cam
    horizontal = np.hypot(points[:, 0] - center[0], points[:, 1] - center[1]) < r_crop

    z_ground = _estimate_ground(points, alpha, size, horizontal, float(np.median(cam_pos[:, 2])), r_cam)
    if z_ground is None:
        z_lo, z_hi = -np.inf, np.inf   # sin suelo claro: solo recorte horizontal
    else:
        z_lo = z_ground - Z_BELOW_GROUND * r_cam
        z_hi = z_ground + Z_ABOVE_GROUND * r_cam
    return CropPlan(center, r_cam, r_crop, z_ground, z_lo, z_hi)


def _estimate_ground(
    points: np.ndarray, alpha: np.ndarray, size: np.ndarray, horizontal: np.ndarray, cam_z: float, r_cam: float,
) -> float | None:
    """El suelo es el plano con más gaussianas opacas y pequeñas, por debajo de la altura de las cámaras."""
    cand = horizontal & (alpha > 128) & (size < 0.05 * r_cam) & (points[:, 2] < cam_z - 0.1 * r_cam)
    if cand.sum() < 1000:
        return None
    z = points[cand, 2]
    lo, hi = np.percentile(z, [0.5, 99.5])
    width = 0.02 * r_cam
    if hi - lo < 2 * width:
        return None
    counts, edges = np.histogram(z, bins=np.arange(lo, hi + width, width))
    nonzero = counts[counts > 0]
    peak = int(np.argmax(counts))
    if len(nonzero) < 3 or counts[peak] < GROUND_PEAK_RATIO * float(np.median(nonzero)):
        return None
    return float((edges[peak] + edges[peak + 1]) / 2)


def crop_mask(points: np.ndarray, alpha: np.ndarray, scales: np.ndarray, plan: CropPlan) -> np.ndarray:
    """True para las gaussianas que se conservan. `scales` (N,3) son las escalas lineales por eje."""
    size = scales.max(axis=1)
    needle = (size / np.maximum(scales.min(axis=1), 1e-9) > NEEDLE_ANISOTROPY) & (size > NEEDLE_MIN_SIZE * plan.r_cam)
    return (
        (np.hypot(points[:, 0] - plan.center[0], points[:, 1] - plan.center[1]) < plan.r_crop)
        & (points[:, 2] > plan.z_lo)
        & (points[:, 2] < plan.z_hi)
        & (alpha > MIN_ALPHA)
        & (size < MAX_SCALE_FACTOR * plan.r_cam)
        & ~needle
    )


# Huella del auto vista desde arriba: rectángulo de la carrocería alta (que nunca es suelo), con margen.
# Quita restos de suelo/pasto alrededor del auto que la separación por máscaras deja pasar.
BODY_MIN_HEIGHT = 0.12     # sobre el suelo, × radio de cámaras (~40 cm en un auto): carrocería, no suelo
FOOTPRINT_MARGIN = 0.04    # × radio de cámaras (~13 cm): deja dentro los espejos, que sobresalen


def footprint_mask(points: np.ndarray, plan: CropPlan) -> np.ndarray | None:
    """
    True para lo que cae dentro de la huella rectangular del auto (en el plano horizontal). None si no hay
    suelo detectado o si no hay suficiente carrocería para estimarla.
    """
    if plan.z_ground is None:
        return None
    body = points[points[:, 2] > plan.z_ground + BODY_MIN_HEIGHT * plan.r_cam, :2]
    if len(body) < 500:
        return None
    center = np.median(body, axis=0)
    _, _, vt = np.linalg.svd(body - center, full_matrices=False)   # ejes largo y ancho del auto
    local_body = (body - center) @ vt.T
    lo, hi = np.percentile(local_body, [0.1, 99.9], axis=0)
    margin = FOOTPRINT_MARGIN * plan.r_cam
    local = (points[:, :2] - center) @ vt.T
    return ((local >= lo - margin) & (local <= hi + margin)).all(axis=1)


def normalize_frame(points: np.ndarray, plan: CropPlan) -> tuple[np.ndarray, float]:
    """
    Centra el auto en el origen y escala el recorte a radio 1. Devuelve (puntos, factor de escala).

    No rota: el marco sigue con z hacia arriba (nerfstudio) y el visor aplica la orientación. Trasladar y
    escalar de forma uniforme no altera los armónicos esféricos; rotar sí (habría que rotar sus coeficientes).
    """
    z_mid = (plan.z_lo + plan.z_hi) / 2 if plan.z_ground is not None else plan.center[2]
    origin = np.array([plan.center[0], plan.center[1], z_mid])
    k = 1.0 / plan.r_crop
    return (points - origin) * k, k
