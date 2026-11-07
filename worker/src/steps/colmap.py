"""
Extracción de poses de cámara con COLMAP via ns-process-data (Nerfstudio).
ns-process-data envuelve COLMAP y produce un transforms.json en formato Nerfstudio.
"""
import json
import logging
import math
import subprocess
import sys
from pathlib import Path

from config import Config
from steps.hardware import has_cuda

logger = logging.getLogger(__name__)

# Mínimo de cámaras que COLMAP debe registrar para que valga la pena entrenar
_MIN_REGISTERED_FRAMES = 8
_MIN_REGISTERED_RATIO = 0.3

# Por encima de este número de imágenes el matching exhaustivo (N² parejas) se vuelve lento
_EXHAUSTIVE_MAX_IMAGES = 100


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

    # "sequential" asume fotogramas de video consecutivos; con fotos sueltas alrededor del
    # vehículo (pocos ángulos) casi no empareja. Con pocas imágenes comparamos todas las parejas.
    num_images = sum(1 for p in images_dir.iterdir() if p.is_file())
    matching = "exhaustive" if num_images <= _EXHAUSTIVE_MAX_IMAGES else "sequential"
    logger.info("COLMAP: %d imágenes, matching %s", num_images, matching)

    cmd = [
        "ns-process-data", "images",
        "--data", str(images_dir),
        "--output-dir", str(processed_dir),
        "--num-downscales", "0",
        "--matching-method", matching,
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

    _check_registered_frames(transforms, num_images)

    logger.info("COLMAP completado. transforms.json generado en %s", processed_dir)
    return processed_dir


def _check_registered_frames(transforms: Path, num_images: int) -> None:
    """Falla pronto si COLMAP registró muy pocas cámaras, en vez de gastar GPU entrenando."""
    registered = len(json.loads(transforms.read_text()).get("frames", []))
    required = max(min(_MIN_REGISTERED_FRAMES, num_images), math.ceil(num_images * _MIN_REGISTERED_RATIO))
    if registered < required:
        raise RuntimeError(
            f"COLMAP solo pudo ubicar {registered} de {num_images} fotos (mínimo {required}). "
            "Las fotos deben ser del mismo vehículo en el mismo lugar, rodeándolo con solapamiento "
            "entre tomas consecutivas, sin fotos repetidas ni mezcla de sitios o fondos distintos."
        )


def _detect_gpu_flag() -> list[str]:
    """Detecta la aceleración de hardware disponible para COLMAP."""
    if has_cuda():
        logger.info("CUDA disponible — COLMAP usará GPU.")
        return []

    logger.info("Sin GPU CUDA — COLMAP en modo CPU.")
    return ["--no-gpu"]
