"""
Tests del recorte automático del modelo 3D (steps/scene_crop.py y su uso en steps/export.py).

    cd worker && python -m pytest tests -q
"""
import json
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from steps import scene_crop as sc  # noqa: E402

RNG = np.random.default_rng(0)


def iso(size):
    """Escalas (N,3) isótropas a partir de un tamaño por gaussiana."""
    return np.repeat(np.asarray(size, dtype=float)[:, None], 3, axis=1)


# ── Escena sintética: auto en el origen, suelo en z=-0.4, cámaras orbitando a radio 0.85 ──────────

def orbit_cameras(n=24, radius=0.85, height=0.0, target=(0.0, 0.0, -0.29)):
    ang = np.linspace(0, 2 * np.pi, n, endpoint=False)
    pos = np.stack([radius * np.cos(ang), radius * np.sin(ang), np.full(n, height)], axis=1)
    fwd = np.asarray(target) - pos
    fwd /= np.linalg.norm(fwd, axis=1, keepdims=True)
    return pos, fwd


def synthetic_scene():
    """Devuelve (points, alpha, size) con auto, suelo, entorno lejano y ruido bajo tierra."""
    def disk(n, r_max, z_lo, z_hi):
        r = r_max * np.sqrt(RNG.random(n)); t = 2 * np.pi * RNG.random(n)
        return np.stack([r * np.cos(t), r * np.sin(t), RNG.uniform(z_lo, z_hi, n)], axis=1)

    ground = disk(30000, 0.6, -0.41, -0.39)       # plano del suelo: el pico del histograma
    car = disk(8000, 0.45, -0.38, 0.02)           # carrocería sobre el suelo
    far = disk(20000, 4.0, -0.4, 1.5)             # muro, árboles, cielo
    far = far[np.hypot(far[:, 0], far[:, 1]) > 1.2]
    under = disk(3000, 0.6, -1.5, -0.6)           # ruido bajo tierra
    pts = np.concatenate([ground, car, far, under])
    labels = np.concatenate([np.full(len(g), k) for k, g in enumerate([ground, car, far, under])])
    alpha = np.full(len(pts), 220, dtype=np.uint8)
    size = np.full(len(pts), 0.004)
    return pts, alpha, size, labels


# ── orbit_center / plan_crop ─────────────────────────────────────────────────────────────────

def test_orbit_center_encuentra_el_punto_al_que_miran_las_camaras():
    pos, fwd = orbit_cameras()
    c = sc.orbit_center(pos, fwd)
    assert np.allclose(c, [0.0, 0.0, -0.29], atol=1e-6)


def test_plan_calcula_radio_de_camaras_y_suelo():
    pts, alpha, size, _ = synthetic_scene()
    pos, fwd = orbit_cameras()
    plan = sc.plan_crop(pts, alpha, size, pos, fwd)
    assert plan is not None
    assert plan.r_cam == pytest.approx(0.85, abs=1e-6)
    assert plan.r_crop == pytest.approx(0.82 * 0.85, abs=1e-6)
    assert plan.z_ground == pytest.approx(-0.40, abs=0.03)
    assert plan.z_lo < plan.z_ground < plan.z_hi


def test_recorte_conserva_auto_y_suelo_y_quita_entorno_y_ruido():
    pts, alpha, size, labels = synthetic_scene()
    pos, fwd = orbit_cameras()
    plan = sc.plan_crop(pts, alpha, size, pos, fwd)
    keep = sc.crop_mask(pts, alpha, iso(size), plan)
    ground, car, far, under = (keep[labels == k].mean() for k in range(4))
    assert car > 0.99                      # el auto se conserva completo
    assert ground > 0.9                    # el suelo cercano se conserva
    assert far < 0.01                      # entorno lejano fuera
    assert under < 0.01                    # ruido bajo tierra fuera


def test_recorte_descarta_transparentes_y_gaussianas_gigantes():
    pts, alpha, size, _ = synthetic_scene()
    alpha[:100] = 5       # casi transparentes
    size[100:200] = 5.0   # manchas enormes
    pos, fwd = orbit_cameras()
    plan = sc.plan_crop(pts, alpha, size, pos, fwd)
    keep = sc.crop_mask(pts, alpha, iso(size), plan)
    assert not keep[:200].any()


