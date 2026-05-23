"""
Extracción de poses de cámara con COLMAP via ns-process-data (Nerfstudio).
ns-process-data envuelve COLMAP y produce un transforms.json en formato Nerfstudio.
"""
import logging
import subprocess
import sys
from pathlib import Path

from config import Config

logger = logging.getLogger(__name__)


def run_colmap(images_dir: Path, dest_dir: Path) -> Path:
    """
    Ejecuta ns-process-data para correr COLMAP sobre el directorio de imágenes.
    Produce un transforms.json en `dest_dir/processed/`.

    Args:
        images_dir: Directorio con las imágenes descargadas.
        dest_dir: Directorio base del job.

    Returns:
        Path al directorio procesado que contiene transforms.json.
    """
    processed_dir = dest_dir / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)

    # Si transforms.json ya existe (generado externamente), saltarse COLMAP
    transforms = processed_dir / "transforms.json"
    if transforms.exists():
        logger.info("transforms.json ya existe, saltando COLMAP.")
        return processed_dir

    # Detectar si hay GPU disponible para COLMAP
    gpu_flag = _detect_gpu_flag()

    cmd = [
        "ns-process-data", "images",
        "--data", str(images_dir),
        "--output-dir", str(processed_dir),
        "--num-downscales", "0",
        "--matching-method", "sequential",
    ] + gpu_flag

    logger.info("Ejecutando COLMAP: %s", " ".join(cmd))

    result = subprocess.run(
        cmd,
        capture_output=False,   # mostrar output en tiempo real
        text=True,
        cwd=str(dest_dir),
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"ns-process-data falló con código {result.returncode}. "
            "Revisar que COLMAP está instalado y las imágenes tienen suficiente textura."
        )

    transforms = processed_dir / "transforms.json"
    if not transforms.exists():
        raise RuntimeError(
            "COLMAP completó pero no generó transforms.json. "
            "Posiblemente no se encontraron suficientes correspondencias entre imágenes. "
            "Intenta con más imágenes o con mayor variación de ángulos."
        )

    logger.info("COLMAP completado. transforms.json generado en %s", processed_dir)
    return processed_dir


def _detect_gpu_flag() -> list[str]:
    """Detecta la aceleración de hardware disponible para COLMAP."""
    try:
        import torch  # type: ignore
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            logger.info("Apple Silicon MPS detectado — COLMAP usará CPU (MPS no compatible con COLMAP).")
            return ["--no-gpu"]
        if torch.cuda.is_available():
            logger.info("CUDA disponible — COLMAP usará GPU.")
            return []
    except ImportError:
        pass

    logger.info("Sin GPU — COLMAP en modo CPU.")
    return ["--no-gpu"]
