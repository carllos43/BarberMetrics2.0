-- ============================================================
-- BarberMetrics 2.0 — Supabase Schema
-- Run this in your Supabase Dashboard → SQL Editor → New Query
-- Project: fjuwphurhyoytclrmdqy
-- ============================================================

-- Clean slate (safe to re-run)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop table if exists public.appointments cascade;
drop table if exists public.services cascade;
drop table if exists public.settings cascade;

-- ----------------- TABLES -----------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  duration_minutes integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index services_user_idx on public.services(user_id, is_active);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  price numeric(10,2) not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  note text,
  created_at timestamptz not null default now()
);
create index appointments_user_started_idx on public.appointments(user_id, started_at);

create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  barbershop_name text not null default 'Minha Barbearia',
  daily_goal numeric(10,2) not null default 0,
  currency text not null default 'BRL',
  work_start_time text not null default '09:00',
  work_end_time text not null default '19:00',
  work_days integer[] not null default array[1,2,3,4,5,6],
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

-- ----------------- ROW LEVEL SECURITY -----------------

alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.settings enable row level security;

create policy "services_select_own"  on public.services      for select using (user_id = auth.uid());
create policy "services_insert_own"  on public.services      for insert with check (user_id = auth.uid());
create policy "services_update_own"  on public.services      for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "services_delete_own"  on public.services      for delete using (user_id = auth.uid());

create policy "appointments_select_own" on public.appointments for select using (user_id = auth.uid());
create policy "appointments_insert_own" on public.appointments for insert with check (user_id = auth.uid());
create policy "appointments_update_own" on public.appointments for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "appointments_delete_own" on public.appointments for delete using (user_id = auth.uid());

create policy "settings_select_own"  on public.settings      for select using (user_id = auth.uid());
create policy "settings_insert_own"  on public.settings      for insert with check (user_id = auth.uid());
create policy "settings_update_own"  on public.settings      for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------- AUTO-PROVISION SETTINGS ON SIGNUP -----------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.settings (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
