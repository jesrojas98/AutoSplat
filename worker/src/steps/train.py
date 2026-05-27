"""
Entrenamiento del modelo Gaussian Splatting con Nerfstudio (splatfacto).
Ajusta automáticamente los hiperparámetros según el hardware disponible.
"""
import glob
import logging
import subprocess
from pathlib import Path

from config import Config

logger = logging.getLogger(__name__)


def train_splatfacto(processed_dir: Path, dest_dir: Path, job_id: str) -> Path:
    """
    Entrena el modelo splatfacto y retorna el path al config.yml generado.

    Args:
        processed_dir: Directorio con transforms.json (salida de COLMAP).
        dest_dir: Directorio base del job.
        job_id: ID del job para nombrar el experimento.

    Returns:
        Path al config.yml de nerfstudio para usarlo en el export.
    """
    output_dir = dest_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)

    experiment_name = f"job_{job_id[:8]}"
    hw_args = _hardware_args()

    cmd = [
        "ns-train", "splatfacto",
        "--output-dir", str(output_dir),
        "--experiment-name", experiment_name,
        "--max-num-iterations", str(Config.TRAIN_MAX_ITERATIONS),
        "--logging.local-writer.max-log-size", "0",
        "--vis", "tensorboard",
    ] + hw_args + [
        "nerfstudio-data",
        "--data", str(processed_dir),
        "--downscale-factor", "1",
    ]

    logger.info(
        "Iniciando entrenamiento splatfacto (%d iteraciones)...",
        Config.TRAIN_MAX_ITERATIONS,
    )
    logger.info("Comando: %s", " ".join(cmd))

    result = subprocess.run(cmd, capture_output=False, text=True, cwd=str(dest_dir))

    if result.returncode != 0:
        raise RuntimeError(
            f"ns-train splatfacto falló con código {result.returncode}."
        )

    config_path = _find_config(output_dir, experiment_name)
    logger.info("Entrenamiento completado. Config: %s", config_path)
    return config_path


def _find_config(output_dir: Path, experiment_name: str) -> Path:
    """Encuentra el config.yml que genera nerfstudio después del entrenamiento."""
    # Nerfstudio crea: output/<experiment>/<method>/<timestamp>/config.yml
    pattern = str(output_dir / experiment_name / "splatfacto" / "*" / "config.yml")
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
    try:
        import torch  # type: ignore
        if torch.cuda.is_available():
            logger.info("CUDA disponible — entrenamiento con GPU.")
            return []
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
