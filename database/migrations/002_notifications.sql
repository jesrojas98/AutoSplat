-- Tabla de notificaciones
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null check (type in ('message', 'favorite', 'views_milestone', 'model_ready', 'vehicle_sold')),
  title text not null,
  body text not null,
  icon text not null default 'notifications',
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_unread on notifications(user_id, read_at) where read_at is null;

-- Trigger: notificación al recibir un mensaje
create or replace function notify_on_message()
returns trigger language plpgsql as $$
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

drop trigger if exists trg_notify_message on messages;
create trigger trg_notify_message
  after insert on messages
  for each row execute function notify_on_message();

-- Trigger: notificación al guardar en favoritos
create or replace function notify_on_favorite()
returns trigger language plpgsql as $$
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

drop trigger if exists trg_notify_favorite on favorites;
create trigger trg_notify_favorite
  after insert on favorites
  for each row execute function notify_on_favorite();

-- Trigger: notificación cuando el modelo 3D está listo
create or replace function notify_on_model_ready()
returns trigger language plpgsql as $$
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

drop trigger if exists trg_notify_model_ready on vehicle_3d_models;
create trigger trg_notify_model_ready
  after update on vehicle_3d_models
  for each row execute function notify_on_model_ready();
