"""
Genera un transforms.json sintético para el dataset de turntable (40 imágenes
a 9° de separación) y configura el directorio de trabajo del pipeline.

Uso: python create_test_transforms.py <job_id> <vehicle_id>
"""
import json
import sys
import shutil
import math
from pathlib import Path

JOB_ID = sys.argv[1] if len(sys.argv) > 1 else None
VEHICLE_ID = sys.argv[2] if len(sys.argv) > 2 else None

if not JOB_ID or not VEHICLE_ID:
    print("Uso: python create_test_transforms.py <job_id> <vehicle_id>")
    sys.exit(1)

WORK_DIR = Path(f"/tmp/autosplat_worker/{JOB_ID}")
IMAGES_DIR = WORK_DIR / "images"
PROCESSED_DIR = WORK_DIR / "processed"
IMAGES_OUT_DIR = PROCESSED_DIR / "images"

# Descargar imágenes desde Supabase al directorio de trabajo
print(f"Configurando directorio de trabajo en {WORK_DIR}")
WORK_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_OUT_DIR.mkdir(parents=True, exist_ok=True)

# Descargar imágenes usando api_client de Supabase
import os
import sys
sys.path.insert(0, str(Path(__file__).parent / "src"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from supabase import create_client
import httpx

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

res = supabase.from_("vehicle_images").select("image_url, sort_order") \
    .eq("vehicle_id", VEHICLE_ID) \
    .eq("image_type", "reconstruction") \
    .order("sort_order") \
    .execute()

images_meta = res.data
print(f"Descargando {len(images_meta)} imágenes...")

downloaded = []
for meta in images_meta:
    url = meta["image_url"]
    idx = meta["sort_order"]
    filename = f"img_{idx:03d}.jpg"
    dest = IMAGES_DIR / filename

    if not dest.exists():
        resp = httpx.get(url, timeout=30)
        resp.raise_for_status()
        dest.write_bytes(resp.content)

    # Copiar a processed/images con prefijo frame_
    frame_name = f"frame_{filename}"
    shutil.copy2(dest, IMAGES_OUT_DIR / frame_name)
    downloaded.append(frame_name)

print(f"  {len(downloaded)} imágenes copiadas a {IMAGES_OUT_DIR}")

# Generar transforms.json para turntable circular
def look_at_c2w(pos, target=(0.0, 0.0, 0.0), up=(0.0, 0.0, 1.0)):
    """Matriz camera-to-world (convención NeRF: z apunta LEJOS de la escena)."""
    px, py, pz = pos
    tx, ty, tz = target
    ux, uy, uz = up

    # backward = pos - target (z de cámara apunta lejos de la escena)
    bx, by, bz = px - tx, py - ty, pz - tz
    bn = math.sqrt(bx**2 + by**2 + bz**2)
    bx, by, bz = bx / bn, by / bn, bz / bn

    # right = cross(up, backward)
    rx = uy * bz - uz * by
    ry = uz * bx - ux * bz
    rz = ux * by - uy * bx
    rn = math.sqrt(rx**2 + ry**2 + rz**2)
    rx, ry, rz = rx / rn, ry / rn, rz / rn

    # new_up = cross(backward, right)
    nux = by * rz - bz * ry
    nuy = bz * rx - bx * rz
    nuz = bx * ry - by * rx

    return [
        [rx,  nux, bx, px],
        [ry,  nuy, by, py],
        [rz,  nuz, bz, pz],
        [0.0, 0.0, 0.0, 1.0],
    ]

n = len(downloaded)
radius = 4.0
height = 0.5
# COLMAP estimó focal length = 960px para 800x600
fl = 960.0
w, h_px = 800, 600

frames = []
for i, fname in enumerate(sorted(downloaded)):
    angle = 2 * math.pi * i / n
    pos = (radius * math.cos(angle), radius * math.sin(angle), height)
    frames.append({
        "file_path": f"images/{fname}",
        "transform_matrix": look_at_c2w(pos),
    })

transforms = {
    "camera_model": "OPENCV",
    "fl_x": fl, "fl_y": fl,
    "cx": w / 2, "cy": h_px / 2,
    "w": w, "h": h_px,
    "k1": 0.0, "k2": 0.0, "p1": 0.0, "p2": 0.0,
    "frames": frames,
}

out = PROCESSED_DIR / "transforms.json"
out.write_text(json.dumps(transforms, indent=2))
print(f"\n✓ transforms.json generado en {out}")
print(f"  {len(frames)} cámaras, radio={radius}, focal={fl}px")
print(f"\nAhora crea el job y corre el worker.")
