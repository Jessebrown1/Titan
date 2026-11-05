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

-- ─── Rentals ───────────────────────────────────────────────────────
-- A vehicle can be for sale, for rent, or both. Rental requests live in
-- enquiries (type = 'rental'); nothing is paid online.
alter table public.vehicles add column if not exists for_sale boolean not null default true;
alter table public.vehicles add column if not exists for_rent boolean not null default false;
alter table public.vehicles add column if not exists rent_per_day numeric(12, 2) check (rent_per_day >= 0);

alter table public.enquiries add column if not exists type text not null default 'sale';
alter table public.enquiries add column if not exists rent_start date;
alter table public.enquiries add column if not exists rent_end date;
alter table public.enquiries add column if not exists with_driver boolean not null default false;

alter table public.enquiries drop constraint if exists enquiries_type_check;
alter table public.enquiries add constraint enquiries_type_check check (type in ('sale', 'rental'));
alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check
  check (status in ('new', 'contacted', 'resolved', 'confirmed', 'declined'));
alter table public.enquiries drop constraint if exists enquiries_rental_dates_check;
alter table public.enquiries add constraint enquiries_rental_dates_check
  check (type <> 'rental' or (rent_start is not null and rent_end is not null and rent_end >= rent_start));

create index if not exists enquiries_rental_idx on public.enquiries (vehicle_id, rent_start) where type = 'rental';

-- Dates already taken for a car. Exposes date ranges only, never customer details.
create or replace function public.vehicle_booked_dates(vehicle uuid)
returns table (rent_start date, rent_end date)
language sql
stable
security definer
set search_path = public
as $$
  select e.rent_start, e.rent_end
  from public.enquiries e
  where e.vehicle_id = vehicle and e.type = 'rental' and e.status = 'confirmed'
    and e.rent_end >= current_date
  order by e.rent_start;
$$;
revoke all on function public.vehicle_booked_dates(uuid) from public;
grant execute on function public.vehicle_booked_dates(uuid) to anon, authenticated;

-- ─── Rental documents and test drives ──────────────────────────────
-- Licences and IDs live in a PRIVATE bucket: visitors can upload but never
-- read, list or replace files. Only admins can open them, via short-lived links.
alter table public.enquiries add column if not exists licence_path text;
alter table public.enquiries add column if not exists id_path text;
alter table public.enquiries add column if not exists drive_date date;
alter table public.enquiries add column if not exists drive_time text;

alter table public.enquiries drop constraint if exists enquiries_type_check;
alter table public.enquiries add constraint enquiries_type_check check (type in ('sale', 'rental', 'test_drive'));
alter table public.enquiries drop constraint if exists enquiries_test_drive_check;
alter table public.enquiries add constraint enquiries_test_drive_check
  check (type <> 'test_drive' or (drive_date is not null and drive_time is not null));

create or replace function public.vehicle_test_drive_slots(vehicle uuid)
returns table (drive_date date, drive_time text)
language sql
stable
security definer
set search_path = public
as $$
  select e.drive_date, e.drive_time
  from public.enquiries e
  where e.vehicle_id = vehicle and e.type = 'test_drive' and e.status = 'confirmed'
    and e.drive_date >= current_date;
$$;
revoke all on function public.vehicle_test_drive_slots(uuid) from public;
grant execute on function public.vehicle_test_drive_slots(uuid) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rental-documents', 'rental-documents', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Visitors upload rental documents" on storage.objects;
create policy "Visitors upload rental documents" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'rental-documents' and (storage.foldername(name))[1] = 'rentals');

drop policy if exists "Admins read rental documents" on storage.objects;
create policy "Admins read rental documents" on storage.objects
  for select to authenticated using (bucket_id = 'rental-documents' and public.is_admin());

drop policy if exists "Admins delete rental documents" on storage.objects;
create policy "Admins delete rental documents" on storage.objects
  for delete to authenticated using (bucket_id = 'rental-documents' and public.is_admin());

-- ─── Live admin notifications ──────────────────────────────────────
-- push_config holds the push keys: it has no API access at all. If you use a
-- different Supabase project, change the URL in notify_admins() below.
create extension if not exists pg_net;

create table if not exists public.admin_push_subscriptions (
  endpoint     text primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);
alter table public.admin_push_subscriptions enable row level security;
drop policy if exists "Admins manage their own devices" on public.admin_push_subscriptions;
create policy "Admins manage their own devices" on public.admin_push_subscriptions
  for all to authenticated
  using (public.is_admin() and user_id = auth.uid())
  with check (public.is_admin() and user_id = auth.uid());
grant select, insert, update, delete on public.admin_push_subscriptions to authenticated;

create table if not exists public.push_config (
  id             boolean primary key default true check (id),
  public_key     text,
  private_key    text,
  webhook_secret text not null default encode(extensions.gen_random_bytes(32), 'hex')
);
alter table public.push_config enable row level security;
revoke all on public.push_config from anon, authenticated;
grant all on public.push_config to service_role;
grant all on public.admin_push_subscriptions to service_role;
insert into public.push_config (id) values (true) on conflict (id) do nothing;

create or replace function public.notify_admins()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  secret text;
begin
  select webhook_secret into secret from public.push_config;
  perform net.http_post(
    url := 'https://prjsuywcebjpzbtaugyy.supabase.co/functions/v1/notify-admins',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    body := jsonb_build_object('id', new.id)
  );
  return new;
exception when others then
  return new; -- a notification problem must never stop a customer's enquiry
end $$;
revoke all on function public.notify_admins() from public;

drop trigger if exists enquiries_notify_admins on public.enquiries;
create trigger enquiries_notify_admins after insert on public.enquiries
  for each row execute function public.notify_admins();

do $$
begin
  alter publication supabase_realtime add table public.enquiries;
exception when duplicate_object then null;
end $$;

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
