"""
Crea un vehículo demo realista y dispara el pipeline 3D en Modal.

Genera imágenes sintéticas de un auto rojo con PIL (no depende de URLs externas).

Uso:
    python seed_demo_vehicle.py

Accede a Supabase directamente con la service role key.
"""
import io
import os
import math
import uuid
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
MODAL_WEBHOOK = os.environ.get("MODAL_WEBHOOK_URL", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def log(msg): print(f"  {msg}")


def sb_insert(table: str, data: dict) -> dict:
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=data)
    r.raise_for_status()
    return r.json()[0]


def upload_to_storage(bucket: str, path: str, data: bytes, content_type: str) -> str:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    r = requests.post(url, headers=headers, data=data)
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Storage upload failed {r.status_code}: {r.text}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


def make_car_image(angle_index: int, total: int, width: int = 800, height: int = 600) -> bytes:
    """Generate a synthetic car photo using PIL: red car silhouette on grey background."""
    from PIL import Image, ImageDraw

    hue = (angle_index / max(total, 1)) * 360
    bg_r = int(40 + 20 * math.sin(math.radians(hue)))
    bg_g = int(40 + 20 * math.cos(math.radians(hue)))
    bg_b = 50

    img = Image.new("RGB", (width, height), (bg_r, bg_g, bg_b))
    draw = ImageDraw.Draw(img)

    # Ground
    draw.rectangle([0, height * 2 // 3, width, height], fill=(30, 30, 30))

    # Car body
    body_y = height // 3
    body_h = height // 3
    draw.rounded_rectangle(
        [width // 8, body_y, width * 7 // 8, body_y + body_h],
        radius=20,
        fill=(180, 20, 20),
    )
    # Roof
    roof_x1, roof_y1 = width * 3 // 8, body_y - height // 7
    roof_x2, roof_y2 = width * 5 // 8, body_y
    draw.polygon(
        [(roof_x1, roof_y2), (roof_x2, roof_y2), (roof_x2 - 20, roof_y1), (roof_x1 + 20, roof_y1)],
        fill=(150, 15, 15),
    )
    # Windows
    draw.rectangle([roof_x1 + 25, roof_y1 + 5, (roof_x1 + roof_x2) // 2 - 5, roof_y2 - 5], fill=(100, 160, 200))
    draw.rectangle([(roof_x1 + roof_x2) // 2 + 5, roof_y1 + 5, roof_x2 - 25, roof_y2 - 5], fill=(100, 160, 200))

    # Wheels
    wheel_y = body_y + body_h - 10
    for wx in [width // 4, width * 3 // 4]:
        draw.ellipse([wx - 35, wheel_y - 35, wx + 35, wheel_y + 35], fill=(20, 20, 20))
        draw.ellipse([wx - 20, wheel_y - 20, wx + 20, wheel_y + 20], fill=(60, 60, 60))

    # Headlights / taillights
    light_color = (255, 220, 80) if angle_index % 2 == 0 else (220, 50, 50)
    draw.ellipse([width // 8 + 5, body_y + 10, width // 8 + 30, body_y + 30], fill=light_color)
    draw.ellipse([width * 7 // 8 - 30, body_y + 10, width * 7 // 8 - 5, body_y + 30], fill=light_color)

    # Angle label
    draw.rectangle([10, 10, 150, 35], fill=(0, 0, 0, 180))
    draw.text((15, 15), f"Angle {angle_index + 1}/{total}", fill=(255, 255, 255))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def get_seller_id() -> str:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/users?select=id&role=eq.seller&limit=1",
        headers=HEADERS,
    )
    r.raise_for_status()
    if r.json():
        return r.json()[0]["id"]
    r2 = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=id&limit=1", headers=HEADERS)
    r2.raise_for_status()
    return r2.json()[0]["id"]


def main():
    print("\n🚗  Creando vehículo demo — Toyota Corolla GR Sport 2023\n")

    vehicle_id = str(uuid.uuid4())
    model_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())

    # Seller
    log("Buscando usuario vendedor...")
    seller_id = get_seller_id()
    log(f"✓ Usando seller: {seller_id[:8]}...")

    # Generar imágenes
    N_GALLERY = 3
    N_RECON = 24

    log(f"Generando {N_GALLERY} fotos de galería (PIL)...")
    gallery_images = [make_car_image(i, N_GALLERY, 1280, 960) for i in range(N_GALLERY)]
    log(f"✓ {len(gallery_images)} fotos de galería generadas")

    log(f"Generando {N_RECON} fotos de reconstrucción (PIL)...")
    recon_images = [make_car_image(i, N_RECON, 800, 600) for i in range(N_RECON)]
    log(f"✓ {len(recon_images)} fotos de reconstrucción generadas")

    # Subir galería
    log("Subiendo fotos de galería a Supabase Storage...")
    image_rows = []
    for i, data in enumerate(gallery_images):
        path = f"{vehicle_id}/gallery/gallery_{i:02d}.jpg"
        url = upload_to_storage("vehicle-images", path, data, "image/jpeg")
        image_rows.append({
            "vehicle_id": vehicle_id,
            "image_url": url,
            "thumbnail_url": url,
            "image_type": "thumbnail" if i == 0 else "gallery",
            "sort_order": i,
        })
    log(f"✓ {len(image_rows)} fotos de galería subidas")

    # Subir reconstrucción
    log("Subiendo fotos de reconstrucción a Supabase Storage...")
    for i, data in enumerate(recon_images):
        path = f"{vehicle_id}/reconstruction/recon_{i:02d}.jpg"
        url = upload_to_storage("vehicle-images", path, data, "image/jpeg")
        image_rows.append({
            "vehicle_id": vehicle_id,
            "image_url": url,
            "thumbnail_url": url,
            "image_type": "reconstruction",
            "sort_order": i,
        })
    log(f"✓ {N_RECON} fotos de reconstrucción subidas")

    # Crear vehículo
    log("Creando vehículo en base de datos...")
    sb_insert("vehicles", {
        "id": vehicle_id,
        "seller_id": seller_id,
        "brand": "Toyota",
        "model": "Corolla GR Sport",
        "year": 2023,
        "price": 18500000,
        "mileage": 12500,
        "transmission": "automatic",
        "fuel_type": "gasoline",
        "body_type": "Hatchback",
        "color": "Rojo",
        "doors": 5,
        "location": "Santiago",
        "region": "Metropolitana",
        "description": "Toyota Corolla GR Sport en excelente estado. Un dueño, mantenciones al día en concesionario oficial. Equipamiento completo: pantalla táctil 9\", cámara 360°, frenos Brembo, suspensión sport GR.",
        "status": "published",
        "has_3d_model": True,
    })
    log(f"✓ Vehículo creado: {vehicle_id[:8]}...")

    # Insertar imágenes
    r = requests.post(f"{SUPABASE_URL}/rest/v1/vehicle_images", headers=HEADERS, json=image_rows)
    r.raise_for_status()
    log(f"✓ {len(image_rows)} registros de imágenes guardados")

    # Crear vehicle_3d_models
    sb_insert("vehicle_3d_models", {
        "id": model_id,
        "vehicle_id": vehicle_id,
        "status": "pending",
        "input_images_count": N_RECON,
    })
    log(f"✓ vehicle_3d_models creado: {model_id[:8]}...")

    # Crear processing_job
    sb_insert("processing_jobs", {
        "id": job_id,
        "vehicle_id": vehicle_id,
        "model_id": model_id,
        "status": "pending",
        "progress": 0,
        "current_step": "validating_images",
    })
    log(f"✓ processing_job creado: {job_id[:8]}...")

    # Disparar Modal
    if MODAL_WEBHOOK:
        log("Disparando Modal worker...")
        try:
            r = requests.post(MODAL_WEBHOOK, json={"job_id": job_id, "vehicle_id": vehicle_id}, timeout=15)
            if r.ok:
                log(f"✓ Modal respondió: {r.json()}")
            else:
                log(f"⚠ Modal respondió {r.status_code}: {r.text[:200]}")
        except Exception as e:
            log(f"⚠ No se pudo llamar a Modal: {e}")
    else:
        log("⚠ MODAL_WEBHOOK_URL no configurado — job quedó pendiente en DB")

    print(f"\n✅  Listo!")
    print(f"   Ver vehículo: http://localhost:5173/vehicles/{vehicle_id}")
    print(f"   Job 3D: {job_id}")
    print(f"   Estado Modal: https://modal.com/apps/jesusalerojasguti/main/deployed/autosplat-worker\n")


if __name__ == "__main__":
    main()
