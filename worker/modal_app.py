"""
Entry point Modal para el worker de Gaussian Splatting.

Deploy:
    modal deploy modal_app.py

La URL del webhook queda en:
    https://<org>--autosplat-worker-process-job.modal.run

Configurar en el backend como MODAL_WEBHOOK_URL.
"""
import sys
from pathlib import Path

import modal

# ── Imagen con todas las dependencias ────────────────────────────────────────
# Usamos la imagen oficial de nerfstudio que ya incluye CUDA, COLMAP y gsplat.
image = (
    modal.Image.from_registry(
        "dromni/nerfstudio:1.1.5",
        add_python="3.11",
    )
    .pip_install([
        "fastapi[standard]==0.115.0",
        "requests==2.31.0",
        "python-dotenv==1.0.0",
        "numpy==1.26.4",
        "plyfile==1.0.3",
        "Pillow==10.3.0",
    ])
    # Copiar el código del worker al contenedor
    .add_local_dir(Path(__file__).parent / "src", remote_path="/worker/src")
)

# ── Secretos (configurar en modal.com → Secrets) ──────────────────────────────
secrets = [modal.Secret.from_name("autosplat-secrets")]

app = modal.App("autosplat-worker", image=image, secrets=secrets)


@app.function(
    gpu="T4",
    timeout=7200,        # 2 horas máximo por job
    memory=16384,        # 16 GB RAM
    cpu=4,
)
@modal.fastapi_endpoint(method="POST")
def process_job(body: dict) -> dict:
    """
    Webhook HTTP que dispara el pipeline de reconstrucción 3D.

    Body esperado:
        { "job_id": "uuid", "vehicle_id": "uuid", "secret": "<MODAL_WEBHOOK_SECRET>" }

    Si MODAL_WEBHOOK_SECRET está definido en el secret de Modal, el body debe
    traer el mismo valor; así solo el backend puede disparar el pipeline.

    Retorna:
        { "status": "ok" | "error", "message": "..." }
        HTTP 500 si el pipeline falla.
    """
    import hmac
    import os
    import logging

    from fastapi import HTTPException

    # Agregar el directorio del worker al path
    sys.path.insert(0, "/worker/src")

    # nerfstudio vive en el user-site de /home/user (python3.10) pero Modal corre como root,
    # así que sin esto los `ns-*` fallan con "No module named nerfstudio". Se usa PYTHONUSERBASE
    # (y no PYTHONPATH) para que Python procese los .pth de las instalaciones editables (bionerf).
    # Se asigna aquí (no en la imagen) para que solo lo hereden los subprocesos y no
    # afecte al Python 3.11 que ejecuta esta función (su user-site, lib/python3.11, no existe).
    os.environ["PYTHONUSERBASE"] = "/home/user/.local"

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    )
    logger = logging.getLogger("modal_worker")

    expected_secret = os.environ.get("MODAL_WEBHOOK_SECRET")
    if expected_secret:
        provided = str(body.get("secret") or "")
        if not hmac.compare_digest(provided.encode(), expected_secret.encode()):
            logger.warning("Webhook rechazado: secreto inválido")
            return {"status": "error", "message": "No autorizado"}
    else:
        logger.warning("MODAL_WEBHOOK_SECRET no configurado: el webhook acepta cualquier llamada")

    job_id = body.get("job_id")
    vehicle_id = body.get("vehicle_id")

    if not job_id or not vehicle_id:
        return {"status": "error", "message": "job_id y vehicle_id son requeridos"}

    logger.info("Job recibido: %s (vehicle=%s)", job_id, vehicle_id)

    # Importar después de ajustar el path y vars de entorno
    os.environ.setdefault("WORKER_ID", f"modal-{os.environ.get('MODAL_TASK_ID', 'local')[:8]}")
    os.environ.setdefault("WORK_DIR", "/tmp/autosplat_worker")

    from db import claim_job_by_id
    from pipeline import run_pipeline

    job = claim_job_by_id(job_id)
    if job is None:
        logger.warning("Job %s no pudo ser reclamado (ya procesado o inexistente)", job_id)
        return {"status": "error", "message": "Job no disponible"}

    if not run_pipeline(job):
        # 500 para que el panel de Modal muestre el fallo (el detalle queda en processing_jobs.error_message)
        raise HTTPException(status_code=500, detail=f"Job {job_id} falló")
    return {"status": "ok", "message": f"Job {job_id} procesado"}
