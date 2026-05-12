# AutoSplat

Plataforma web de compraventa de vehículos con visualización 3D mediante Gaussian Splatting.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | NestJS + TypeScript |
| Base de datos | Supabase (PostgreSQL + Storage + Realtime) |
| Imágenes | Cloudinary |
| Worker 3D | Python + Nerfstudio + COLMAP |
| Deploy | Vercel (frontend) · Render (backend) |

## Estructura

```
autosplat/
├── apps/
│   ├── frontend/   # React App
│   └── backend/    # NestJS API
├── worker/         # Python Worker — Gaussian Splatting
└── database/       # Migraciones SQL y políticas RLS
```

## Desarrollo local

```bash
# Frontend
cd apps/frontend
npm install
npm run dev

# Backend
cd apps/backend
npm install
npm run start:dev

# Worker
cd worker
pip install -r requirements.txt
python3 src/main.py
```

## Variables de entorno

Ver `.env.example` en cada carpeta (`apps/backend/`, `apps/frontend/`, `worker/`).
