"""
Entry point Modal para el worker de Gaussian Splatting.

Deploy:
    modal deploy modal_app.py

La URL del webhook queda en:
    https://<org>--autosplat-worker-process-job.modal.run

Configurar en el backend como MODAL_WEBHOOK_URL.

Arquitectura:
    backend ──POST──▶ process_job (webhook, CPU, responde al instante)
                          └─ .spawn() ──▶ run_job (GPU T4, hasta 3 h, independiente del HTTP)

El pipeline NO corre dentro de la petición del webhook: Modal cancela una petición web cuyo cliente
se desconectó (el backend corta a los 10 s) a los ~2 minutos, y eso mataba el entrenamiento a medias.
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
    # Segmentación del vehículo (steps/segment_cars.py): SAM + pesos de SAM vit_h y de Mask R-CNN,
    # instalados para el Python 3.10 de nerfstudio (que es el que tiene torch) en /opt/seg.
    .run_commands(
        "/usr/bin/python3.10 -m pip install --no-deps --target /opt/seg segment-anything==1.0",
        "mkdir -p /opt/seg/weights && /usr/bin/python3.10 -c \"import urllib.request as u; "
        "u.urlretrieve('https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth', "
        "'/opt/seg/weights/sam_vit_h_4b8939.pth')\"",
        "PYTHONUSERBASE=/home/user/.local TORCH_HOME=/opt/seg/torch /usr/bin/python3.10 -c "
        "\"from torchvision.models.detection import maskrcnn_resnet50_fpn_v2 as m; m(weights='DEFAULT')\"",
    )
    # Copiar el código del worker al contenedor
    .add_local_dir(Path(__file__).parent / "src", remote_path="/worker/src")
)

# ── Secretos (configurar en modal.com → Secrets) ──────────────────────────────
secrets = [modal.Secret.from_name("autosplat-secrets")]

app = modal.App("autosplat-worker", image=image, secrets=secrets)


@app.function(
    # T4: la GPU más barata de Modal. El perfil de calidad tarda ~90 min aquí (~30 min en una L40S, que cuesta
    # ~3,5x más por hora). Para cambiar de GPU basta esta línea (cuda_arch_list se adapta sola a la GPU).
    gpu="T4",
    timeout=10800,       # 3 horas máximo por job (en T4 el entrenamiento de calidad ronda 1,5 h)
    memory=16384,        # 16 GB RAM
    cpu=4,
)
def run_job(job_id: str, vehicle_id: str) -> dict:
    """
    Ejecuta el pipeline de reconstrucción 3D de un job. Se lanza con .spawn() desde el webhook,
    así que su vida no depende de la conexión HTTP del backend.

    Lanza RuntimeError si el pipeline falla (el detalle queda en processing_jobs.error_message),
    para que el panel de Modal lo muestre como fallido.
    """
    import os
    import logging

    # Agregar el directorio del worker al path
    sys.path.insert(0, "/worker/src")

    # nerfstudio vive en el user-site de /home/user (python3.10) pero Modal corre como root,
    # así que sin esto los `ns-*` fallan con "No module named nerfstudio". Se usa PYTHONUSERBASE
    # (y no PYTHONPATH) para que Python procese los .pth de las instalaciones editables (bionerf).
    # Se asigna aquí (no en la imagen) para que solo lo hereden los subprocesos y no
    # afecte al Python 3.11 que ejecuta esta función (su user-site, lib/python3.11, no existe).
    os.environ["PYTHONUSERBASE"] = "/home/user/.local"

    # La imagen trae TORCH_CUDA_ARCH_LIST=8.9+PTX y gsplat compila sus kernels CUDA para eso: en la
    # T4 (7.5) el entrenamiento falla con "no kernel image is available". Se fija la arquitectura real.
    from steps.hardware import cuda_arch_list

    arch = cuda_arch_list()
    if arch:
        os.environ["TORCH_CUDA_ARCH_LIST"] = arch

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    )
    logger = logging.getLogger("modal_worker")

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
        raise RuntimeError(f"Job {job_id} falló")
    return {"status": "ok", "message": f"Job {job_id} procesado"}


@app.function(timeout=60)
@modal.fastapi_endpoint(method="POST")
def process_job(body: dict) -> dict:
    """
    Webhook HTTP que encola el pipeline de reconstrucción 3D y responde de inmediato.
    Corre en CPU: solo valida la llamada y lanza `run_job` (GPU) en segundo plano.

    Body esperado:
        { "job_id": "uuid", "vehicle_id": "uuid", "secret": "<MODAL_WEBHOOK_SECRET>" }

    Si MODAL_WEBHOOK_SECRET está definido en el secret de Modal, el body debe
    traer el mismo valor; así solo el backend puede disparar el pipeline.

    Retorna:
        { "status": "queued" | "error", "message": "..." }
    """
    import hmac
    import logging
    import os
    import uuid

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    )
    logger = logging.getLogger("modal_webhook")

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

    # Solo UUID válidos: evita lanzar una GPU con basura
    try:
        job_id = str(uuid.UUID(str(job_id)))
        vehicle_id = str(uuid.UUID(str(vehicle_id)))
    except ValueError:
        return {"status": "error", "message": "job_id y vehicle_id deben ser UUID"}

    call = run_job.spawn(job_id, vehicle_id)
    logger.info("Job %s encolado (vehicle=%s, call=%s)", job_id, vehicle_id, call.object_id)
    return {"status": "queued", "message": f"Job {job_id} encolado"}
