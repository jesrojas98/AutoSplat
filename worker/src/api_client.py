"""
Reporta progreso y completa jobs escribiendo directamente a Supabase via REST.
"""
import logging
from datetime import datetime, timezone

import requests

from config import Config

logger = logging.getLogger(__name__)

_HEADERS = None


def _headers() -> dict:
    global _HEADERS
    if _HEADERS is None:
        _HEADERS = {
            "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
    return _HEADERS


def _url(table: str) -> str:
    return f"{Config.SUPABASE_URL}/rest/v1/{table}"


def report_progress(
    job_id: str,
    *,
    status: str,
    progress: int,
    current_step: str,
    error_message: str = None,
) -> None:
    """Actualiza el progreso del job directamente en Supabase."""
    payload = {
        "status": status,
        "progress": progress,
        "current_step": current_step,
        "worker_id": Config.WORKER_ID,
    }
    if error_message:
        payload["error_message"] = error_message[:1000]

    try:
        r = requests.patch(
            f"{_url('processing_jobs')}?id=eq.{job_id}",
            headers=_headers(),
            json=payload,
        )
        r.raise_for_status()
    except Exception as exc:
        logger.warning("No se pudo reportar progreso: %s", exc)


def complete_job(
    job_id: str,
    *,
    model_url: str,
    preview_image_url: str = None,
    num_gaussians: int = None,
    processing_time_seconds: int = None,
) -> None:
    """Marca el job como completado y actualiza vehicle_3d_models en Supabase."""
    now = datetime.now(timezone.utc).isoformat()

    # Obtener model_id del job
    r = requests.get(
        f"{_url('processing_jobs')}?id=eq.{job_id}&select=model_id",
        headers=_headers(),
    )
    r.raise_for_status()
    rows = r.json()
    model_id = rows[0].get("model_id") if rows else None

    if model_id:
        model_payload = {
            "status": "completed",
            "model_url": model_url,
            "completed_at": now,
        }
        if preview_image_url:
            model_payload["preview_image_url"] = preview_image_url
        if num_gaussians is not None:
            model_payload["num_gaussians"] = num_gaussians
        if processing_time_seconds is not None:
            model_payload["processing_time_seconds"] = processing_time_seconds

        requests.patch(
            f"{_url('vehicle_3d_models')}?id=eq.{model_id}",
            headers=_headers(),
            json=model_payload,
        ).raise_for_status()

    requests.patch(
        f"{_url('processing_jobs')}?id=eq.{job_id}",
        headers=_headers(),
        json={
            "status": "completed",
            "progress": 100,
            "current_step": "completed",
            "finished_at": now,
        },
    ).raise_for_status()

    logger.info("Job %s marcado como completado en Supabase.", job_id)
