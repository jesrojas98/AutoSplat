"""
Descarga las imágenes de reconstrucción desde sus URLs (Cloudinary) al disco local.
"""
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

logger = logging.getLogger(__name__)

_TIMEOUT = 30
_MAX_WORKERS = 8


def download_images(image_records: list[dict], dest_dir: Path) -> Path:
    """
    Descarga todas las imágenes al directorio `dest_dir/images/`.
    Retorna el path del directorio con las imágenes descargadas.

    Args:
        image_records: Lista de dicts con 'image_url' y 'sort_order'.
        dest_dir: Directorio base del job.
    """
    images_dir = dest_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    if not image_records:
        raise ValueError("No hay imágenes de reconstrucción para descargar.")

    logger.info("Descargando %d imágenes...", len(image_records))

    def _download_one(record: dict) -> None:
        url = record["image_url"]
        idx = record.get("sort_order", 0)
        # Extraer extensión de la URL (Cloudinary incluye .jpg/.png al final)
        ext = url.rsplit(".", 1)[-1].split("?")[0].lower()
        if ext not in ("jpg", "jpeg", "png", "webp"):
            ext = "jpg"
        filename = images_dir / f"img_{idx:04d}.{ext}"

        r = requests.get(url, timeout=_TIMEOUT, stream=True)
        r.raise_for_status()
        with open(filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    errors: list[str] = []
    with ThreadPoolExecutor(max_workers=_MAX_WORKERS) as pool:
        futures = {pool.submit(_download_one, rec): rec for rec in image_records}
        for i, future in enumerate(as_completed(futures), 1):
            try:
                future.result()
                logger.debug("  [%d/%d] descargada", i, len(image_records))
            except Exception as exc:
                rec = futures[future]
                errors.append(f"{rec['image_url']}: {exc}")
                logger.warning("Error descargando %s: %s", rec["image_url"], exc)

    downloaded = list(images_dir.iterdir())
    if len(downloaded) < 3:
        raise RuntimeError(
            f"Se necesitan al menos 3 imágenes para reconstrucción. "
            f"Descargadas: {len(downloaded)}. Errores: {errors}"
        )

    logger.info("Descarga completada: %d imágenes en %s", len(downloaded), images_dir)
    return images_dir
