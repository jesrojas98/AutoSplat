"""
Llamadas HTTP al backend NestJS para reportar progreso y completar jobs.
Los endpoints /jobs/:id/progress y /jobs/:id/complete no requieren autenticación.
"""
import logging
import requests

from config import Config

logger = logging.getLogger(__name__)

_BASE = Config.BACKEND_URL.rstrip("/")


def report_progress(
    job_id: str,
    *,
    status: str,
    progress: int,
    current_step: str,
    error_message: str = None,
) -> None:
    """Actualiza el progreso del job en el backend NestJS."""
    payload = {
        "status": status,
        "progress": progress,
        "current_step": current_step,
        "worker_id": Config.WORKER_ID,
    }
    if error_message:
        payload["error_message"] = error_message

    try:
        res = requests.patch(
            f"{_BASE}/jobs/{job_id}/progress",
            json=payload,
            timeout=10,
        )
        res.raise_for_status()
    except Exception as exc:
        # El progreso fallido no debe detener el pipeline
        logger.warning("No se pudo reportar progreso al backend: %s", exc)


def complete_job(
    job_id: str,
    *,
    model_url: str,
    preview_image_url: str = None,
    num_gaussians: int = None,
    processing_time_seconds: int = None,
) -> None:
    """Marca el job como completado con los datos del modelo final."""
    payload = {"model_url": model_url}
    if preview_image_url:
        payload["preview_image_url"] = preview_image_url
    if num_gaussians is not None:
        payload["num_gaussians"] = num_gaussians
    if processing_time_seconds is not None:
        payload["processing_time_seconds"] = processing_time_seconds

    res = requests.patch(
        f"{_BASE}/jobs/{job_id}/complete",
        json=payload,
        timeout=10,
    )
    res.raise_for_status()
    logger.info("Job %s marcado como completado en el backend.", job_id)
