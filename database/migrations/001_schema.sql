-- ── 001: users ──────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  phone text,
  avatar_url text,
  password_hash text not null,
  role text not null default 'seller' check (role in ('buyer', 'seller', 'admin')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── 002: vehicles ────────────────────────────────────────────────
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references users(id) on delete set null,
  brand text not null,
  model text not null,
  year int not null check (year >= 1900 and year <= 2030),
  price int not null check (price > 0),
  mileage int not null check (mileage >= 0),
  transmission text check (transmission in ('manual', 'automatic', 'cvt')),
  fuel_type text check (fuel_type in ('gasoline', 'diesel', 'electric', 'hybrid')),
  body_type text,
  color text,
  doors int,
  location text not null,
  region text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'sold', 'inactive')),
  views_count int default 0,
  has_3d_model boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vehicles_status on vehicles(status);
create index if not exists idx_vehicles_brand_model on vehicles(brand, model);
create index if not exists idx_vehicles_price on vehicles(price);
create index if not exists idx_vehicles_seller on vehicles(seller_id);

-- ── 003: vehicle_images ──────────────────────────────────────────
create table if not exists vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  cloudinary_public_id text,
  image_url text not null,
  thumbnail_url text,
  image_type text not null check (image_type in ('gallery', 'reconstruction', 'damage', 'interior', 'thumbnail')),
  angle_label text,
  sort_order int default 0,
  width int,
  height int,
  file_size_kb int,
  created_at timestamptz default now()
);

create index if not exists idx_vehicle_images_vehicle on vehicle_images(vehicle_id);

-- ── 004: vehicle_3d_models ───────────────────────────────────────
create table if not exists vehicle_3d_models (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  model_url text,
  preview_image_url text,
  format text check (format in ('splat', 'ply', 'spz')),
  file_size_mb numeric(10, 2),
  num_gaussians int,
  processing_time_seconds int,
  input_images_count int,
  error_message text,
  nerfstudio_run_id text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ── 005: processing_jobs ─────────────────────────────────────────
create table if not exists processing_jobs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  model_id uuid references vehicle_3d_models(id) on delete cascade,
  job_type text not null default 'gaussian_splatting',
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  priority int default 0,
  progress int default 0 check (progress >= 0 and progress <= 100),
  current_step text,
  worker_id text,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_jobs_status on processing_jobs(status);
create index if not exists idx_jobs_vehicle on processing_jobs(vehicle_id);

-- ── 006: favorites ───────────────────────────────────────────────
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, vehicle_id)
);

create index if not exists idx_favorites_user on favorites(user_id);

-- ── 007: messages ────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete set null,
  receiver_id uuid references users(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_messages_sender on messages(sender_id);
create index if not exists idx_messages_receiver on messages(receiver_id);
create index if not exists idx_messages_vehicle on messages(vehicle_id);
