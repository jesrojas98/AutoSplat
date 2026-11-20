"""Tests del codificador SPZ (steps/spz.py): ida y vuelta dentro de la precisión del formato."""
import gzip
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from steps.spz import MAGIC, read_spz, write_spz  # noqa: E402

RNG = np.random.default_rng(1)


def sample(n=500, k=15):
    q = RNG.normal(size=(n, 4))
    return dict(
        positions=RNG.uniform(-1.5, 1.5, (n, 3)),
        log_scales=RNG.uniform(-7, -1, (n, 3)),
        quats_wxyz=q / np.linalg.norm(q, axis=1, keepdims=True),
        opacity_logits=RNG.normal(size=n) * 2,
        sh_dc=RNG.uniform(-2, 2, (n, 3)),
        sh_rest=RNG.uniform(-0.9, 0.9, (n, 3, k)),
    )


@pytest.mark.parametrize("k", [0, 3, 8, 15])
def test_ida_y_vuelta_dentro_de_la_precision_del_formato(tmp_path, k):
    s = sample(k=k)
    path = write_spz(tmp_path / "m.spz", **s, antialiased=(k == 15))
    d = read_spz(path)
    assert d["degree"] == {0: 0, 3: 1, 8: 2, 15: 3}[k]
    assert d["antialiased"] == (k == 15)
    assert np.abs(d["positions"] - s["positions"]).max() <= 0.5 / 4096 + 1e-9
    assert np.abs(d["alphas"] - 1 / (1 + np.exp(-s["opacity_logits"]))).max() <= 0.5 / 255 + 1e-9
    assert np.abs(d["sh_dc"] - s["sh_dc"]).max() <= 0.5 / (0.15 * 255) + 1e-9
    assert np.abs(d["log_scales"] - s["log_scales"]).max() <= 0.5 / 16 + 1e-9
    # mismo giro: q y -q son equivalentes
    dot = np.abs((d["quats_wxyz"] * s["quats_wxyz"]).sum(1))
    assert dot.min() > 0.99
    if k:
        err = np.abs(d["sh_rest"] - s["sh_rest"])
        assert err[:, :, :3].max() <= 4.5 / 128 + 1e-9       # grado 1: 5 bits
        assert err[:, :, 3:].max() <= 8.5 / 128 + 1e-9 if k > 3 else True


def test_cabecera_y_gzip_como_los_lee_spark(tmp_path):
    path = write_spz(tmp_path / "m.spz", **sample(n=10, k=3))
    raw = path.read_bytes()
    assert raw[:3] == b"\x1f\x8b\x08"                      # gzip
    header = gzip.decompress(raw)[:16]
    assert int.from_bytes(header[:4], "little") == MAGIC == 0x5053474E   # "NGSP"
    assert int.from_bytes(header[4:8], "little") == 2
    assert int.from_bytes(header[8:12], "little") == 10
    assert header[12] == 1 and header[13] == 12


def test_rechaza_posiciones_fuera_de_rango(tmp_path):
    s = sample(n=5, k=0)
    s["positions"][0, 0] = 5000.0
    with pytest.raises(ValueError):
        write_spz(tmp_path / "m.spz", **s)
