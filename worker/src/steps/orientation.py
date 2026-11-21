"""
Deja todas las fotos de un trabajo con la misma orientación antes de COLMAP.

ns-process-data corre COLMAP con una sola cámara para todas las fotos (single_camera): una foto vertical de
1080×1920 entre fotos horizontales de 1920×1080 (por ejemplo, dos capturas guiadas en modos distintos, o fotos
sueltas agregadas) rompe la calibración. Las fotos cuya orientación difiere de la mayoría, con el mismo tamaño
pero ancho y alto intercambiados, se giran 90°: el contenido queda de lado, pero COLMAP empareja igual (SIFT no
depende de la rotación) y la cámara sigue siendo la misma (mismo sensor, píxeles cuadrados).
"""
import logging
from collections import Counter
from pathlib import Path

from PIL import Image

logger = logging.getLogger(__name__)

_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def unify_orientation(images_dir: Path) -> int:
    """Gira las fotos con ancho y alto intercambiados respecto de la mayoría. Retorna cuántas giró."""
    paths = sorted(p for p in Path(images_dir).iterdir() if p.suffix.lower() in _IMAGE_EXTS)
    sizes = {}
    for p in paths:
        with Image.open(p) as im:
            sizes[p] = im.size
    if not sizes:
        return 0

    (w, h), _ = Counter(sizes.values()).most_common(1)[0]
    if w == h:
        return 0
    rotated = 0
    for p, size in sizes.items():
        if size != (h, w):
            continue
        with Image.open(p) as im:
            out = im.transpose(Image.Transpose.ROTATE_270)   # 90° horario
            out.load()
        params = {"quality": 95} if p.suffix.lower() in (".jpg", ".jpeg") else {}
        out.save(p, **params)
        rotated += 1

    if rotated:
        logger.info("Orientación: %d de %d fotos giradas para quedar en %dx%d como la mayoría",
                    rotated, len(sizes), w, h)
    return rotated
