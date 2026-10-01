-- ============================================================================
-- Esquema de Supabase para Obreros del Porvenir
-- Ejecutalo en Supabase > SQL Editor > New query > Run
-- Es idempotente: podés volver a correrlo sin romper nada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Inscripciones
-- ---------------------------------------------------------------------------
create table if not exists public.inscripciones (
  id          uuid primary key default gen_random_uuid(),
  data        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists inscripciones_created_at_idx
  on public.inscripciones (created_at desc);

-- ---------------------------------------------------------------------------
-- Configuración del sitio (cursos, carreras, disponibilidad, imágenes)
-- ---------------------------------------------------------------------------
create table if not exists public.site_config (
  id          text primary key,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Las dos tablas se acceden únicamente desde el backend con la clave
-- service_role. Con RLS habilitado y sin policies, la clave anon que viaja
-- en el frontend no puede leer ni escribir nada.
-- ---------------------------------------------------------------------------
alter table public.inscripciones enable row level security;
alter table public.site_config  enable row level security;

-- ---------------------------------------------------------------------------
-- Bucket de archivos (fotos de DNI y certificados subidos por los alumnos)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública de los adjuntos (las imágenes se ven desde el panel admin).
drop policy if exists "uploads public read" on storage.objects;
create policy "uploads public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'uploads');