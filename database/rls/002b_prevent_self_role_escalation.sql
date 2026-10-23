-- Solo la función + trigger de 002_users_policies.sql (las policies de esa
-- migración ya existen en producción y create policy no es idempotente,
-- así que reejecutar el archivo completo falla con "policy already exists").
-- Este bloque es seguro de correr repetidas veces.

create or replace function prevent_self_role_escalation()
returns trigger language plpgsql
security definer set search_path = public
as $$
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

-- Es una función de trigger (usa NEW/OLD) que Postgres/PostgREST expone por
-- defecto como RPC pública (/rest/v1/rpc/prevent_self_role_escalation) para
-- anon y authenticated. No tiene sentido invocarla fuera del motor de
-- triggers, así que se revoca el EXECUTE directo (el trigger sigue
-- funcionando: lo dispara el motor, no un rol vía API).
revoke execute on function prevent_self_role_escalation() from public, anon, authenticated;
