-- vehicles / vehicle_images / vehicle_3d_models: hoy el catálogo público se
-- sirve vía el backend (GET /vehicles usa supabase.admin, sin guard), no hay
-- ningún .from('vehicles') directo desde el frontend. Estas policies de
-- SELECT son defensa en profundidad por si en el futuro se consulta con el
-- cliente anon — solo exponen lo que ya es público (vehículos publicados).
-- No hay policies de INSERT/UPDATE/DELETE: esas operaciones solo las hace
-- el backend con service_role.

create policy "vehicles_select_published"
  on vehicles for select
  to anon, authenticated
  using (status = 'published');

create policy "vehicle_images_select_of_published"
  on vehicle_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from vehicles v
      where v.id = vehicle_images.vehicle_id and v.status = 'published'
    )
  );

create policy "vehicle_3d_models_select_of_published"
  on vehicle_3d_models for select
  to anon, authenticated
  using (
    exists (
      select 1 from vehicles v
      where v.id = vehicle_3d_models.vehicle_id and v.status = 'published'
    )
  );