def test_recorte_descarta_agujas_largas_y_delgadas_pero_no_las_diminutas():
    pts, alpha, size, _ = synthetic_scene()
    car = np.flatnonzero(np.hypot(pts[:, 0], pts[:, 1]) < 0.3)[:3]
    scales = iso(size)
    scales[car[0]] = [0.05, 0.0005, 0.0005]    # aguja larga: fuera
    scales[car[1]] = [0.002, 0.00001, 0.00001]  # muy anisótropa pero diminuta: se conserva
    scales[car[2]] = [0.05, 0.04, 0.04]         # grande pero redonda: se conserva
    pos, fwd = orbit_cameras()
    plan = sc.plan_crop(pts, alpha, size, pos, fwd)
    keep = sc.crop_mask(pts, alpha, scales, plan)
    assert not keep[car[0]] and keep[car[1]] and keep[car[2]]


def test_sin_suelo_claro_solo_recorta_en_horizontal():
    # puntos repartidos uniformemente en altura: no hay un plano dominante
    n = 20000
    r = 1.5 * np.sqrt(RNG.random(n)); t = 2 * np.pi * RNG.random(n)
    pts = np.stack([r * np.cos(t), r * np.sin(t), RNG.uniform(-1.0, -0.1, n)], axis=1)
    alpha = np.full(n, 220, dtype=np.uint8); size = np.full(n, 0.004)
    pos, fwd = orbit_cameras()
    plan = sc.plan_crop(pts, alpha, size, pos, fwd)
    assert plan is not None and plan.z_ground is None
    assert plan.z_lo == -np.inf and plan.z_hi == np.inf
    keep = sc.crop_mask(pts, alpha, iso(size), plan)
    assert keep.any() and not keep.all()


def test_camaras_degeneradas_no_dan_plan():
    pos = np.zeros((5, 3)); fwd = np.tile([0.0, 0.0, -1.0], (5, 1))
    pts, alpha, size, _ = synthetic_scene()
    assert sc.plan_crop(pts, alpha, size, pos, fwd) is None
    assert sc.plan_crop(pts, alpha, size, pos[:2], fwd[:2]) is None


# ── normalize_frame ──────────────────────────────────────────────────────────────────────────

def test_normalize_frame_centra_el_auto_y_escala_el_recorte_a_radio_1_sin_rotar():
    pts, alpha, size, _ = synthetic_scene()
    pos, fwd = orbit_cameras()
    plan = sc.plan_crop(pts, alpha, size, pos, fwd)
    keep = sc.crop_mask(pts, alpha, iso(size), plan)
    new_p, k = sc.normalize_frame(pts[keep], plan)
    assert k == pytest.approx(1.0 / plan.r_crop)
    assert np.hypot(new_p[:, 0], new_p[:, 1]).max() <= 1.0 + 1e-6      # horizontal sigue siendo x,y
    assert abs(new_p[:, 0].mean()) < 0.1 and abs(new_p[:, 1].mean()) < 0.1
    # sin rotación: z sigue hacia arriba (el techo por encima del suelo)
    ground_z = new_p[pts[keep][:, 2] < plan.z_ground + 0.01][:, 2].mean()
    top_z = new_p[pts[keep][:, 2] > plan.z_ground + 0.3][:, 2].mean()
    assert top_z > ground_z
    # es una traslación + escala uniforme: las distancias relativas se conservan multiplicadas por k
    d0 = np.linalg.norm(pts[keep][1] - pts[keep][0])
    assert np.linalg.norm(new_p[1] - new_p[0]) == pytest.approx(d0 * k)


# ── load_cameras ─────────────────────────────────────────────────────────────────────────────

def test_load_cameras_aplica_transform_y_escala_de_nerfstudio(tmp_path):
    # cámara en (1,2,3) mirando por -z local (OpenGL); sin rotación propia
    frame = {"transform_matrix": [[1, 0, 0, 1], [0, 1, 0, 2], [0, 0, 1, 3], [0, 0, 0, 1]]}
    (tmp_path / "transforms.json").write_text(json.dumps({"frames": [frame] * 3}))
    # transform: rotación +90° alrededor de z, traslación (1,0,0); escala 0.5
    dp = {"transform": [[0, -1, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]], "scale": 0.5}
    (tmp_path / "dp.json").write_text(json.dumps(dp))
    pos, fwd = sc.load_cameras(tmp_path / "transforms.json", tmp_path / "dp.json")
    # R @ (1,2,3) + t = (-2+1, 1, 3) = (-1, 1, 3) -> * 0.5
    assert np.allclose(pos[0], [-0.5, 0.5, 1.5])
    # mirada local -z -> R @ (0,0,-1) = (0,0,-1)
    assert np.allclose(fwd[0], [0, 0, -1])


