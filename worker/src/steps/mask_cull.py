"""
Separa el auto del fondo en 3D después de entrenar (fondo limpio sin perder calidad en el auto).

Entrenar solo con el auto (máscaras en la pérdida) empeora la carrocería: es lisa y brillante, y el entorno es
lo que le da a nerfstudio referencias para ubicar bien la geometría. Así que se entrena con la escena completa
y aquí se decide qué gaussianas son del auto: cada una se proyecta en todas las fotos y se conserva si cae
dentro de la máscara del auto (steps/segment_cars.py) en la mayoría de las vistas donde aparece.

Las máscaras se buscan como processed/masks/<foto>.png. Todo es numpy + Pillow.
"""
import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

from steps.scene_crop import load_camera_poses

logger = logging.getLogger(__name__)

MIN_VIEWS = 3            # la gaussiana debe verse en al menos estas fotos para decidir
# Fracción de esas fotos en que debe caer dentro de la máscara del auto. Medido con el Volkswagen Gol: con 0,6
# queda suelo pegado al auto (fuga de fondo 0,30); con 0,75 la fuga baja a 0,12 sin perder calidad en el auto
# (PSNR 17,64 vs 17,66); con 0,9 empiezan a aparecer huecos en la carrocería (PSNR 17,25).
MIN_CAR_FRACTION = 0.75
ENDPOINT_SIGMAS = 2.0     # los extremos de una gaussiana se toman a 2 desviaciones de su centro


@dataclass
class View:
    c2w: np.ndarray          # (3,4) cámara→mundo en el marco del modelo, convención OpenGL
    fx: float
    fy: float
    cx: float
    cy: float
    w: int
    h: int
    dist: tuple              # k1, k2, p1, p2 (OpenCV)
    mask_path: Path


def load_views(processed_dir: Path, dataparser_path: Path) -> list[View]:
    """Fotos que tienen máscara, con su cámara en el marco del modelo entrenado."""
    processed_dir = Path(processed_dir)
    tpath = processed_dir / "transforms.json"
    meta = json.loads(tpath.read_text())
    c2w = load_camera_poses(tpath, dataparser_path)
    views = []
    for frame, pose in zip(meta["frames"], c2w):
        mask = processed_dir / "masks" / (Path(frame["file_path"]).stem + ".png")
        if not mask.exists():
            continue

        def get(key, default=0.0):
            return float(frame.get(key, meta.get(key, default)))

        views.append(View(
            c2w=pose, fx=get("fl_x"), fy=get("fl_y"), cx=get("cx"), cy=get("cy"),
            w=int(get("w")), h=int(get("h")),
            dist=(get("k1"), get("k2"), get("p1"), get("p2")),
            mask_path=mask,
        ))
    return views


def project(points: np.ndarray, view: View) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Coordenadas de píxel (u, v) en la foto original (con distorsión) y si el punto está delante."""
    rot, t = view.c2w[:, :3], view.c2w[:, 3]
    pc = (points - t) @ rot                      # mundo → cámara (OpenGL: mira hacia -z, y hacia arriba)
    x, y, z = pc[:, 0], -pc[:, 1], -pc[:, 2]      # → OpenCV: mira hacia +z, y hacia abajo
    front = z > 1e-6
    zs = np.where(front, z, 1.0)
    xn, yn = x / zs, y / zs
    k1, k2, p1, p2 = view.dist
    r2 = xn * xn + yn * yn
    radial = 1.0 + k1 * r2 + k2 * r2 * r2
    xd = xn * radial + 2 * p1 * xn * yn + p2 * (r2 + 2 * xn * xn)
    yd = yn * radial + p1 * (r2 + 2 * yn * yn) + 2 * p2 * xn * yn
    return view.fx * xd + view.cx, view.fy * yd + view.cy, front


def car_votes(points: np.ndarray, views: list[View]) -> tuple[np.ndarray, np.ndarray]:
    """Por gaussiana: en cuántas fotos se ve y en cuántas cae dentro de la máscara del auto."""
    visible = np.zeros(len(points), np.int32)
    inside = np.zeros(len(points), np.int32)
    for view in views:
        u, v, front = project(points, view)
        ui = np.floor(u).astype(np.int64)
        vi = np.floor(v).astype(np.int64)
        on_image = front & (ui >= 0) & (ui < view.w) & (vi >= 0) & (vi < view.h)
        mask = np.asarray(Image.open(view.mask_path).convert("L")) > 127
        if mask.shape != (view.h, view.w):
            raise ValueError(f"máscara {view.mask_path.name} de {mask.shape}, se esperaba {(view.h, view.w)}")
        visible += on_image
        idx = np.flatnonzero(on_image)
        inside[idx] += mask[vi[idx], ui[idx]]
    return inside, visible


def axis_endpoints(points: np.ndarray, scales: np.ndarray, quats_wxyz: np.ndarray,
                   sigmas: float = ENDPOINT_SIGMAS) -> tuple[np.ndarray, np.ndarray]:
    """Extremos de cada gaussiana a lo largo de su eje más largo (centro ± sigmas · escala máxima)."""
    q = quats_wxyz / (np.linalg.norm(quats_wxyz, axis=1, keepdims=True) + 1e-12)
    w, x, y, z = q[:, 0], q[:, 1], q[:, 2], q[:, 3]
    # columnas de la matriz de rotación = ejes locales de la gaussiana en el mundo
    axes = np.stack([
        np.stack([1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y)], axis=1),
        np.stack([2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x)], axis=1),
        np.stack([2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)], axis=1),
    ], axis=1)                                                    # (N, eje, xyz)
    longest = np.argmax(scales, axis=1)
    direction = axes[np.arange(len(points)), longest]
    offset = direction * (sigmas * scales[np.arange(len(points)), longest])[:, None]
    return points + offset, points - offset


def car_mask_3d(points: np.ndarray, views: list[View], scales: np.ndarray | None = None,
                quats_wxyz: np.ndarray | None = None, min_views: int = MIN_VIEWS,
                min_fraction: float = MIN_CAR_FRACTION) -> np.ndarray:
    """
    True para las gaussianas del auto. Si se dan escalas y rotaciones, también los dos extremos de cada
    gaussiana deben caer dentro del auto: las "agujas" largas cuyo centro está en la silueta pero que
    sobresalen de ella (pasto, reflejos del muro) quedan fuera.
    """
    def is_car(p):
        inside, visible = car_votes(p, views)
        return (visible >= min_views) & (inside >= min_fraction * np.maximum(visible, 1))

    car = is_car(points)
    if scales is not None and quats_wxyz is not None:
        end_a, end_b = axis_endpoints(points, scales, quats_wxyz)
        car &= is_car(end_a) & is_car(end_b)
    return car
