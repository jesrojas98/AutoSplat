-- Habilita Row Level Security en todas las tablas de negocio.
--
-- Sin esto, la anon key (pública, embebida en el bundle del frontend)
-- tiene acceso de lectura/escritura sin restricción vía la REST API de
-- PostgREST — RLS deshabilitado equivale a "sin autorización" a nivel de fila.
--
-- El backend y el worker siempre usan SUPABASE_SERVICE_ROLE_KEY, que
-- bypassa RLS por diseño de Supabase. Estas políticas solo restringen
-- lo que puede hacer el cliente anon/authenticated (frontend).

alter table users enable row level security;
alter table vehicles enable row level security;
alter table vehicle_images enable row level security;
alter table vehicle_3d_models enable row level security;
alter table processing_jobs enable row level security;
alter table favorites enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
