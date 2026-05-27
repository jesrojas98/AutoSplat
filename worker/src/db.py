"""
Capa de acceso a Supabase via REST API con requests.
Usa el service role key para saltarse RLS.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

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


def claim_next_pending_job() -> Optional[dict]:
    """Busca el job pendiente más antiguo y lo marca como 'processing'."""
    r = requests.get(
        _url("processing_jobs"),
        headers=_headers(),
        params={
            "select": "id,vehicle_id,model_id",
            "status": "eq.pending",
            "order": "priority.desc,created_at.asc",
            "limit": "1",
        },
    )
    r.raise_for_status()
    if not r.json():
        return None

    job_id = r.json()[0]["id"]

    patch = requests.patch(
        f"{_url('processing_jobs')}?id=eq.{job_id}&status=eq.pending",
        headers=_headers(),
        json={
            "status": "processing",
            "worker_id": Config.WORKER_ID,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    patch.raise_for_status()
    if not patch.json():
        logger.info("Job %s ya fue reclamado por otro worker.", job_id)
        return None

    logger.info("Job %s reclamado por %s", job_id, Config.WORKER_ID)
    return patch.json()[0]


def get_reconstruction_images(vehicle_id: str) -> list[dict]:
    """Retorna las URLs de las imágenes de reconstrucción del vehículo."""
    r = requests.get(
        _url("vehicle_images"),
        headers=_headers(),
        params={
            "select": "id,image_url,sort_order",
            "vehicle_id": f"eq.{vehicle_id}",
            "image_type": "eq.reconstruction",
            "order": "sort_order.asc",
        },
    )
    r.raise_for_status()
    return r.json() or []


def upload_model_to_storage(local_path: str, vehicle_id: str, filename: str) -> str:
    """Sube el modelo .splat a Supabase Storage. Retorna la URL pública."""
    storage_path = f"vehicles/{vehicle_id}/{filename}"
    url = f"{Config.SUPABASE_URL}/storage/v1/object/{Config.STORAGE_BUCKET}/{storage_path}"

    with open(local_path, "rb") as f:
        r = requests.post(
            url,
            headers={
                "apikey": Config.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {Config.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/octet-stream",
                "x-upsert": "true",
            },
            data=f,
        )

    if r.status_code not in (200, 201):
        raise RuntimeError(f"Storage upload failed {r.status_code}: {r.text}")

    public_url = (
        f"{Config.SUPABASE_URL}/storage/v1/object/public"
        f"/{Config.STORAGE_BUCKET}/{storage_path}"
    )
    logger.info("Modelo subido → %s", public_url)
    return public_url


def claim_job_by_id(job_id: str) -> Optional[dict]:
    """Reclama un job específico por ID (Modal ya conoce el job_id)."""
    patch = requests.patch(
        f"{_url('processing_jobs')}?id=eq.{job_id}&status=eq.pending",
        headers=_headers(),
        json={
            "status": "processing",
            "worker_id": Config.WORKER_ID,
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    patch.raise_for_status()
    if not patch.json():
        logger.info("Job %s ya fue reclamado o no existe.", job_id)
        return None

    logger.info("Job %s reclamado por %s", job_id, Config.WORKER_ID)
    return patch.json()[0]


def mark_job_failed(job_id: str, error_message: str) -> None:
    """Marca el job como fallido en Supabase."""
    requests.patch(
        f"{_url('processing_jobs')}?id=eq.{job_id}",
        headers=_headers(),
        json={
            "status": "failed",
            "error_message": error_message[:1000],
            "finished_at": datetime.now(timezone.utc).isoformat(),
        },
    ).raise_for_status()
