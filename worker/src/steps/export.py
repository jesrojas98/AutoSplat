"""
Exporta el modelo entrenado desde Nerfstudio y convierte el .ply a formato .splat.

Formato .splat (antimatter15/gsplat.js — 32 bytes por splat):
  [x:f32, y:f32, z:f32, sx:f32, sy:f32, sz:f32, r:u8, g:u8, b:u8, a:u8, q0:u8, q1:u8, q2:u8, q3:u8]
"""
import glob
import logging
import subprocess
from pathlib import Path

import numpy as np
from plyfile import PlyData  # type: ignore

logger = logging.getLogger(__name__)

_SH_C0 = 0.28209479177387814   # 1 / (2 * sqrt(pi))


def export_and_convert(config_path: Path, dest_dir: Path) -> tuple[Path, int]:
    """
    Ejecuta ns-export para obtener el .ply y lo convierte a .splat binario.

    Returns:
        (path al .splat, número de gaussianos)
    """
    export_dir = dest_dir / "export"
    export_dir.mkdir(parents=True, exist_ok=True)

    ply_path = _run_ns_export(config_path, export_dir)
    splat_path, num_gaussians = _ply_to_splat(ply_path, dest_dir / "model.splat")

    return splat_path, num_gaussians


# ── ns-export ─────────────────────────────────────────────────────────────────

def _run_ns_export(config_path: Path, export_dir: Path) -> Path:
    """Llama a ns-export gaussian-splat para obtener splat.ply."""
    cmd = [
        "ns-export", "gaussian-splat",
        "--load-config", str(config_path),
        "--output-dir", str(export_dir),
    ]
    logger.info("Exportando modelo: %s", " ".join(cmd))

    result = subprocess.run(cmd, capture_output=False, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ns-export falló con código {result.returncode}.")

    ply_path = _find_ply(export_dir)
    logger.info("PLY exportado: %s (%.1f MB)", ply_path, ply_path.stat().st_size / 1e6)
    return ply_path


def _find_ply(export_dir: Path) -> Path:
    """Busca el archivo .ply generado por ns-export."""
    candidates = list(export_dir.glob("*.ply")) + list(export_dir.glob("**/*.ply"))
    if not candidates:
        raise RuntimeError(f"No se encontró .ply en {export_dir} después del export.")
    return sorted(candidates, key=lambda p: p.stat().st_size, reverse=True)[0]


# ── Conversión PLY → .splat ───────────────────────────────────────────────────

def _ply_to_splat(ply_path: Path, splat_path: Path) -> tuple[Path, int]:
    """
    Convierte el .ply de Nerfstudio al formato binario .splat para gsplat.js.

    El PLY de Nerfstudio incluye:
      - x, y, z                        → posición
      - scale_0, scale_1, scale_2      → escala en espacio logarítmico
      - rot_0..rot_3                    → cuaternión (w, x, y, z)
      - f_dc_0, f_dc_1, f_dc_2         → color (coeficiente SH DC)
      - opacity                         → opacidad raw (aplicar sigmoid)
    """
    logger.info("Convirtiendo %s → %s ...", ply_path.name, splat_path.name)
    ply = PlyData.read(str(ply_path))
    v = ply["vertex"]
    n = len(v)

    # ── Posición ──────────────────────────────────────────────────────────────
    x = np.array(v["x"], dtype=np.float32)
    y = np.array(v["y"], dtype=np.float32)
    z = np.array(v["z"], dtype=np.float32)

    # ── Escala (log → lineal) ─────────────────────────────────────────────────
    sx = np.exp(np.array(v["scale_0"], dtype=np.float32))
    sy = np.exp(np.array(v["scale_1"], dtype=np.float32))
    sz = np.exp(np.array(v["scale_2"], dtype=np.float32))

    # ── Color (SH DC component → RGB 0–255) ──────────────────────────────────
    r = np.clip((_SH_C0 * np.array(v["f_dc_0"]) + 0.5) * 255, 0, 255).astype(np.uint8)
    g = np.clip((_SH_C0 * np.array(v["f_dc_1"]) + 0.5) * 255, 0, 255).astype(np.uint8)
    b = np.clip((_SH_C0 * np.array(v["f_dc_2"]) + 0.5) * 255, 0, 255).astype(np.uint8)

    # ── Opacidad (sigmoid → 0–255) ────────────────────────────────────────────
    raw_opacity = np.array(v["opacity"], dtype=np.float32)
    a = np.clip(1.0 / (1.0 + np.exp(-raw_opacity)) * 255, 0, 255).astype(np.uint8)

    # ── Rotación cuaternión (w,x,y,z) → normalizar → uint8 centrado en 128 ──
    rw = np.array(v["rot_0"], dtype=np.float32)
    rx = np.array(v["rot_1"], dtype=np.float32)
    ry = np.array(v["rot_2"], dtype=np.float32)
    rz = np.array(v["rot_3"], dtype=np.float32)
    norm = np.sqrt(rw**2 + rx**2 + ry**2 + rz**2) + 1e-9
    rw, rx, ry, rz = rw / norm, rx / norm, ry / norm, rz / norm

    q0 = np.clip(rw * 128 + 128, 0, 255).astype(np.uint8)
    q1 = np.clip(rx * 128 + 128, 0, 255).astype(np.uint8)
    q2 = np.clip(ry * 128 + 128, 0, 255).astype(np.uint8)
    q3 = np.clip(rz * 128 + 128, 0, 255).astype(np.uint8)

    # ── Escribir binario (32 bytes por splat) ─────────────────────────────────
    buf = np.zeros(n, dtype=[
        ("x", "f4"), ("y", "f4"), ("z", "f4"),
        ("sx", "f4"), ("sy", "f4"), ("sz", "f4"),
        ("r", "u1"), ("g", "u1"), ("b", "u1"), ("a", "u1"),
        ("q0", "u1"), ("q1", "u1"), ("q2", "u1"), ("q3", "u1"),
    ])
    buf["x"], buf["y"], buf["z"] = x, y, z
    buf["sx"], buf["sy"], buf["sz"] = sx, sy, sz
    buf["r"], buf["g"], buf["b"], buf["a"] = r, g, b, a
    buf["q0"], buf["q1"], buf["q2"], buf["q3"] = q0, q1, q2, q3

    with open(splat_path, "wb") as f:
        f.write(buf.tobytes())

    size_mb = splat_path.stat().st_size / 1e6
    logger.info("Conversión completada: %d gaussianos, %.1f MB → %s", n, size_mb, splat_path.name)
    return splat_path, n
