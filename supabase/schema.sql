-- ════════════════════════════════════════════════════════════════════
--  TITAN MOTORS — database schema, security policies and storage
--  Run once in Supabase Dashboard → SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Administrators ────────────────────────────────────────────────
-- Only users listed here can manage inventory and read enquiries.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- No policies on purpose: the table is invisible to the public API.
-- Manage it from the SQL editor (see README).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ─── Vehicles ──────────────────────────────────────────────────────
create table if not exists public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  make         text not null check (char_length(make) between 1 and 80),
  model        text not null check (char_length(model) between 1 and 120),
  year         int  not null check (year between 1900 and 2100),
  price        numeric(12, 2) check (price >= 0),          -- null = "Price on request"
  mileage      int  check (mileage >= 0),
  transmission text not null default 'Automatic',
  fuel_type    text not null default 'Petrol',
  engine       text,
  colour       text,
  description  text check (char_length(description) <= 4000),
  main_image   text,
  images       text[] not null default '{}',
  status       text not null default 'available' check (status in ('available', 'reserved', 'sold')),
  featured     boolean not null default false,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists vehicles_created_idx on public.vehicles (created_at desc);
create index if not exists vehicles_featured_idx on public.vehicles (featured) where featured;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists vehicles_touch on public.vehicles;
create trigger vehicles_touch before update on public.vehicles
  for each row execute function public.touch_updated_at();

alter table public.vehicles enable row level security;

drop policy if exists "Vehicles are public" on public.vehicles;
create policy "Vehicles are public" on public.vehicles
  for select to anon, authenticated using (true);

drop policy if exists "Admins insert vehicles" on public.vehicles;
create policy "Admins insert vehicles" on public.vehicles
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Admins update vehicles" on public.vehicles;
create policy "Admins update vehicles" on public.vehicles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete vehicles" on public.vehicles;
create policy "Admins delete vehicles" on public.vehicles
  for delete to authenticated using (public.is_admin());

-- ─── Enquiries ─────────────────────────────────────────────────────
create table if not exists public.enquiries (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null check (char_length(full_name) between 2 and 120),
  email            text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone            text check (char_length(phone) <= 30),
  vehicle_interest text check (char_length(vehicle_interest) <= 200),
  vehicle_id       uuid references public.vehicles (id) on delete set null,
  message          text not null check (char_length(message) between 10 and 2000),
  status           text not null default 'new' check (status in ('new', 'contacted', 'resolved')),
  created_at       timestamptz not null default now()
);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

alter table public.enquiries enable row level security;

-- Visitors may submit an enquiry, but can never read, edit or delete any.
drop policy if exists "Anyone can submit an enquiry" on public.enquiries;
create policy "Anyone can submit an enquiry" on public.enquiries
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "Admins read enquiries" on public.enquiries;
create policy "Admins read enquiries" on public.enquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins update enquiries" on public.enquiries;
create policy "Admins update enquiries" on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete enquiries" on public.enquiries;
create policy "Admins delete enquiries" on public.enquiries
  for delete to authenticated using (public.is_admin());

-- ─── Table privileges ──────────────────────────────────────────────
-- Explicit grants so the API works even when "automatically expose new
-- tables" is off. Row Level Security above still decides which rows.
grant usage on schema public to anon, authenticated;
grant select on public.vehicles to anon, authenticated;
grant insert, update, delete on public.vehicles to authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;
revoke all on public.admins from anon, authenticated;

-- ─── Storage: vehicle photographs ──────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-images', 'vehicle-images', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Vehicle images are public" on storage.objects;
create policy "Vehicle images are public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'vehicle-images');

drop policy if exists "Admins upload vehicle images" on storage.objects;
create policy "Admins upload vehicle images" on storage.objects
  for insert to authenticated with check (bucket_id = 'vehicle-images' and public.is_admin());

drop policy if exists "Admins update vehicle images" on storage.objects;
create policy "Admins update vehicle images" on storage.objects
  for update to authenticated using (bucket_id = 'vehicle-images' and public.is_admin());

drop policy if exists "Admins delete vehicle images" on storage.objects;
create policy "Admins delete vehicle images" on storage.objects
  for delete to authenticated using (bucket_id = 'vehicle-images' and public.is_admin());

-- ─── Realtime: public site refreshes when inventory changes ────────
do $$
begin
  alter publication supabase_realtime add table public.vehicles;
exception when duplicate_object then null;
end $$;
