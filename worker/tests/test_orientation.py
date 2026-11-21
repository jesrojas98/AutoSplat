"""Tests de la unificación de orientación antes de COLMAP (steps/orientation.py)."""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from steps.orientation import unify_orientation  # noqa: E402


def make(path: Path, size):
    Image.new("RGB", size, (120, 120, 120)).save(path, quality=90)


def test_gira_las_fotos_de_la_minoria(tmp_path):
    for i in range(5):
        make(tmp_path / f"h{i}.jpg", (192, 108))       # horizontales (mayoría)
    make(tmp_path / "v0.jpg", (108, 192))              # vertical suelta
    assert unify_orientation(tmp_path) == 1
    assert {Image.open(p).size for p in tmp_path.iterdir()} == {(192, 108)}


def test_todas_iguales_no_toca_nada(tmp_path):
    for i in range(3):
        make(tmp_path / f"v{i}.jpg", (108, 192))
    before = {p: p.stat().st_mtime_ns for p in tmp_path.iterdir()}
    assert unify_orientation(tmp_path) == 0
    assert before == {p: p.stat().st_mtime_ns for p in tmp_path.iterdir()}


def test_fotos_de_otro_tamano_no_se_giran(tmp_path):
    for i in range(3):
        make(tmp_path / f"h{i}.jpg", (192, 108))
    make(tmp_path / "otra.jpg", (300, 400))            # otra cámara: no es solo ancho/alto intercambiados
    assert unify_orientation(tmp_path) == 0
    assert Image.open(tmp_path / "otra.jpg").size == (300, 400)
