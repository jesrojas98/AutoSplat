"""
Máscaras del vehículo para cada foto, para entrenar el modelo 3D solo con el auto (fondo limpio).

Se ejecuta con el Python 3.10 de la imagen de nerfstudio (tiene torch/torchvision), no con el 3.11 del
worker: ver steps/masks.py, que lo lanza como subproceso.

  1. Mask R-CNN (torchvision, COCO) encuentra el vehículo: el más grande y centrado entre car/truck/bus.
     Su máscara cubre el auto completo, pero con bordes toscos.
  2. SAM (Segment Anything, vit_h) dibuja el contorno fino. Con la pintura brillante, si solo recibe la caja
     a veces se queda con una parte (capó + parabrisas, o el techo), así que también recibe puntos repartidos
     de arriba a abajo dentro del auto y, de sus propuestas, se elige la que más coincide con Mask R-CNN.
     Si ni así coincide lo suficiente, se une con la máscara de Mask R-CNN.
  3. Se conserva la región conectada más grande y se rellenan los huecos.

Escribe processed/masks/<foto>.png (255 = auto). Con --add-to-transforms agrega además `mask_path` a cada
frame de transforms.json, lo que hace que nerfstudio entrene SOLO con el auto (peor calidad, ver mask_cull.py);
por defecto no se agrega y las máscaras se usan al exportar para separar el auto del fondo.

Uso:
    python3.10 segment_cars.py <processed_dir> [--preview <dir>] [--add-to-transforms]
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

COCO_VEHICLES = {3: "car", 6: "bus", 8: "truck"}
MIN_SCORE = 0.5
MIN_IOU_WITH_DETECTOR = 0.75   # bajo esto, la propuesta de SAM se une con la máscara de Mask R-CNN
SAM_CHECKPOINT = "/opt/seg/weights/sam_vit_h_4b8939.pth"


def load_models(device: str):
    from segment_anything import SamPredictor, sam_model_registry
    from torchvision.models.detection import MaskRCNN_ResNet50_FPN_V2_Weights, maskrcnn_resnet50_fpn_v2

    det = maskrcnn_resnet50_fpn_v2(weights=MaskRCNN_ResNet50_FPN_V2_Weights.DEFAULT).eval().to(device)
    sam = sam_model_registry["vit_h"](checkpoint=SAM_CHECKPOINT).to(device)
    return det, SamPredictor(sam)


def pick_vehicle(out: dict, w: int, h: int):
    """Índice del vehículo principal: puntaje × área × cercanía al centro (None si no hay)."""
    best, best_val = None, 0.0
    for i, (box, label, score) in enumerate(zip(out["boxes"], out["labels"], out["scores"])):
        if int(label) not in COCO_VEHICLES or float(score) < MIN_SCORE:
            continue
        x0, y0, x1, y1 = (float(v) for v in box)
        area = (x1 - x0) * (y1 - y0) / (w * h)
        cx, cy = (x0 + x1) / 2 / w - 0.5, (y0 + y1) / 2 / h - 0.5
        centrality = 1.0 - min(1.0, (cx * cx + cy * cy) ** 0.5 / 0.7)
        val = float(score) * area * (0.3 + 0.7 * centrality)
        if val > best_val:
            best, best_val = i, val
    return best


def prompt_points(mask: np.ndarray, n_rows: int = 6) -> np.ndarray:
    """Puntos positivos dentro del auto, repartidos de arriba a abajo (techo, puertas, parachoques)."""
    h, w = mask.shape
    k = max(3, int(0.02 * min(h, w)))
    inner = cv2.erode(mask.astype(np.uint8), np.ones((k, k), np.uint8)).astype(bool)
    if inner.sum() < 50:
        inner = mask
    ys = np.nonzero(inner.any(axis=1))[0]
    pts = []
    for q in np.linspace(0.12, 0.88, n_rows):
        y = int(ys[int(q * (len(ys) - 1))])
        xs = np.nonzero(inner[y])[0]
        if len(xs):
            pts.append([float(xs[len(xs) // 2]), float(y)])
    return np.array(pts, dtype=np.float32)


def iou(a: np.ndarray, b: np.ndarray) -> float:
    union = np.logical_or(a, b).sum()
    return float(np.logical_and(a, b).sum() / union) if union else 0.0


def clean_mask(mask: np.ndarray) -> np.ndarray:
    """Región conectada más grande y sin huecos (los vidrios a veces quedan como agujeros)."""
    m = mask.astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    if n > 1:
        largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = (labels == largest).astype(np.uint8)
    # Rellenar huecos: es hueco el fondo que NO toca ningún borde de la foto. Se agrega un marco de fondo
    # de 1 px para que el flood fill alcance todos los bordes: en fotos cercanas el auto cruza la imagen de
    # lado a lado y el suelo queda separado de las esquinas de arriba, pero sigue tocando el borde inferior.
    h, w = m.shape
    flood = np.pad(m, 1).astype(np.uint8) * 255
    cv2.floodFill(flood, np.zeros((h + 4, w + 4), np.uint8), (0, 0), 255)
    holes = flood[1:-1, 1:-1] == 0
    m[holes] = 1
    return m.astype(bool)


def main() -> int:
    import torch

    ap = argparse.ArgumentParser()
    ap.add_argument("processed_dir", type=Path)
    ap.add_argument("--preview", type=Path, default=None)
    ap.add_argument("--add-to-transforms", action="store_true")
    args = ap.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    det, predictor = load_models(device)

    tpath = args.processed_dir / "transforms.json"
    meta = json.loads(tpath.read_text())
    mask_dir = args.processed_dir / "masks"
    mask_dir.mkdir(exist_ok=True)
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)

    fallbacks = 0
    merged = 0
    coverage = []
    for frame in meta["frames"]:
        img_path = args.processed_dir / frame["file_path"]
        img = np.array(Image.open(img_path).convert("RGB"))
        h, w = img.shape[:2]

        with torch.no_grad():
            t = torch.from_numpy(img).permute(2, 0, 1).float().div(255).to(device)
            out = det([t])[0]
        idx = pick_vehicle(out, w, h)

        if idx is None:
            mask = np.ones((h, w), bool)   # sin vehículo detectado: se supervisa la foto completa
            fallbacks += 1
        else:
            det_mask = (out["masks"][idx, 0] > 0.5).cpu().numpy()
            box = out["boxes"][idx].cpu().numpy()
            pts = prompt_points(det_mask)
            predictor.set_image(img)
            masks, _, _ = predictor.predict(
                point_coords=pts if len(pts) else None,
                point_labels=np.ones(len(pts), dtype=np.int32) if len(pts) else None,
                box=box, multimask_output=True,
            )
            ious = [iou(m, det_mask) for m in masks]
            best = int(np.argmax(ious))
            mask = masks[best]
            if ious[best] < MIN_IOU_WITH_DETECTOR:
                mask = np.logical_or(mask, det_mask)
                merged += 1
            mask = clean_mask(mask)

        name = Path(frame["file_path"]).stem + ".png"
        Image.fromarray((mask * 255).astype(np.uint8)).save(mask_dir / name)
        if args.add_to_transforms:
            frame["mask_path"] = f"masks/{name}"
        coverage.append(float(mask.mean()))

        if args.preview:
            ov = img.copy()
            ov[~mask] = (ov[~mask] * 0.25).astype(np.uint8)
            Image.fromarray(ov).resize((w // 4, h // 4)).save(args.preview / (Path(frame["file_path"]).stem + ".jpg"))

    if args.add_to_transforms:
        tpath.write_text(json.dumps(meta, indent=2))
    print(f"MASKS_OK frames={len(meta['frames'])} sin_vehiculo={fallbacks} unidas_con_detector={merged} "
          f"cobertura_media={np.mean(coverage):.3f} min={np.min(coverage):.3f} max={np.max(coverage):.3f}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
