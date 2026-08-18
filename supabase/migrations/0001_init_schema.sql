-- 3R Connect CRM — esquema inicial
-- Aplicar con el editor SQL de Supabase Studio o `supabase db push`.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- tenants: una fila por inmobiliaria
-- ─────────────────────────────────────────────────────────────
create table public.tenants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- profiles: 1:1 con auth.users, agrega tenant_id + role
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  role       text not null check (role in ('owner', 'agente', 'cliente')),
  full_name  text,
  email      text,
  created_at timestamptz not null default now()
);

create index profiles_tenant_id_idx on public.profiles (tenant_id);

-- ─────────────────────────────────────────────────────────────
-- properties: CRUD de venta/alquiler, siempre atada a un tenant
-- ─────────────────────────────────────────────────────────────
create table public.properties (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  title               text not null,
  description         text,
  price               numeric(14, 2),
  zone                text,
  type                text not null check (type in ('venta', 'alquiler')),
  status              text not null default 'activa'
                        check (status in ('activa', 'pausada', 'vendida', 'alquilada')),
  created_by          uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index properties_tenant_id_idx on public.properties (tenant_id);

-- ─────────────────────────────────────────────────────────────
-- contacts: mapea un número de WhatsApp a un tenant/agente
-- (el número de WhatsApp del CRM es único y compartido entre tenants,
--  así que necesitamos saber a qué inmobiliaria pertenece cada contacto)
-- ─────────────────────────────────────────────────────────────
create table public.contacts (
  id                    uuid primary key default gen_random_uuid(),
  phone_number          text not null unique,
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  last_agent_profile_id uuid references public.profiles(id),
  updated_at            timestamptz not null default now()
);

create index contacts_tenant_id_idx on public.contacts (tenant_id);

-- ─────────────────────────────────────────────────────────────
-- messages: log crudo de WhatsApp entrante/saliente
-- tenant_id es NULLABLE: un mensaje entrante de un número desconocido
-- (sin match en contacts) queda "sin asignar" en vez de perderse
-- ─────────────────────────────────────────────────────────────
create table public.messages (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid references public.tenants(id) on delete cascade,
  direction            text not null check (direction in ('inbound', 'outbound')),
  wa_from              text not null,
  wa_to                text not null,
  body                 text,
  related_property_id  uuid references public.properties(id),
  wa_message_id        text,
  created_at           timestamptz not null default now()
);

create index messages_tenant_id_idx on public.messages (tenant_id);

-- updated_at automático en properties
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();
