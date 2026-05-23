"""
Capa de acceso a Supabase: claim de jobs, lectura de imágenes y subida de modelos.
El worker usa el service role key para saltarse RLS.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from supabase import create_client, Client

from config import Config

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
    return _client


def claim_next_pending_job() -> Optional[dict]:
    """
    Busca el job pendiente más antiguo y lo marca como 'processing' de forma atómica.
    Retorna el job completo o None si no hay nada pendiente.
    """
    sb = get_client()

    # Leer el job pendiente más antiguo
    res = (
        sb.table("processing_jobs")
        .select("id, vehicle_id, model_id")
        .eq("status", "pending")
        .order("priority", desc=True)
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )

    if not res.data:
        return None

    job = res.data[0]
    job_id = job["id"]

    # Intentar reclamar actualizando solo si sigue en 'pending'
    claimed = (
        sb.table("processing_jobs")
        .update({
            "status": "processing",
            "worker_id": Config.WORKER_ID,
            "started_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", job_id)
        .eq("status", "pending")   # condición atómica anti-duplicado
        .execute()
    )

    if not claimed.data:
        logger.info("Job %s ya fue reclamado por otro worker, saltando.", job_id)
        return None

    logger.info("Job %s reclamado por %s", job_id, Config.WORKER_ID)
    return claimed.data[0]


def get_reconstruction_images(vehicle_id: str) -> list[dict]:
    """Retorna las URLs de las imágenes de reconstrucción del vehículo."""
    sb = get_client()
    res = (
        sb.table("vehicle_images")
        .select("id, image_url, sort_order")
        .eq("vehicle_id", vehicle_id)
        .eq("image_type", "reconstruction")
        .order("sort_order", desc=False)
        .execute()
    )
    return res.data or []


def upload_model_to_storage(local_path: str, vehicle_id: str, filename: str) -> str:
    """
    Sube el modelo .splat a Supabase Storage.
    Retorna la URL pública del archivo.
    """
    sb = get_client()
    storage_path = f"vehicles/{vehicle_id}/{filename}"

    with open(local_path, "rb") as f:
        content_type = "application/octet-stream"
        sb.storage.from_(Config.STORAGE_BUCKET).upload(
            path=storage_path,
            file=f,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    public_url = (
        f"{Config.SUPABASE_URL}/storage/v1/object/public"
        f"/{Config.STORAGE_BUCKET}/{storage_path}"
    )
    logger.info("Modelo subido → %s", public_url)
    return public_url


def mark_job_failed(job_id: str, error_message: str) -> None:
    """Marca el job como fallido en Supabase."""
    sb = get_client()
    sb.table("processing_jobs").update({
        "status": "failed",
        "error_message": error_message[:1000],
        "finished_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).execute()
