"""
Prueba las etapas export+upload del pipeline con un .ply sintético.
Bypassa el entrenamiento (que requiere CUDA) para verificar:
  1. _ply_to_splat conversión PLY → .splat
  2. upload_model → Supabase Storage
  3. Actualización de DB

Uso: python test_export_upload.py <job_id> <vehicle_id>
"""
import os, sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")
from config import Config

import numpy as np
from plyfile import PlyData, PlyElement  # type: ignore

JOB_ID = sys.argv[1] if len(sys.argv) > 1 else None
VEHICLE_ID = sys.argv[2] if len(sys.argv) > 2 else None

if not JOB_ID or not VEHICLE_ID:
    print("Uso: python test_export_upload.py <job_id> <vehicle_id>")
    sys.exit(1)

WORK_DIR = Config.WORK_DIR / JOB_ID
WORK_DIR.mkdir(parents=True, exist_ok=True)

# ── 1. Generar .ply sintético con 1000 Gaussianos ────────────────────────────
print("Generando .ply sintético con 1000 Gaussianos...")

N = 1000
rng = np.random.default_rng(42)

# Gaussianos aleatorios en una esfera de radio 1
theta = rng.uniform(0, 2 * np.pi, N)
phi = np.arccos(rng.uniform(-1, 1, N))
r = rng.uniform(0.5, 1.0, N)
x = (r * np.sin(phi) * np.cos(theta)).astype(np.float32)
y = (r * np.sin(phi) * np.sin(theta)).astype(np.float32)
z = (r * np.cos(phi)).astype(np.float32)

scales = rng.uniform(-5, -3, (N, 3)).astype(np.float32)  # log-scale
quats = rng.standard_normal((N, 4)).astype(np.float32)
quats /= np.linalg.norm(quats, axis=1, keepdims=True)

# SH DC component: rojo-ish
f_dc = rng.uniform(-0.5, 0.5, (N, 3)).astype(np.float32)
f_dc[:, 0] = 1.0  # R canal DC alto

opacity = rng.uniform(0, 2, N).astype(np.float32)  # pre-sigmoid

ply_data = np.array(
    list(zip(x, y, z,
             scales[:, 0], scales[:, 1], scales[:, 2],
             quats[:, 0], quats[:, 1], quats[:, 2], quats[:, 3],
             f_dc[:, 0], f_dc[:, 1], f_dc[:, 2],
             opacity)),
    dtype=[
        ("x", "f4"), ("y", "f4"), ("z", "f4"),
        ("scale_0", "f4"), ("scale_1", "f4"), ("scale_2", "f4"),
        ("rot_0", "f4"), ("rot_1", "f4"), ("rot_2", "f4"), ("rot_3", "f4"),
        ("f_dc_0", "f4"), ("f_dc_1", "f4"), ("f_dc_2", "f4"),
        ("opacity", "f4"),
    ]
)

export_dir = WORK_DIR / "export"
export_dir.mkdir(exist_ok=True)
ply_path = export_dir / "splat.ply"
PlyData([PlyElement.describe(ply_data, "vertex")]).write(str(ply_path))
print(f"  PLY generado: {ply_path} ({ply_path.stat().st_size / 1024:.1f} KB)")

# ── 2. Convertir PLY → .splat ────────────────────────────────────────────────
print("Convirtiendo PLY → .splat...")
from steps.export import _ply_to_splat
splat_path, n_gaussians = _ply_to_splat(ply_path, WORK_DIR / "model.splat")
print(f"  .splat: {splat_path} ({splat_path.stat().st_size / 1024:.1f} KB, {n_gaussians} gaussianos)")

# ── 3. Subir a Supabase Storage ──────────────────────────────────────────────
print("Subiendo modelo a Supabase Storage...")
from steps.upload import upload_model

# Crear directorio images con una imagen de muestra para el preview
images_dir = WORK_DIR / "images"
images_dir.mkdir(exist_ok=True)
sample = sorted((Path(tempfile.gettempdir()) / "synthetic_car_test").glob("*.jpg"))
if sample:
    import shutil
    shutil.copy2(sample[len(sample)//2], images_dir / "img_preview.jpg")

result = upload_model(splat_path, VEHICLE_ID)
print(f"  model_url: {result['model_url'][:80]}...")
print(f"  preview_url: {(result.get('preview_image_url') or 'N/A')[:80]}")

# ── 4. Marcar job como completado via api_client ────────────────────────────
print("Actualizando base de datos...")
from api_client import complete_job
complete_job(
    JOB_ID,
    model_url=result["model_url"],
    preview_image_url=result.get("preview_image_url"),
    num_gaussians=n_gaussians,
    processing_time_seconds=5,
)
print(f"  Job {JOB_ID} marcado como completado")

print(f"\n✓ Test export+upload completado exitosamente!")
print(f"  vehicle_id: {VEHICLE_ID}")
print(f"  model_url: {result['model_url']}")