def test_load_cameras_deshace_el_applied_transform_de_ns_process_data(tmp_path):
    """nerfstudio guarda en `transform` la composición N @ A (A = applied_transform): hay que quitar A."""
    n = np.array([[0, -1, 0, 0.5], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], dtype=float)   # orientar/centrar
    a = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]], dtype=float)     # COLMAP -> nerfstudio
    frame = {"transform_matrix": [[1, 0, 0, 1], [0, 1, 0, 2], [0, 0, 1, 3], [0, 0, 0, 1]]}
    (tmp_path / "t.json").write_text(json.dumps({"frames": [frame] * 3, "applied_transform": a[:3].tolist()}))
    (tmp_path / "dp.json").write_text(json.dumps({"transform": (n @ a)[:3].tolist(), "scale": 2.0}))
    pos, fwd = sc.load_cameras(tmp_path / "t.json", tmp_path / "dp.json")
    # esperado: aplicar solo N a las poses del archivo
    assert np.allclose(pos[0], (n[:3, :3] @ [1, 2, 3] + n[:3, 3]) * 2.0)
    assert np.allclose(fwd[0], n[:3, :3] @ [0, 0, -1])


def test_load_cameras_coincide_con_las_camaras_reales_de_nerfstudio(tmp_path):
    """Regresión con datos reales (Volkswagen Gol): COLMAP + dataparser de nerfstudio 1.1.5 en Modal."""
    fx = json.loads((Path(__file__).parent / "fixtures" / "camaras_reales.json").read_text())
    (tmp_path / "t.json").write_text(json.dumps(fx["transforms"]))
    (tmp_path / "dp.json").write_text(json.dumps(fx["dataparser"]))
    pos, fwd = sc.load_cameras(tmp_path / "t.json", tmp_path / "dp.json")

    by_name = {Path(f["file_path"]).name: i for i, f in enumerate(fx["transforms"]["frames"])}
    sel = [by_name[n] for n in fx["image_filenames"]]
    ref = np.array(fx["expected_c2w"])
    assert np.abs(pos[sel] - ref[:, :, 3]).max() < 1e-5
    assert np.abs(fwd[sel] - (-ref[:, :, 2])).max() < 1e-5

    # y el recorte calibrado sale como el que se validó a ojo: centro en el auto, radio de cámaras ~0.8
    c = sc.orbit_center(pos, fwd)
    r = np.median(np.hypot(pos[:, 0] - c[0], pos[:, 1] - c[1]))
    assert abs(c[0]) < 0.1 and 0.7 < r < 1.0


# ── export: conversión completa .ply → .spz ──────────────────────────────────────────────────

def _write_ply(path, pts, scale_log, quat, f_dc, opacity, f_rest=None):
    plyfile = pytest.importorskip("plyfile")
    n = len(pts)
    rest_names = [f"f_rest_{i}" for i in range(0 if f_rest is None else f_rest.shape[1])]
    arr = np.zeros(n, dtype=[(k, "f4") for k in
                             ["x", "y", "z", "scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3",
                              "f_dc_0", "f_dc_1", "f_dc_2"] + rest_names + ["opacity"]])
    arr["x"], arr["y"], arr["z"] = pts.T
    arr["scale_0"], arr["scale_1"], arr["scale_2"] = scale_log.T
    arr["rot_0"], arr["rot_1"], arr["rot_2"], arr["rot_3"] = quat.T
    arr["f_dc_0"], arr["f_dc_1"], arr["f_dc_2"] = f_dc.T
    for i, name in enumerate(rest_names):
        arr[name] = f_rest[:, i]
    arr["opacity"] = opacity
    plyfile.PlyData([plyfile.PlyElement.describe(arr, "vertex")]).write(str(path))


@pytest.fixture
def ply(tmp_path):
    pts, alpha, size, labels = synthetic_scene()
    n = len(pts)
    p = tmp_path / "splat.ply"
    rest = RNG.normal(size=(n, 45)) * 0.05        # SH grado 3, por canal (R 0-14, G 15-29, B 30-44)
    _write_ply(p, pts, np.log(np.full((n, 3), 0.004)), np.tile([1.0, 0, 0, 0], (n, 1)),
               RNG.normal(size=(n, 3)) * 0.3, np.full(n, 2.0), rest)
    return p, n, labels, rest


def test_export_con_camaras_recorta_normaliza_y_conserva_reflejos(ply, tmp_path):
    from steps import export
    from steps.spz import read_spz
    p, n, labels, rest = ply
    out, kept = export._ply_to_spz(p, tmp_path / "m.spz", orbit_cameras(), antialiased=True)
    d = read_spz(out)
    assert len(d["positions"]) == kept
    assert 0.1 * n < kept < 0.9 * n                                    # recortó el entorno, conservó el auto
    assert np.hypot(d["positions"][:, 0], d["positions"][:, 1]).max() <= 1.0 + 1e-3
    assert d["degree"] == export.EXPORT_SH_DEGREE == 1 and d["antialiased"]   # grado 1: sin tonos falsos
    assert d["sh_rest"].shape == (kept, 3, 3)
    assert (d["alphas"] > 0.09).all()


