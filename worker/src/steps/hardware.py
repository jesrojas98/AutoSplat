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


def cuda_arch_list() -> str | None:
    """
    Capacidad de cómputo de la GPU (p. ej. "7.5" en una T4), en el formato de TORCH_CUDA_ARCH_LIST.

    La imagen de nerfstudio fija TORCH_CUDA_ARCH_LIST=8.9+PTX. gsplat compila sus kernels CUDA
    la primera vez que se usa, y con ese valor solo salen para GPUs 8.9 o superiores: en una T4
    (7.5) el entrenamiento muere con "CUDA error: no kernel image is available". Exportar la
    arquitectura real de la GPU antes de lanzar `ns-train` lo evita.
    """
    if shutil.which("nvidia-smi") is None:
        return None
    try:
        out = subprocess.run(
            ["nvidia-smi", "--query-gpu=compute_cap", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=15,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if out.returncode != 0:
        return None
    for line in out.stdout.splitlines():
        cap = line.strip()
        if cap.replace(".", "", 1).isdigit():
            return cap
    return None

