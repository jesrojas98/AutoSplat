"""Tests de las funciones puras del segmentador (steps/segment_cars.py). No necesitan torch ni SAM."""
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
cv2 = pytest.importorskip("cv2")

from steps import segment_cars as seg  # noqa: E402


def test_clean_mask_rellena_vidrios_pero_no_el_suelo_cuando_el_auto_cruza_la_foto():
    m = np.zeros((40, 30), bool)
    m[10:25, :] = True          # auto de lado a lado (foto cercana)
    m[15:18, 10:15] = False     # vidrio que SAM dejó fuera: hueco interior
    r = seg.clean_mask(m)
    assert r[16, 12]            # el vidrio se rellena
    assert not r[35, 15]        # el suelo bajo el auto sigue fuera (antes se rellenaba)
    assert not r[2, 15]         # el fondo de arriba sigue fuera


def test_clean_mask_conserva_solo_la_region_mas_grande():
    m = np.zeros((40, 40), bool)
    m[5:30, 5:30] = True        # auto
    m[35:38, 35:38] = True      # mancha suelta
    r = seg.clean_mask(m)
    assert r[10, 10] and not r[36, 36]


def test_prompt_points_reparte_puntos_de_arriba_a_abajo_dentro_del_auto():
    m = np.zeros((200, 100), bool)
    m[40:180, 10:90] = True
    pts = seg.prompt_points(m)
    assert len(pts) == 6
    ys = pts[:, 1]
    assert ys.min() < 70 and ys.max() > 150                # techo y parachoques
    assert all(m[int(y), int(x)] for x, y in pts)          # todos dentro del auto


def test_pick_vehicle_elige_el_auto_grande_y_centrado_e_ignora_otras_clases():
    w, h = 100, 200
    out = {
        "boxes": np.array([[0, 0, 20, 20], [10, 40, 90, 180], [5, 5, 95, 195]], dtype=float),
        "labels": np.array([3, 3, 1]),          # car, car, person
        "scores": np.array([0.99, 0.9, 0.99]),
    }
    assert seg.pick_vehicle(out, w, h) == 1
    out["scores"] = np.array([0.3, 0.2, 0.99])  # autos con poca confianza: ninguno
    assert seg.pick_vehicle(out, w, h) is None


def test_iou():
    a = np.zeros((10, 10), bool); a[:5] = True
    b = np.zeros((10, 10), bool); b[:5, :5] = True
    assert seg.iou(a, b) == pytest.approx(0.5)
    assert seg.iou(np.zeros((3, 3), bool), np.zeros((3, 3), bool)) == 0.0
