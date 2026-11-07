"""Detección de GPU compartida por los pasos del pipeline."""
import shutil
import subprocess


def has_cuda() -> bool:
    """
    True si hay una GPU NVIDIA utilizable.

    En Modal el worker corre en Python 3.11 y torch está instalado solo en el
    Python 3.10 de la imagen de nerfstudio, así que `import torch` falla aunque
    haya GPU; en ese caso se consulta `nvidia-smi`.
    """
    try:
        import torch  # type: ignore
        return bool(torch.cuda.is_available())
    except ImportError:
        pass

    if shutil.which("nvidia-smi") is None:
        return False
    try:
        return subprocess.run(["nvidia-smi", "-L"], capture_output=True, timeout=15).returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False
