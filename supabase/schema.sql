-- ============================================================================
-- CutFlow Studio — Esquema Supabase Cloud (Sincronización PC + Móvil en Tiempo Real)
-- Ejecuta este script en el SQL Editor de tu proyecto gratuito de Supabase.
-- ============================================================================

create table if not exists public.studio_settings (
  id text primary key default 'main',
  editor_name text not null default 'Editor',
  studio_name text not null default 'CutFlow Studio',
  pin_code text not null default '1234',
  pin_enabled boolean not null default true,
  currency text not null default '$',
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id text primary key,
  name text not null,
  company text not null default '',
  phone text not null default '',
  email text not null default '',
  brand_folder_url text not null default '',
  preferences_notes text not null default '',
  avatar_color text not null default '#D9F950',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  title text not null,
  description text not null default '',
  client_id text not null default '',
  status text not null default 'por_cotizar',
  priority text not null default 'normal',
  format text not null default 'Reel/TikTok',
  due_date text not null,
  due_time text default '',
  price numeric not null default 0,
  amount_paid numeric not null default 0,
  payment_status text not null default 'sin_pagar',
  revisions_used integer not null default 0,
  revisions_included integer not null default 2,
  client_checklist jsonb not null default '[]'::jsonb,
  editor_checklist jsonb not null default '[]'::jsonb,
  links jsonb not null default '{"drive":"","wetransfer":"","frameio":"","references":""}'::jsonb,
  quote_id text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id text primary key,
  number text not null,
  title text not null,
  client_id text not null default '',
  client_name_snapshot text not null default '',
  format text not null default 'Reel/TikTok',
  items jsonb not null default '[]'::jsonb,
  deposit_percent numeric not null default 50,
  revisions_included integer not null default 2,
  delivery_days integer not null default 4,
  valid_until text not null default '',
  notes text not null default '',
  status text not null default 'borrador',
  converted_project_id text default null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_dates (
  id text primary key,
  title text not null,
  start_date text not null,
  end_date text not null,
  type text not null default 'tentativo',
  notes text not null default ''
);

-- Habilitar Row Level Security y otorgar permisos explícitos a la API de Supabase (anon / authenticated)
alter table public.studio_settings enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.quotes enable row level security;
alter table public.blocked_dates enable row level security;

grant usage on schema public to anon, authenticated;
grant all on table public.studio_settings to anon, authenticated;
grant all on table public.clients to anon, authenticated;
grant all on table public.projects to anon, authenticated;
grant all on table public.quotes to anon, authenticated;
grant all on table public.blocked_dates to anon, authenticated;

drop policy if exists "Studio single user full access settings" on public.studio_settings;
create policy "Studio single user full access settings" on public.studio_settings for all to anon, authenticated using (true) with check (true);

drop policy if exists "Studio single user full access clients" on public.clients;
create policy "Studio single user full access clients" on public.clients for all to anon, authenticated using (true) with check (true);

drop policy if exists "Studio single user full access projects" on public.projects;
create policy "Studio single user full access projects" on public.projects for all to anon, authenticated using (true) with check (true);

drop policy if exists "Studio single user full access quotes" on public.quotes;
create policy "Studio single user full access quotes" on public.quotes for all to anon, authenticated using (true) with check (true);

drop policy if exists "Studio single user full access blocked_dates" on public.blocked_dates;
create policy "Studio single user full access blocked_dates" on public.blocked_dates for all to anon, authenticated using (true) with check (true);

-- Habilitar Realtime para sincronización instantánea entre PC y celular
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'projects'
  ) then
    alter publication supabase_realtime add table public.projects;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'clients'
  ) then
    alter publication supabase_realtime add table public.clients;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'quotes'
  ) then
    alter publication supabase_realtime add table public.quotes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'blocked_dates'
  ) then
    alter publication supabase_realtime add table public.blocked_dates;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'studio_settings'
  ) then
    alter publication supabase_realtime add table public.studio_settings;
  end if;
end $$;
