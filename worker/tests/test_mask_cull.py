"""Tests de la separación auto/fondo en 3D (steps/mask_cull.py)."""
import json
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from PIL import Image  # noqa: E402

from steps import mask_cull as mc  # noqa: E402

W, H, F = 400, 300, 300.0
IDENTITY_DP = {"transform": [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]], "scale": 1.0}


def look_at(eye, target=(0.0, 0.0, 0.0), up=(0.0, 0.0, 1.0)):
    """Pose cámara→mundo OpenGL (mira hacia -z local, y local hacia arriba)."""
    eye = np.asarray(eye, float)
    back = eye - np.asarray(target, float)
    back /= np.linalg.norm(back)
    right = np.cross(up, back)
    right /= np.linalg.norm(right)
    true_up = np.cross(back, right)
    m = np.eye(4)
    m[:3, 0], m[:3, 1], m[:3, 2], m[:3, 3] = right, true_up, back, eye
    return m


def write_scene(tmp, poses, mask_fn, **intr):
    proc = tmp / "processed"
    (proc / "masks").mkdir(parents=True)
    meta = {"fl_x": F, "fl_y": F, "cx": W / 2, "cy": H / 2, "w": W, "h": H, **intr, "frames": []}
    for i, pose in enumerate(poses):
        name = f"frame_{i:05d}"
        meta["frames"].append({"file_path": f"images/{name}.jpg", "transform_matrix": pose.tolist()})
        Image.fromarray((mask_fn(i, pose) * 255).astype(np.uint8)).save(proc / "masks" / f"{name}.png")
    (proc / "transforms.json").write_text(json.dumps(meta))
    (tmp / "dp.json").write_text(json.dumps(IDENTITY_DP))
    return mc.load_views(proc, tmp / "dp.json")


def test_proyeccion_coincide_con_el_calculo_a_mano(tmp_path):
    pose = np.eye(4)
    pose[:3, 3] = [0, 0, 5]                     # cámara en z=5 mirando hacia -z (al origen)
    views = write_scene(tmp_path, [pose], lambda i, p: np.zeros((H, W), bool))
    pts = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 10]], float)
    u, v, front = mc.project(pts, views[0])
    assert (u[0], v[0]) == pytest.approx((W / 2, H / 2))
    assert u[1] == pytest.approx(W / 2 + F / 5)           # +x del mundo → a la derecha
    assert v[2] == pytest.approx(H / 2 - F / 5)           # +y del mundo (arriba) → hacia arriba en la foto
    assert front[:3].all() and not front[3]               # detrás de la cámara


def test_proyeccion_aplica_distorsion_radial(tmp_path):
    pose = np.eye(4)
    pose[:3, 3] = [0, 0, 5]
    views = write_scene(tmp_path, [pose], lambda i, p: np.zeros((H, W), bool), k1=0.1)
    u, _, _ = mc.project(np.array([[1.0, 0, 0]]), views[0])
    xn = 0.2
    assert u[0] == pytest.approx(W / 2 + F * xn * (1 + 0.1 * xn * xn))


def test_conserva_el_auto_y_quita_el_fondo_desde_varias_vistas(tmp_path):
    rng = np.random.default_rng(0)
    car = rng.uniform([-0.6, -0.25, 0.0], [0.6, 0.25, 0.4], (3000, 3))           # "auto" en el centro
    ground = np.c_[rng.uniform(-3, 3, (6000, 2)), np.zeros(6000)]
    ground = ground[np.abs(ground[:, 0]) > 1.0]                                   # suelo alrededor
    wall = np.c_[rng.uniform(-3, 3, 3000), np.full(3000, 3.0), rng.uniform(0, 2, 3000)]  # muro detrás
    pts = np.vstack([car, ground, wall])
    is_car = np.r_[np.ones(len(car), bool), np.zeros(len(ground) + len(wall), bool)]

    ang = np.linspace(0, 2 * np.pi, 16, endpoint=False)
    poses = [look_at((2.2 * np.cos(a), 2.2 * np.sin(a), 1.0), (0, 0, 0.2)) for a in ang]

    def mask_fn(i, pose):
        view = mc.View(pose[:3], F, F, W / 2, H / 2, W, H, (0, 0, 0, 0), Path("."))
        u, v, front = mc.project(car, view)
        m = np.zeros((H, W), bool)
        ok = front & (u >= 0) & (u < W) & (v >= 0) & (v < H)
        for du in (-2, -1, 0, 1, 2):                        # silueta del auto "rellena"
            for dv in (-2, -1, 0, 1, 2):
                uu = np.clip(u[ok].astype(int) + du, 0, W - 1)
                vv = np.clip(v[ok].astype(int) + dv, 0, H - 1)
                m[vv, uu] = True
        return m

    views = write_scene(tmp_path, poses, mask_fn)
    keep = mc.car_mask_3d(pts, views)
    assert keep[is_car].mean() > 0.98          # el auto se conserva
    assert keep[~is_car].mean() < 0.05         # suelo y muro fuera


