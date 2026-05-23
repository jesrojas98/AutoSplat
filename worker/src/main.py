"""
Entry point del worker de Gaussian Splatting.
Hace polling a la base de datos buscando jobs pendientes y los procesa.

Uso:
    python main.py          # loop continuo
    python main.py --once   # procesa un job y sale
"""
import argparse
import logging
import signal
import sys
import time

from config import Config
from db import claim_next_pending_job
from pipeline import run_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("worker")

_shutdown = False


def _handle_signal(signum, frame):
    global _shutdown
    logger.info("Señal %s recibida — cerrando al finalizar el job actual...", signal.Signals(signum).name)
    _shutdown = True


def _process_once() -> bool:
    """Intenta reclamar y procesar un job. Retorna True si procesó algo."""
    job = claim_next_pending_job()
    if job is None:
        return False

    logger.info(
        "Job reclamado: %s (vehicle=%s)",
        job["id"], job.get("vehicle_id", "?"),
    )
    run_pipeline(job)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="AutoSplat Gaussian Splatting Worker")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Procesa un solo job y sale (útil para pruebas o runners de CI).",
    )
    args = parser.parse_args()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    logger.info(
        "Worker iniciado (worker_id=%s, poll=%ds, max_iter=%d).",
        Config.WORKER_ID,
        Config.POLL_INTERVAL,
        Config.TRAIN_MAX_ITERATIONS,
    )

    if args.once:
        processed = _process_once()
        if not processed:
            logger.info("No hay jobs pendientes.")
        sys.exit(0)

    # ── Loop de polling ───────────────────────────────────────────────────────
    while not _shutdown:
        try:
            processed = _process_once()
            if not processed:
                logger.debug("Sin jobs pendientes — esperando %ds...", Config.POLL_INTERVAL)
                _sleep_interruptible(Config.POLL_INTERVAL)
        except Exception as exc:
            logger.error("Error inesperado en el loop principal: %s", exc, exc_info=True)
            _sleep_interruptible(min(Config.POLL_INTERVAL, 30))

    logger.info("Worker detenido correctamente.")


def _sleep_interruptible(seconds: int) -> None:
    """Sleep fragmentado para responder a señales rápidamente."""
    deadline = time.monotonic() + seconds
    while not _shutdown and time.monotonic() < deadline:
        time.sleep(1)


if __name__ == "__main__":
    main()
