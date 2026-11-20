"""
Exporta el modelo entrenado desde Nerfstudio y lo deja listo para el visor web.

  1. ns-export → .ply con todo lo entrenado (incluidos los armónicos esféricos, o sea los reflejos).
  2. Recorte alrededor del auto (scene_crop.py): primero un cilindro según las cámaras y luego, si hay
     máscaras del auto, la separación fina auto/fondo proyectando en las fotos (mask_cull.py).
  3. Normalización: centrado en el auto y escalado a radio 1. No se rota: la orientación la aplica el visor,
     así los armónicos esféricos quedan intactos.
  4. Escritura en SPZ (spz.py): ~20-45 bytes por gaussiana, frente a 60-250 del .ply.
"""
import glob
import logging
import subprocess
from pathlib import Path

import numpy as np
from plyfile import PlyData  # type: ignore

from steps.mask_cull import car_mask_3d, load_views
from steps.scene_crop import (MIN_KEPT_FRACTION, crop_mask, footprint_mask, load_cameras, normalize_frame,
                              plan_crop)
from steps.spz import SH_DIM, write_spz

logger = logging.getLogger(__name__)

# Grado de armónicos esféricos (reflejos) que se envía al visor. Medido en vistas no usadas al entrenar: el grado 2
# es el mejor en PSNR/SSIM/LPIPS (el 3 sobreajusta y además pesa más; el 0-1 pierde los reflejos).
EXPORT_SH_DEGREE = 2

# Con máscaras se quita además una franja delgada a la altura del suelo (× radio de cámaras, ~3 cm en un auto):
# es el suelo que queda justo bajo y junto al auto, que desde el lado opuesto cae "detrás" de su silueta.
GROUND_CUT = 0.01

# Si la separación por máscaras dejaría menos que esto del recorte cilíndrico, se considera fallida
MIN_CAR_FRACTION_OF_CROP = 0.10


def export_and_convert(
    config_path: Path, dest_dir: Path, antialiased: bool = False, sh_degree: int = EXPORT_SH_DEGREE,
) -> tuple[Path, int]:
    """
    Ejecuta ns-export y deja el modelo recortado en dest_dir/model.spz.

    `antialiased` debe coincidir con el rasterize_mode del entrenamiento: queda marcado en el archivo
    para que el visor dibuje igual que se entrenó.

    Returns:
        (path al .spz, número de gaussianos)
    """
    export_dir = dest_dir / "export"
    export_dir.mkdir(parents=True, exist_ok=True)

    ply_path = _run_ns_export(config_path, export_dir)
    cameras = _load_training_cameras(config_path, dest_dir)
    views = _load_mask_views(config_path, dest_dir)
    return _ply_to_spz(ply_path, dest_dir / "model.spz", cameras, antialiased, sh_degree, views)


def _dataparser_path(config_path: Path) -> Path:
    # nerfstudio lo guarda junto al config.yml; por si cambia de sitio, se busca también en la carpeta del experimento
    dataparser = config_path.parent / "dataparser_transforms.json"
    if not dataparser.exists():
        dataparser = next(config_path.parent.parent.rglob("dataparser_transforms.json"), dataparser)
    return dataparser


def _load_training_cameras(config_path: Path, dest_dir: Path):
    """Cámaras de la captura en el marco del modelo, o None si no se pueden leer (no se recorta)."""
    transforms = dest_dir / "processed" / "transforms.json"
    dataparser = _dataparser_path(config_path)
    if not (transforms.exists() and dataparser.exists()):
        logger.warning("Sin transforms.json o dataparser_transforms.json: el modelo se sube sin recortar.")
        return None
    try:
        return load_cameras(transforms, dataparser)
    except Exception as exc:  # un recorte fallido no debe tumbar un entrenamiento de una hora
        logger.warning("No se pudieron leer las cámaras (%s): el modelo se sube sin recortar.", exc)
        return None


def _load_mask_views(config_path: Path, dest_dir: Path):
    """Fotos con máscara del auto (para separarlo del fondo), o None si no hay o no se pueden leer."""
    processed = dest_dir / "processed"
    if not (processed / "masks").is_dir():
        return None
    try:
        views = load_views(processed, _dataparser_path(config_path))
        return views or None
    except Exception as exc:
        logger.warning("No se pudieron leer las máscaras (%s): se recorta solo con el cilindro.", exc)
        return None


# ── ns-export ─────────────────────────────────────────────────────────────────

