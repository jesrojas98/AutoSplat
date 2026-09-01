-- users: el frontend (cliente anon) hace upsert directo tras signUp/OAuth
-- (ver apps/frontend/src/store/auth.store.ts y AuthCallback.tsx), así que
-- necesita permiso real de INSERT/UPDATE sobre su propia fila.
--
-- Sin protección adicional, ese upsert deja que cualquier usuario autenticado
-- escriba su propio 'role' (p. ej. 'admin') o el 'id' de otra fila. El
-- trigger de abajo congela 'role' e 'id' en UPDATE salvo que la sesión sea
-- service_role (backend), que ya bypassa RLS pero también dispara triggers.

create policy "users_select_own"
  on users for select
  to authenticated
  using (auth.uid() = id);

-- El INSERT inicial (signUp/OAuth) también trae 'role' elegido por el cliente
-- (auth.store.ts, AuthCallback.tsx) — se restringe a 'buyer'/'seller', nunca 'admin'.
create policy "users_insert_own"
  on users for insert
  to authenticated
  with check (auth.uid() = id and role in ('buyer', 'seller'));

create policy "users_update_own"
  on users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Congela id y role en UPDATE hecho por el propio usuario (anon/authenticated).
-- service_role bypassa RLS pero no triggers, así que se le exime explícitamente
-- usando auth.role() = 'service_role' (disponible en el JWT de service_role).
create or replace function prevent_self_role_escalation()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'service_role' then
    return NEW;
  end if;

  if NEW.id is distinct from OLD.id then
    raise exception 'No permitido cambiar el id del usuario';
  end if;

  if NEW.role is distinct from OLD.role then
    raise exception 'No permitido cambiar el role desde el cliente';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on users;
create trigger trg_prevent_self_role_escalation
  before update on users
  for each row execute function prevent_self_role_escalation();
