-- Fix: funciones sin search_path fijo (warning "Function Search Path Mutable"
-- en el linter de Supabase). Sin `set search_path`, una función plpgsql
-- resuelve nombres de tabla/función según el search_path de quien la llama,
-- lo que permite hijacking si alguien crea un objeto con el mismo nombre en
-- un schema anterior en ese search_path. Fijarlo a `public` elimina el riesgo.
--
-- Los tres triggers de notificaciones corren como el rol que dispara el
-- evento (inserts hechos por el backend con service_role, ver
-- database/rls/004_backend_only_policies.sql), así que `security invoker`
-- alcanza: no necesitan escalar privilegios, solo un search_path fijo.

create or replace function notify_on_message()
returns trigger language plpgsql
security invoker set search_path = public
as $$
declare
  v_sender_name text;
  v_vehicle_info text;
begin
  select name into v_sender_name from users where id = NEW.sender_id;
  select brand || ' ' || model into v_vehicle_info from vehicles where id = NEW.vehicle_id;

  insert into notifications(user_id, type, title, body, icon, link)
  values (
    NEW.receiver_id,
    'message',
    'Nuevo mensaje',
    v_sender_name || ' preguntó por tu ' || coalesce(v_vehicle_info, 'vehículo'),
    'chat_bubble',
    '/dashboard?tab=mensajes'
  );
  return NEW;
end;
$$;

create or replace function notify_on_favorite()
returns trigger language plpgsql
security invoker set search_path = public
as $$
declare
  v_vehicle_seller uuid;
  v_vehicle_info text;
begin
  select seller_id, brand || ' ' || model into v_vehicle_seller, v_vehicle_info
  from vehicles where id = NEW.vehicle_id;

  if v_vehicle_seller is not null and v_vehicle_seller != NEW.user_id then
    insert into notifications(user_id, type, title, body, icon, link)
    values (
      v_vehicle_seller,
      'favorite',
      'Nuevo favorito',
      'Alguien guardó tu ' || v_vehicle_info,
      'favorite',
      '/vehicles/' || NEW.vehicle_id
    );
  end if;
  return NEW;
end;
$$;

create or replace function notify_on_model_ready()
returns trigger language plpgsql
security invoker set search_path = public
as $$
declare
  v_seller_id uuid;
  v_vehicle_info text;
  v_vehicle_id uuid;
begin
  if NEW.status = 'completed' and OLD.status != 'completed' then
    select v.seller_id, v.brand || ' ' || v.model, v.id
    into v_seller_id, v_vehicle_info, v_vehicle_id
    from vehicles v where v.id = NEW.vehicle_id;

    if v_seller_id is not null then
      insert into notifications(user_id, type, title, body, icon, link)
      values (
        v_seller_id,
        'model_ready',
        'Modelo 3D listo',
        'El modelo 3D de tu ' || v_vehicle_info || ' está listo',
        'view_in_ar',
        '/vehicles/' || v_vehicle_id
      );
    end if;
  end if;
  return NEW;
end;
$$;

-- prevent_self_role_escalation: aún no aplicada en producción, se crea junto
-- con su trigger en database/rls/002_users_policies.sql (ya corregida ahí
-- con `security definer set search_path = public`, necesario porque debe
-- leer OLD/NEW con permisos elevados para no poder ser bypasseada).
