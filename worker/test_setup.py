"""
Script de prueba: descarga el dataset 'bonsai' de Nerfstudio como imágenes de prueba,
las sube a Supabase Storage, crea un vehículo de test y un job pendiente.

Uso: python test_setup.py
"""
import os
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Obtener el primer usuario admin para asignarle el vehículo ────────────────
def get_admin_user():
    res = supabase.from_("users").select("id").eq("role", "admin").limit(1).single().execute()
    if not res.data:
        print("ERROR: No se encontró usuario admin. Ejecuta seed:admin primero.")
        sys.exit(1)
    return res.data["id"]

# ── Descargar imágenes de muestra (dataset público pequeño) ───────────────────
LOCAL_IMAGES_DIR = Path("/tmp/synthetic_car_test")

def download_sample_images(dest: Path) -> list[Path]:
    if not LOCAL_IMAGES_DIR.exists() or not list(LOCAL_IMAGES_DIR.glob("*.jpg")):
        raise RuntimeError(
            f"No se encontraron imágenes en {LOCAL_IMAGES_DIR}. "
            "Ejecuta primero el script de generación de imágenes sintéticas."
        )
    images = sorted(LOCAL_IMAGES_DIR.glob("*.jpg"))
    print(f"Usando {len(images)} imágenes locales de {LOCAL_IMAGES_DIR}")
    return images

def upload_image(local_path: Path, vehicle_id: str, filename: str) -> str:
    storage_path = f"{vehicle_id}/reconstruction/{filename}"
    ctype = "image/jpeg" if local_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
    with open(local_path, "rb") as f:
        supabase.storage.from_("vehicle-images").upload(
            storage_path, f, {"content-type": ctype, "upsert": "true"}
        )
    return supabase.storage.from_("vehicle-images").get_public_url(storage_path)

def ensure_buckets():
    existing = [b.name for b in supabase.storage.list_buckets()]
    for bucket in ["vehicle-images", "models"]:
        if bucket not in existing:
            supabase.storage.create_bucket(bucket, options={"public": True})
            print(f"  ✓ Bucket '{bucket}' creado")
        else:
            print(f"  · Bucket '{bucket}' ya existe")

def main():
    admin_id = get_admin_user()
    print(f"Usuario admin: {admin_id}")

    print("Verificando buckets de Storage...")
    ensure_buckets()

    # 1. Crear vehículo de prueba
    vehicle_id = str(uuid.uuid4())
    supabase.from_("vehicles").insert({
        "id": vehicle_id,
        "seller_id": admin_id,
        "brand": "TestBrand",
        "model": "TestModel",
        "year": 2024,
        "price": 10000,
        "mileage": 0,
        "transmission": "automatic",
        "fuel_type": "electric",
        "body_type": "sedan",
        "color": "negro",
        "doors": 4,
        "location": "Santiago",
        "region": "Metropolitana",
        "description": "Vehículo de prueba para el worker",
        "status": "published",
    }).execute()
    print(f"Vehículo creado: {vehicle_id}")

    # 2. Cargar imágenes de muestra
    images = download_sample_images(Path("/tmp/synthetic_car_test"))

    if len(images) < 3:
        print("ERROR: No se pudieron descargar suficientes imágenes.")
        sys.exit(1)

    print("Subiendo imágenes a Supabase Storage...")
    image_records = []
    for img in images:
        url = upload_image(img, vehicle_id, img.name)
        rec = supabase.from_("vehicle_images").insert({
            "vehicle_id": vehicle_id,
            "image_url": url,
            "thumbnail_url": url,
            "image_type": "reconstruction",
            "sort_order": len(image_records),
        }).execute()
        image_records.append(rec.data[0] if rec.data else {})
        print(f"  ✓ {img.name} → {url[:60]}...")

    # 3. Crear registro vehicle_3d_models + job pendiente (mismo flujo que el backend)
    model_id = str(uuid.uuid4())
    supabase.from_("vehicle_3d_models").insert({
        "id": model_id,
        "vehicle_id": vehicle_id,
        "status": "pending",
        "input_images_count": len(images),
    }).execute()

    job_id = str(uuid.uuid4())
    supabase.from_("processing_jobs").insert({
        "id": job_id,
        "vehicle_id": vehicle_id,
        "model_id": model_id,
        "status": "pending",
        "progress": 0,
        "current_step": "pending",
    }).execute()

    supabase.from_("vehicles").update({"has_3d_model": True}).eq("id", vehicle_id).execute()

    print(f"\n✓ Todo listo para la prueba:")
    print(f"  vehicle_id = {vehicle_id}")
    print(f"  job_id     = {job_id}")
    print(f"\nAhora ejecuta el worker:")
    print(f"  source ~/autosplat-env/bin/activate")
    print(f"  cd /Users/relke/AutoSplat/worker/src")
    print(f"  python main.py --once")

if __name__ == "__main__":
    main()