def test_export_sh_reducido_toma_los_coeficientes_correctos_de_cada_canal(tmp_path):
    from steps import export
    from steps.spz import read_spz
    n = 2000
    pts = RNG.normal(size=(n, 3)) * 0.1
    rest = np.zeros((n, 45))
    rest[:, 0:3] = 0.3      # R: grado 1
    rest[:, 15:18] = -0.3   # G: grado 1
    rest[:, 30:33] = 0.6    # B: grado 1
    rest[:, 3:15] = 0.9     # R: grados 2-3 (se descartan con grado 1)
    p = tmp_path / "s.ply"
    _write_ply(p, pts, np.log(np.full((n, 3), 0.01)), np.tile([1.0, 0, 0, 0], (n, 1)), np.zeros((n, 3)),
               np.full(n, 2.0), rest)
    out, kept = export._ply_to_spz(p, tmp_path / "m.spz", None, sh_degree=1)
    d = read_spz(out)
    assert kept == n and d["degree"] == 1
    assert np.allclose(d["sh_rest"][:, 0, :], 0.3, atol=0.04)
    assert np.allclose(d["sh_rest"][:, 1, :], -0.3, atol=0.04)
    assert np.allclose(d["sh_rest"][:, 2, :], 0.6, atol=0.04)


def test_export_sin_camaras_convierte_todo_sin_recortar(ply, tmp_path):
    from steps import export
    p, n, _, _ = ply
    out, kept = export._ply_to_spz(p, tmp_path / "m.spz", None)
    assert kept == n


def test_export_si_el_recorte_dejaria_casi_nada_no_recorta(ply, tmp_path):
    from steps import export
    p, n, _, _ = ply
    pos, fwd = orbit_cameras(radius=0.85)
    pos = pos + np.array([50.0, 50.0, 0.0])   # cámaras muy lejos de la nube: el recorte no tocaría nada
    out, kept = export._ply_to_spz(p, tmp_path / "m.spz", (pos, fwd))
    assert kept == n


def test_load_training_cameras_sin_archivos_devuelve_none(tmp_path):
    from steps import export
    cfg = tmp_path / "out" / "config.yml"
    cfg.parent.mkdir()
    cfg.write_text("x")
    assert export._load_training_cameras(cfg, tmp_path) is None


def test_huella_conserva_el_auto_y_quita_restos_de_suelo_alrededor():
    rng = np.random.default_rng(3)
    # auto rectangular girado 30° (largo 1.1, ancho 0.45), del suelo (z=-0.4) al techo (z=0)
    ang = np.deg2rad(30)
    rot = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]])
    local = rng.uniform([-0.55, -0.225], [0.55, 0.225], (8000, 2))
    car = np.c_[local @ rot.T, rng.uniform(-0.39, 0.0, 8000)]
    mirror = np.array([[0.0, 0.25, -0.15]]) @ np.diag([1, 1, 1])        # espejo: sobresale a media altura
    mirror[0, :2] = mirror[0, :2] @ rot.T
    debris = np.c_[rng.uniform(-0.9, 0.9, (3000, 2)), rng.uniform(-0.39, -0.33, 3000)]
    debris = debris[np.abs((debris[:, :2] @ rot)[:, 1]) > 0.40]           # pasto lejos del costado
    pts = np.vstack([car, mirror, debris])
    plan = sc.CropPlan(np.zeros(3), 0.85, 0.7, -0.4, -0.47, 0.11)
    inside = sc.footprint_mask(pts, plan)
    assert inside[: len(car)].mean() > 0.98      # el auto se conserva
    assert inside[len(car)]                      # el espejo (dentro del margen) también
    assert inside[len(car) + 1:].mean() < 0.02   # el pasto alrededor sale


def test_huella_sin_suelo_o_sin_carroceria_no_decide():
    plan = sc.CropPlan(np.zeros(3), 0.85, 0.7, None, -np.inf, np.inf)
    assert sc.footprint_mask(np.zeros((10, 3)), plan) is None
    plan = sc.CropPlan(np.zeros(3), 0.85, 0.7, -0.4, -0.47, 0.11)
    assert sc.footprint_mask(np.full((10, 3), -0.4), plan) is None
