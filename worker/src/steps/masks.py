"""
Genera las máscaras del vehículo (steps/segment_cars.py), que luego separan el auto del fondo (mask_cull.py).

El segmentador necesita torch, que solo existe en el Python 3.10 de la imagen de nerfstudio; el worker corre
en Python 3.11, así que se lanza como subproceso. SAM y sus pesos se instalan en /opt/seg (ver modal_app.py).
"""
import logging
import os
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

SEG_PYTHON = "/usr/bin/python3.10"
SEG_PACKAGES = "/opt/seg"


def masks_available() -> bool:
    """True si la imagen trae el segmentador (Modal); en un worker local sin SAM se entrena sin máscaras."""
    return Path(SEG_PYTHON).exists() and Path(SEG_PACKAGES, "weights", "sam_vit_h_4b8939.pth").exists()


def generate_masks(processed_dir: Path, preview_dir: Path | None = None, add_to_transforms: bool = False) -> None:
    """
    Escribe processed/masks/<foto>.png (255 = auto). Lanza RuntimeError si falla.

    Por defecto NO toca transforms.json: se entrena con la escena completa y las máscaras se usan al exportar
    (mask_cull.py). Con add_to_transforms=True nerfstudio entrenaría solo con el auto.
    """
    script = Path(__file__).with_name("segment_cars.py")
    cmd = [SEG_PYTHON, str(script), str(processed_dir)]
    if preview_dir is not None:
        cmd += ["--preview", str(preview_dir)]
    if add_to_transforms:
        cmd.append("--add-to-transforms")

    env = {
        **os.environ,
        "PYTHONUSERBASE": "/home/user/.local",
        "PYTHONPATH": SEG_PACKAGES,
        "TORCH_HOME": f"{SEG_PACKAGES}/torch",
    }
    logger.info("Segmentando el vehículo en cada foto: %s", " ".join(cmd))
    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    summary = next((l for l in result.stdout.splitlines() if l.startswith("MASKS_OK")), None)
    if result.returncode != 0 or summary is None:
        raise RuntimeError(f"La segmentación falló (código {result.returncode}): {result.stderr[-800:]}")
    logger.info("Máscaras listas: %s", summary)
