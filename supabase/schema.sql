-- Ejecuta esto en Supabase > SQL Editor

create table if not exists ebooks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  status text default 'borrador',
  title text,
  subtitle text,
  author text,
  topic text,
  settings jsonb default '{}'::jsonb,
  outline jsonb default '[]'::jsonb,
  chapters jsonb default '[]'::jsonb,
  design jsonb default '{}'::jsonb,
  kit jsonb
);

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  data jsonb not null,
  used boolean default false
);

create table if not exists app_settings (
  id int primary key default 1,
  data jsonb default '{}'::jsonb
);
insert into app_settings (id, data) values (1, '{}'::jsonb) on conflict do nothing;

-- Seguridad: solo el servidor (service role) puede leer/escribir
alter table ebooks enable row level security;
alter table ideas enable row level security;
alter table app_settings enable row level security;

-- Bucket para portadas con IA
insert into storage.buckets (id, name, public) values ('ebooks', 'ebooks', true)
on conflict (id) do nothing;
