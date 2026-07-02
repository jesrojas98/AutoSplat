"""
Genera un set de imágenes sintéticas tipo turntable (objeto con textura
visto desde distintos ángulos) para usar como input de prueba de
test_setup.py, ya que no requiere fotos reales de un vehículo.

No es fotorrealista: dibuja formas con textura suficiente para que
COLMAP pueda extraer y matchear features SIFT entre frames.

Uso: python generate_synthetic_images.py [n_images] [output_dir]
"""
import math
import random
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

N_IMAGES = int(sys.argv[1]) if len(sys.argv) > 1 else 40
OUT_DIR = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(tempfile.gettempdir()) / "synthetic_car_test"

W, H = 800, 600
random.seed(42)

# Puntos de textura fijos en "espacio del objeto" (para que roten de forma
# consistente entre frames y COLMAP pueda triangular correspondencias).
N_MARKERS = 120
markers = [
    (
        random.uniform(-1, 1),
        random.uniform(-0.4, 0.4),
        random.uniform(-1, 1),
        (random.randint(30, 255), random.randint(30, 255), random.randint(30, 255)),
    )
    for _ in range(N_MARKERS)
]


def project(x, y, z, angle):
    """Rota el punto (x,y,z) alrededor del eje Y por `angle` y proyecta a 2D."""
    ca, sa = math.cos(angle), math.sin(angle)
    rx = x * ca + z * sa
    rz = -x * sa + z * ca
    ry = y

    cam_dist = 4.0
    depth = cam_dist + rz
    if depth <= 0.1:
        depth = 0.1
    scale = 500.0 / depth
    sx = W / 2 + rx * scale
    sy = H / 2 - ry * scale
    return sx, sy, depth


def render_frame(angle: float) -> Image.Image:
    img = Image.new("RGB", (W, H), (18, 18, 24))
    draw = ImageDraw.Draw(img)

    projected = [(*project(x, y, z, angle), color) for x, y, z, color in markers]
    projected.sort(key=lambda p: -p[2])  # pintar de atrás hacia adelante

    for sx, sy, depth, color in projected:
        r = max(2, int(18 / depth))
        draw.ellipse([sx - r, sy - r, sx + r, sy + r], fill=color, outline=(0, 0, 0))

    # Marco/ruido de fondo para dar más textura (ayuda a SIFT)
    for _ in range(60):
        x0 = random.uniform(0, W)
        y0 = random.uniform(0, H)
        draw.point((x0, y0), fill=(60, 60, 70))

    return img


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for i in range(N_IMAGES):
        angle = 2 * math.pi * i / N_IMAGES
        frame = render_frame(angle)
        path = OUT_DIR / f"frame_{i:03d}.jpg"
        frame.save(path, "JPEG", quality=90)

    print(f"{N_IMAGES} imágenes generadas en {OUT_DIR}")


if __name__ == "__main__":
    main()
