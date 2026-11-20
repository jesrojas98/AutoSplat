"""
Entrenamiento del modelo Gaussian Splatting con Nerfstudio (splatfacto).
Ajusta automáticamente los hiperparámetros según el hardware disponible.
"""
import glob
import logging
import subprocess
from pathlib import Path

from config import Config
from steps.hardware import has_cuda

logger = logging.getLogger(__name__)

# Perfil de producción, elegido midiendo variantes contra fotos reales de la captura guiada (Volkswagen Gol,
# 48 fotos; 8 reservadas para medir PSNR/SSIM/LPIPS dentro de la silueta del auto). Se entrena con la escena
# completa: el entorno ayuda a ubicar la geometría del auto; el fondo se quita al exportar (mask_cull.py).
#
# Resultado del producto final (solo el auto, SH grado 2), frente al entrenamiento por defecto de nerfstudio:
#   PSNR 18,31 vs 17,75 · SSIM 0,753 vs 0,713 · LPIPS 0,300 vs 0,337. Descartados por medir peor: entrenar con
#   máscaras o fondo blanco, splatfacto-big con máscaras y el refinamiento de poses (camera-optimizer).
QUALITY_METHOD = "splatfacto"
QUALITY_MODEL_ARGS = [
    "--pipeline.model.use-scale-regularization", "True",   # evita las "agujas" (gaussianas muy alargadas)
    "--pipeline.model.use-bilateral-grid", "True",         # corrige exposición/balance de blancos entre fotos
    "--pipeline.model.rasterize-mode", "antialiased",      # sin aliasing al alejar la cámara en el visor
]
QUALITY_ANTIALIASED = True                  # debe coincidir con --pipeline.model.rasterize-mode
QUALITY_DATA_ARGS = ["--eval-mode", "all"]  # entrenar con todas las fotos (por defecto nerfstudio reserva 10%)


def train_splatfacto(
    processed_dir: Path,
    dest_dir: Path,
    job_id: str,
    method: str = "splatfacto",
    model_args: list[str] | None = None,
    data_args: list[str] | None = None,
) -> Path:
    """
    Entrena el modelo splatfacto y retorna el path al config.yml generado.

    Args:
        processed_dir: Directorio con transforms.json (salida de COLMAP).
        dest_dir: Directorio base del job.
        job_id: ID del job para nombrar el experimento.
        method: método de nerfstudio ("splatfacto" o "splatfacto-big").
        model_args: opciones extra del modelo/pipeline (p. ej. ["--pipeline.model.use-scale-regularization", "True"]).
        data_args: opciones extra del dataparser nerfstudio-data (p. ej. ["--eval-mode", "all"]).

    Returns:
        Path al config.yml de nerfstudio para usarlo en el export.
    """
    output_dir = dest_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)

    experiment_name = f"job_{job_id[:8]}"
    hw_args = _hardware_args()

    cmd = [
        "ns-train", method,
        "--output-dir", str(output_dir),
        "--experiment-name", experiment_name,
        "--max-num-iterations", str(Config.TRAIN_MAX_ITERATIONS),
        "--logging.local-writer.max-log-size", "0",
        "--vis", "tensorboard",
    ] + hw_args + list(model_args or []) + [
        "nerfstudio-data",
        "--data", str(processed_dir),
        "--downscale-factor", "1",
    ] + list(data_args or [])

    logger.info(
        "Iniciando entrenamiento %s (%d iteraciones)...",
        method, Config.TRAIN_MAX_ITERATIONS,
    )
    logger.info("Comando: %s", " ".join(cmd))

    result = subprocess.run(cmd, capture_output=False, text=True, cwd=str(dest_dir))

    if result.returncode != 0:
        raise RuntimeError(
            f"ns-train {method} falló con código {result.returncode}."
        )

    config_path = _find_config(output_dir, experiment_name, method)
    logger.info("Entrenamiento completado. Config: %s", config_path)
    return config_path


def _find_config(output_dir: Path, experiment_name: str, method: str = "splatfacto") -> Path:
    """Encuentra el config.yml que genera nerfstudio después del entrenamiento."""
    # Nerfstudio crea: output/<experiment>/<method>/<timestamp>/config.yml
    pattern = str(output_dir / experiment_name / method / "*" / "config.yml")
    matches = sorted(glob.glob(pattern))
    if not matches:
        # Buscar más amplio por si el nombre difiere
        pattern2 = str(output_dir / "**" / "config.yml")
        matches = sorted(glob.glob(pattern2, recursive=True))
    if not matches:
        raise RuntimeError(
            f"No se encontró config.yml después del entrenamiento en {output_dir}"
        )
    return Path(matches[-1])  # el más reciente


def _hardware_args() -> list[str]:
    """Retorna flags de entrenamiento adaptados al hardware disponible."""
    if has_cuda():
        logger.info("CUDA disponible — entrenamiento con GPU.")
        return []

    try:
        import torch  # type: ignore
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            logger.info("Apple Silicon MPS disponible — entrenamiento acelerado.")
            # splatfacto soporta MPS desde nerfstudio 1.1+
            return ["--machine.device-type", "mps"]
    except ImportError:
        pass

    logger.warning(
        "Sin aceleración GPU. Entrenando en CPU (lento). "
        "Estimado: ~%d minutos para %d iteraciones.",
        Config.TRAIN_MAX_ITERATIONS // 100,
        Config.TRAIN_MAX_ITERATIONS,
    )
    return ["--machine.device-type", "cpu"]
