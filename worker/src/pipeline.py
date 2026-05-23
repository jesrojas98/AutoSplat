"""
Orquestador del pipeline completo: download → COLMAP → train → export → upload.
Reporta progreso al backend en cada etapa.
"""
import logging
import shutil
import time
from pathlib import Path

from config import Config
from db import get_reconstruction_images, mark_job_failed
from api_client import report_progress, complete_job
from steps.download import download_images
from steps.colmap import run_colmap
from steps.train import train_splatfacto
from steps.export import export_and_convert
from steps.upload import upload_model

logger = logging.getLogger(__name__)

# Progreso por etapa (inicio, fin)
_PROGRESS = {
    "downloading_images":   (0,  10),
    "running_colmap":       (10, 35),
    "training_model":       (35, 85),
    "exporting_model":      (85, 95),
    "uploading_model":      (95, 100),
}


def run_pipeline(job: dict) -> None:
    """
    Ejecuta el pipeline completo para un job.
    Maneja errores y limpia el directorio temporal al finalizar.
    """
    job_id = job["id"]
    vehicle_id = job["vehicle_id"]

    work_dir = Config.WORK_DIR / job_id
    work_dir.mkdir(parents=True, exist_ok=True)

    start_time = time.time()

    try:
        _run_steps(job_id, vehicle_id, work_dir, start_time)
    except Exception as exc:
        logger.error("Pipeline falló para job %s: %s", job_id, exc, exc_info=True)
        report_progress(
            job_id,
            status="failed",
            progress=0,
            current_step="failed",
            error_message=str(exc),
        )
        mark_job_failed(job_id, str(exc))
    finally:
        _cleanup(work_dir)


def _run_steps(job_id: str, vehicle_id: str, work_dir: Path, start_time: float) -> None:
    # ── 1. Descargar imágenes ─────────────────────────────────────────────────
    _progress(job_id, "downloading_images", 0)
    images = get_reconstruction_images(vehicle_id)

    if not images:
        raise RuntimeError(
            f"El vehículo {vehicle_id} no tiene imágenes de reconstrucción. "
            "El vendedor debe subir imágenes antes de iniciar el job."
        )

    images_dir = download_images(images, work_dir)
    _progress(job_id, "downloading_images", 100)

    # ── 2. COLMAP — extracción de poses ───────────────────────────────────────
    _progress(job_id, "running_colmap", 0)
    processed_dir = run_colmap(images_dir, work_dir)
    _progress(job_id, "running_colmap", 100)

    # ── 3. Entrenamiento Gaussian Splatting ───────────────────────────────────
    _progress(job_id, "training_model", 0)
    config_path = train_splatfacto(processed_dir, work_dir, job_id)
    _progress(job_id, "training_model", 100)

    # ── 4. Exportar PLY → .splat ──────────────────────────────────────────────
    _progress(job_id, "exporting_model", 0)
    splat_path, num_gaussians = export_and_convert(config_path, work_dir)
    _progress(job_id, "exporting_model", 100)

    # ── 5. Subir a Supabase Storage ───────────────────────────────────────────
    _progress(job_id, "uploading_model", 0)
    upload_result = upload_model(splat_path, vehicle_id)
    _progress(job_id, "uploading_model", 100)

    # ── Completar ─────────────────────────────────────────────────────────────
    elapsed = int(time.time() - start_time)
    complete_job(
        job_id,
        model_url=upload_result["model_url"],
        preview_image_url=upload_result.get("preview_image_url"),
        num_gaussians=num_gaussians,
        processing_time_seconds=elapsed,
    )
    logger.info(
        "Job %s completado en %dm %ds — %d gaussianos.",
        job_id, elapsed // 60, elapsed % 60, num_gaussians,
    )


def _progress(job_id: str, step: str, step_pct: int) -> None:
    """Convierte el progreso dentro de una etapa al porcentaje global."""
    stage_start, stage_end = _PROGRESS[step]
    global_pct = stage_start + int((stage_end - stage_start) * step_pct / 100)
    status = "processing" if global_pct < 100 else "processing"

    report_progress(
        job_id,
        status=status,
        progress=global_pct,
        current_step=step,
    )
    logger.info("[%s] %s — %d%%", job_id[:8], step, global_pct)


def _cleanup(work_dir: Path) -> None:
    """Elimina el directorio temporal del job."""
    try:
        shutil.rmtree(work_dir, ignore_errors=True)
        logger.debug("Directorio temporal eliminado: %s", work_dir)
    except Exception as exc:
        logger.warning("No se pudo limpiar %s: %s", work_dir, exc)