def _run_ns_export(config_path: Path, export_dir: Path) -> Path:
    """Llama a ns-export gaussian-splat para obtener splat.ply."""
    cmd = [
        "ns-export", "gaussian-splat",
        "--load-config", str(config_path),
        "--output-dir", str(export_dir),
    ]
    logger.info("Exportando modelo: %s", " ".join(cmd))

    result = subprocess.run(cmd, capture_output=False, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ns-export falló con código {result.returncode}.")

    ply_path = _find_ply(export_dir)
    logger.info("PLY exportado: %s (%.1f MB)", ply_path, ply_path.stat().st_size / 1e6)
    return ply_path


def _find_ply(export_dir: Path) -> Path:
    """Busca el archivo .ply generado por ns-export."""
    candidates = list(export_dir.glob("*.ply")) + list(export_dir.glob("**/*.ply"))
    if not candidates:
        raise RuntimeError(f"No se encontró .ply en {export_dir} después del export.")
    return sorted(candidates, key=lambda p: p.stat().st_size, reverse=True)[0]


# ── Conversión PLY → .spz ─────────────────────────────────────────────────────

def _ply_to_spz(ply_path: Path, out_path: Path, cameras=None, antialiased: bool = False,
                sh_degree: int = EXPORT_SH_DEGREE, views=None) -> tuple[Path, int]:
    """
    Convierte el .ply de Nerfstudio a .spz, recortando el entorno alrededor del auto si hay cámaras.

    El PLY de Nerfstudio incluye:
      - x, y, z                        → posición
      - scale_0, scale_1, scale_2      → escala en espacio logarítmico
      - rot_0..rot_3                    → cuaternión (w, x, y, z)
      - f_dc_0..2                       → color (coeficiente SH de grado 0)
      - f_rest_0..                      → resto de coeficientes SH, por canal (R…, G…, B…)
      - opacity                         → opacidad antes de la sigmoide
    """
    logger.info("Convirtiendo %s → %s ...", ply_path.name, out_path.name)
    v = PlyData.read(str(ply_path))["vertex"]
    names = v.data.dtype.names
    n = len(v)

    def cols(keys):
        return np.stack([np.asarray(v[k], dtype=np.float32) for k in keys], axis=1)

    pos = cols(("x", "y", "z"))
    log_scale = cols(("scale_0", "scale_1", "scale_2"))
    quat = cols(("rot_0", "rot_1", "rot_2", "rot_3"))
    dc = cols(("f_dc_0", "f_dc_1", "f_dc_2"))
    opacity = np.asarray(v["opacity"], dtype=np.float32)
    n_rest = sum(1 for k in names if k.startswith("f_rest_"))
    if n_rest:
        rest = cols([f"f_rest_{i}" for i in range(n_rest)]).reshape(n, 3, n_rest // 3)
    else:
        rest = np.zeros((n, 3, 0), np.float32)

    if cameras is not None:
        cam_pos, cam_fwd = cameras
        scale = np.exp(log_scale)
        alpha = np.clip(255.0 / (1.0 + np.exp(-opacity)), 0, 255).astype(np.uint8)
        plan = plan_crop(pos, alpha, scale.max(axis=1), cam_pos, cam_fwd)
        keep = crop_mask(pos, alpha, scale, plan) if plan is not None else None
        if keep is None or keep.sum() < max(1000, MIN_KEPT_FRACTION * n):
            logger.warning("Recorte descartado (plan=%s, conservaría %s de %d): se sube sin recortar.",
                           "no" if plan is None else "sí", "-" if keep is None else int(keep.sum()), n)
        else:
            logger.info(
                "Recorte alrededor del auto: radio %.3f (cámaras a %.3f), suelo %s → %d de %d gaussianas (%.0f%%).",
                plan.r_crop, plan.r_cam, "no detectado" if plan.z_ground is None else f"z={plan.z_ground:.3f}",
                int(keep.sum()), n, 100.0 * keep.sum() / n,
            )
            if views:
                idx = np.flatnonzero(keep)
                car = car_mask_3d(pos[idx], views, scales=scale[idx], quats_wxyz=quat[idx])
                if car.sum() >= max(1000, MIN_CAR_FRACTION_OF_CROP * len(idx)):
                    keep[idx[~car]] = False
                    if plan.z_ground is not None:
                        keep &= pos[:, 2] > plan.z_ground + GROUND_CUT * plan.r_cam
                    inside_footprint = footprint_mask(pos[keep], plan)
                    if inside_footprint is not None:
                        kept = np.flatnonzero(keep)
                        keep[kept[~inside_footprint]] = False
                    logger.info("Separación auto/fondo con %d máscaras: quedan %d gaussianas del auto.",
                                len(views), int(keep.sum()))
                else:
                    logger.warning("Separación por máscaras descartada (dejaría %d de %d): queda el recorte cilíndrico.",
                                   int(car.sum()), len(idx))
            pos, k = normalize_frame(pos[keep], plan)
            log_scale = log_scale[keep] + np.log(k)
            quat, dc, opacity, rest = quat[keep], dc[keep], opacity[keep], rest[keep]
            n = int(keep.sum())

    available = {coefs: d for d, coefs in SH_DIM.items()}.get(rest.shape[2], 0)
    degree = min(sh_degree, available)
    write_spz(out_path, pos, log_scale, quat, opacity, dc, rest[:, :, :SH_DIM[degree]], antialiased=antialiased)

    size_mb = out_path.stat().st_size / 1e6
    logger.info("Conversión completada: %d gaussianos, SH grado %d, %.1f MB → %s", n, degree, size_mb, out_path.name)
    return out_path, n