def test_fotos_sin_mascara_se_ignoran(tmp_path):
    pose = np.eye(4)
    pose[:3, 3] = [0, 0, 5]
    write_scene(tmp_path, [pose, pose], lambda i, p: np.ones((H, W), bool))
    (tmp_path / "processed" / "masks" / "frame_00001.png").unlink()
    views = mc.load_views(tmp_path / "processed", tmp_path / "dp.json")
    assert len(views) == 1


def test_mascara_de_tamano_distinto_es_error(tmp_path):
    pose = np.eye(4)
    pose[:3, 3] = [0, 0, 5]
    views = write_scene(tmp_path, [pose], lambda i, p: np.ones((H // 2, W // 2), bool))
    with pytest.raises(ValueError):
        mc.car_votes(np.zeros((1, 3)), views)


def test_extremos_de_la_gaussiana_siguen_su_eje_mas_largo():
    p = np.zeros((2, 3))
    s = np.array([[0.5, 0.01, 0.01], [0.01, 0.01, 0.3]])
    half = np.sqrt(0.5)
    q = np.array([[1.0, 0, 0, 0], [half, half, 0, 0]])     # identidad; 90° alrededor de x (z local → -y mundo)
    a, b = mc.axis_endpoints(p, s, q, sigmas=2.0)
    assert np.allclose(a[0], [1.0, 0, 0]) and np.allclose(b[0], [-1.0, 0, 0])
    assert np.allclose(np.abs(a[1]), [0, 0.6, 0])


def test_agujas_que_sobresalen_de_la_silueta_se_quitan(tmp_path):
    """Una aguja con centro en el auto pero muy larga (sobresale) se quita; una gaussiana chica se queda."""
    ang = np.linspace(0, 2 * np.pi, 12, endpoint=False)
    poses = [look_at((2.5 * np.cos(a), 2.5 * np.sin(a), 0.8), (0, 0, 0.2)) for a in ang]
    car_box = np.random.default_rng(1).uniform([-0.5, -0.25, 0.0], [0.5, 0.25, 0.4], (3000, 3))

    def mask_fn(i, pose):
        view = mc.View(pose[:3], F, F, W / 2, H / 2, W, H, (0, 0, 0, 0), Path("."))
        u, v, front = mc.project(car_box, view)
        m = np.zeros((H, W), bool)
        ok = front & (u >= 0) & (u < W) & (v >= 0) & (v < H)
        for du in range(-3, 4):
            for dv in range(-3, 4):
                m[np.clip(v[ok].astype(int) + dv, 0, H - 1), np.clip(u[ok].astype(int) + du, 0, W - 1)] = True
        return m

    views = write_scene(tmp_path, poses, mask_fn)
    pts = np.array([[0.0, 0.0, 0.2], [0.0, 0.0, 0.2]])
    scales = np.array([[0.01, 0.01, 0.01], [1.0, 0.005, 0.005]])   # chica / aguja de 4 m a lo largo de x
    quats = np.tile([1.0, 0, 0, 0], (2, 1))
    only_center = mc.car_mask_3d(pts, views)
    with_ends = mc.car_mask_3d(pts, views, scales=scales, quats_wxyz=quats)
    assert only_center.all()                      # por el centro, ambas parecen del auto
    assert with_ends[0] and not with_ends[1]      # con los extremos, la aguja sale
