"""
Sube el modelo .splat a Supabase Storage y genera una imagen de preview.
"""
import logging
from pathlib import Path

from db import upload_model_to_storage

logger = logging.getLogger(__name__)


def upload_model(splat_path: Path, vehicle_id: str) -> dict:
    """
    Sube el .splat a Supabase Storage.

    Returns:
        Dict con model_url y preview_image_url (si se generó).
    """
    logger.info("Subiendo modelo a Supabase Storage...")

    model_url = upload_model_to_storage(
        local_path=str(splat_path),
        vehicle_id=vehicle_id,
        filename="model.splat",
    )

    result = {"model_url": model_url, "preview_image_url": None}

    # Generar preview si hay imágenes en el mismo job dir (primera imagen descargada)
    images_dir = splat_path.parent / "images"
    if images_dir.exists():
        preview_url = _generate_and_upload_preview(images_dir, vehicle_id)
        result["preview_image_url"] = preview_url

    return result


def _generate_and_upload_preview(images_dir: Path, vehicle_id: str) -> str | None:
    """Usa la primera imagen de entrada como preview del modelo 3D."""
    try:
        from PIL import Image  # type: ignore

        images = sorted(images_dir.iterdir())
        if not images:
            return None

        preview_src = images[len(images) // 2]  # imagen del medio = representativa
        preview_path = images_dir.parent / "preview.jpg"

        img = Image.open(preview_src)
        img.thumbnail((800, 600))
        img.save(preview_path, "JPEG", quality=85)

        return upload_model_to_storage(
            local_path=str(preview_path),
            vehicle_id=vehicle_id,
            filename="preview.jpg",
        )
    except Exception as exc:
        logger.warning("No se pudo generar preview: %s", exc)
        return None
