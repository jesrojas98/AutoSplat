"""
Escritor del formato SPZ (Niantic, https://github.com/nianticlabs/spz) para el visor web (Spark).

SPZ guarda cada gaussiana en ~20-45 bytes (frente a 60-250 del PLY) y conserva los armónicos esféricos,
es decir, los reflejos de la pintura y los vidrios. Archivo = gzip( cabecera de 16 bytes + arreglos ):

  cabecera   magic "NGSP" (u32) · versión 2 (u32) · n puntos (u32) · grado SH (u8) · bits fraccionarios (u8)
             · flags (u8, 0x1 = antialiased) · reservado (u8)
  posiciones n×3×3 bytes, punto fijo de 24 bits con signo
  alfas      n bytes, sigmoide(opacidad)·255
  colores    n×3 bytes, coeficiente SH de grado 0 · (0,15·255) + 127,5
  escalas    n×3 bytes, (log escala + 10)·16
  rotaciones n×3 bytes, (x, y, z) del cuaternión normalizado con w ≥ 0, ·127,5 + 127,5
  SH         n×dim×3 bytes, coeficiente-mayor y canal-menor, round(x·128)+128 cuantizado a 5 bits
             (grado 1) y 4 bits (grados 2-3)
"""
import gzip
from pathlib import Path

import numpy as np

MAGIC = 0x5053474E
VERSION = 2
COLOR_SCALE = 0.15
SH_DIM = {0: 0, 1: 3, 2: 8, 3: 15}   # coeficientes por canal sin contar el DC
FLAG_ANTIALIASED = 0x1


def _u8(x: np.ndarray) -> np.ndarray:
    return np.clip(np.round(x), 0, 255).astype(np.uint8)


def _quantize_sh(x: np.ndarray, bucket: int) -> np.ndarray:
    q = np.round(x * 128.0) + 128.0
    q = np.floor((q + bucket / 2) / bucket) * bucket
    return np.clip(q, 0, 255).astype(np.uint8)


def write_spz(
    path: Path,
    positions: np.ndarray,      # (N,3)
    log_scales: np.ndarray,     # (N,3) escala en log, como en el PLY de nerfstudio
    quats_wxyz: np.ndarray,     # (N,4) w,x,y,z (rot_0..rot_3 del PLY)
    opacity_logits: np.ndarray,  # (N,) opacidad antes de la sigmoide
    sh_dc: np.ndarray,          # (N,3) f_dc_0..2
    sh_rest: np.ndarray,        # (N,3,K) f_rest por canal (K = 0, 3, 8 o 15)
    antialiased: bool = False,
    fractional_bits: int = 12,
) -> Path:
    n = len(positions)
    k = sh_rest.shape[2] if sh_rest.ndim == 3 else 0
    degree = {v: d for d, v in SH_DIM.items()}.get(k)
    if degree is None:
        raise ValueError(f"cantidad de coeficientes SH no válida: {k}")

    header = np.array([MAGIC, VERSION, n], dtype="<u4").tobytes() + bytes(
        [degree, fractional_bits, FLAG_ANTIALIASED if antialiased else 0, 0])

    fixed = np.round(positions.astype(np.float64) * (1 << fractional_bits)).astype(np.int64)
    if np.abs(fixed).max(initial=0) >= (1 << 23):
        raise ValueError("posiciones fuera del rango del punto fijo de 24 bits")
    fixed &= 0xFFFFFF
    pos_bytes = np.stack([fixed & 0xFF, (fixed >> 8) & 0xFF, (fixed >> 16) & 0xFF], axis=-1).astype(np.uint8)

    alphas = _u8(255.0 / (1.0 + np.exp(-opacity_logits.astype(np.float64))))
    colors = _u8(sh_dc * (COLOR_SCALE * 255.0) + 0.5 * 255.0)
    scales = _u8((log_scales + 10.0) * 16.0)

    q = quats_wxyz.astype(np.float64)
    q = q / (np.linalg.norm(q, axis=1, keepdims=True) + 1e-12)
    q = q * np.where(q[:, :1] < 0, -1.0, 1.0)              # w ≥ 0 (q y -q son la misma rotación)
    rot = _u8(q[:, 1:] * 127.5 + 127.5)                    # x, y, z

    if degree:
        coef_major = np.transpose(sh_rest, (0, 2, 1))        # (N, K, 3): coeficiente-mayor, canal-menor
        sh = np.empty_like(coef_major, dtype=np.uint8)
        sh[:, :3] = _quantize_sh(coef_major[:, :3], 8)     # grado 1: 5 bits
        sh[:, 3:] = _quantize_sh(coef_major[:, 3:], 16)    # grados 2-3: 4 bits
        sh_bytes = sh.tobytes()
    else:
        sh_bytes = b""

    payload = header + pos_bytes.tobytes() + alphas.tobytes() + colors.tobytes() + scales.tobytes() \
        + rot.tobytes() + sh_bytes
    Path(path).write_bytes(gzip.compress(payload, compresslevel=9))
    return Path(path)


def read_spz(path: Path) -> dict:
    """Decodificador de referencia (para tests): devuelve los valores ya desempaquetados."""
    raw = gzip.decompress(Path(path).read_bytes())
    magic, version, n = np.frombuffer(raw[:12], dtype="<u4")
    degree, frac, flags, _ = raw[12:16]
    if magic != MAGIC or version != VERSION:
        raise ValueError("no es un SPZ v2")
    k = SH_DIM[degree]
    off = 16

    def take(count):
        nonlocal off
        out = np.frombuffer(raw, dtype=np.uint8, count=count, offset=off)
        off += count
        return out

    p = take(n * 9).reshape(n, 3, 3).astype(np.int64)
    fixed = p[..., 0] | (p[..., 1] << 8) | (p[..., 2] << 16)
    fixed = np.where(fixed & 0x800000, fixed - (1 << 24), fixed)
    alphas = take(n).astype(np.float64) / 255.0
    colors = (take(n * 3).reshape(n, 3) / 255.0 - 0.5) / COLOR_SCALE
    scales = take(n * 3).reshape(n, 3) / 16.0 - 10.0
    xyz = take(n * 3).reshape(n, 3) / 127.5 - 1.0
    w = np.sqrt(np.clip(1.0 - (xyz ** 2).sum(1), 0.0, 1.0))
    sh = (take(n * k * 3).reshape(n, k, 3).astype(np.float64) - 128.0) / 128.0 if k else np.zeros((n, 0, 3))
    return {
        "positions": fixed / float(1 << frac), "alphas": alphas, "sh_dc": colors, "log_scales": scales,
        "quats_wxyz": np.concatenate([w[:, None], xyz], axis=1), "sh_rest": np.transpose(sh, (0, 2, 1)),
        "degree": int(degree), "antialiased": bool(flags & FLAG_ANTIALIASED),
    }
