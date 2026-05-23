import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise EnvironmentError(f"Variable de entorno requerida no encontrada: {key}")
    return value


class Config:
    SUPABASE_URL: str = _require("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = _require("SUPABASE_SERVICE_ROLE_KEY")

    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:3000")
    WORKER_ID: str = os.getenv("WORKER_ID", "local-worker-1")

    WORK_DIR: Path = Path(os.getenv("WORK_DIR", "/tmp/autosplat_worker"))
    STORAGE_BUCKET: str = os.getenv("STORAGE_BUCKET", "models")

    TRAIN_MAX_ITERATIONS: int = int(os.getenv("TRAIN_MAX_ITERATIONS", "7000"))
    POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL", "30"))
