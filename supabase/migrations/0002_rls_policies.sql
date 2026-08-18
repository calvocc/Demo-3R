-- 3R Connect CRM — Row-Level Security
-- Esta es la pieza más importante de la demo: el aislamiento multi-tenant
-- se garantiza aquí, en Postgres, no en el código de la aplicación.

-- ─────────────────────────────────────────────────────────────
-- Funciones helper. SECURITY DEFINER + dueñas del rol que corre la
-- migración (normalmente `postgres`, que tiene BYPASSRLS) para poder
-- leer `profiles` sin recursión: si no fueran SECURITY DEFINER, leer
-- profiles adentro de una policy de profiles volvería a evaluar esa
-- misma policy sobre sí misma.
-- ─────────────────────────────────────────────────────────────
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.current_role() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Habilitar RLS en las 5 tablas
-- ─────────────────────────────────────────────────────────────
alter table public.tenants    enable row level security;
alter table public.profiles   enable row level security;
alter table public.properties enable row level security;
alter table public.contacts   enable row level security;
alter table public.messages   enable row level security;

-- ─────────────────────────────────────────────────────────────
-- GRANTs a nivel de tabla. RLS filtra FILAS; sin estos GRANTs las
-- operaciones fallan de plano (Supabase no los otorga automáticamente
-- en tablas creadas por migración SQL, solo en las creadas por el
-- dashboard) — omitirlos parece "RLS demasiado estricto" pero en
-- realidad es un permiso faltante.
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to authenticated;
grant select on public.tenants to authenticated;
grant select, insert, update (full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update on public.contacts to authenticated;
grant select, insert on public.messages to authenticated;

-- ─────────────────────────────────────────────────────────────
-- tenants: cada usuario solo ve su propio tenant
-- ─────────────────────────────────────────────────────────────
create policy tenants_select_own on public.tenants
  for select
  using (id = public.current_tenant_id());

-- ─────────────────────────────────────────────────────────────
-- profiles: solo perfiles del mismo tenant; cada quien edita su
-- propio nombre (no su rol ni su tenant — eso solo vía backend con
-- lógica explícita de autorización, nunca desde el cliente)
-- ─────────────────────────────────────────────────────────────
create policy profiles_select_same_tenant on public.profiles
  for select
  using (tenant_id = public.current_tenant_id());

create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- el owner crea el profile de cada agente/cliente que invita, dentro
-- de su propio tenant (el auth.users del invitado ya existe para este
-- punto, creado por el backend vía Admin API — ver users.service.ts)
create policy profiles_insert_by_owner on public.profiles
  for insert
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() = 'owner'
  );

-- ─────────────────────────────────────────────────────────────
-- properties: SELECT para todo el tenant; INSERT/UPDATE/DELETE solo
-- para owner/agente. El rol `cliente` queda sin ningún policy de
-- escritura — no puede crear/editar/borrar propiedades aunque
-- alguien manipule el frontend, porque la base de datos lo rechaza.
-- ─────────────────────────────────────────────────────────────
create policy properties_select_tenant on public.properties
  for select
  using (tenant_id = public.current_tenant_id());

create policy properties_insert_tenant on public.properties
  for insert
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

create policy properties_update_tenant on public.properties
  for update
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

create policy properties_delete_tenant on public.properties
  for delete
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

-- ─────────────────────────────────────────────────────────────
-- contacts: solo owner/agente del tenant (el rol cliente no necesita
-- verlos, y de hecho no debería). INSERT/UPDATE permiten el upsert
-- que hace el flujo de "enviar propiedad por WhatsApp" (POST
-- /messages/send), que sí corre con el contexto del agente que envía.
-- El INSERT del webhook entrante, en cambio, no tiene un usuario
-- autenticado detrás (viene de Meta, verificado por firma HMAC, no
-- por JWT) y usa una conexión "de sistema" que no pasa por estas
-- policies — ver apps/api/src/common/db/rls-query.service.ts.
-- ─────────────────────────────────────────────────────────────
create policy contacts_select_tenant on public.contacts
  for select
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

create policy contacts_insert_tenant on public.contacts
  for insert
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

create policy contacts_update_tenant on public.contacts
  for update
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

-- ─────────────────────────────────────────────────────────────
-- messages: SIN policy para `cliente` en absoluto — 0 acceso a nivel
-- de base de datos, no solo oculto en la UI.
-- ─────────────────────────────────────────────────────────────
create policy messages_select_tenant on public.messages
  for select
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

create policy messages_insert_tenant on public.messages
  for insert
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente')
  );

-- ─────────────────────────────────────────────────────────────
-- register_tenant: registro atómico. El primer usuario de una
-- inmobiliaria nueva crea el tenant y su propio profile como 'owner'.
-- SECURITY DEFINER porque `authenticated` no tiene INSERT directo en
-- `tenants` (a propósito: solo se crea vía este flujo controlado).
-- auth.uid() se resuelve igual sin importar si la llamada llega por
-- PostgREST o por una conexión directa a Postgres que haya hecho
-- `SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', ...)`
-- antes de invocar la función — es exactamente el mismo mecanismo.
-- ─────────────────────────────────────────────────────────────
create or replace function public.register_tenant(p_tenant_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
begin
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'El usuario ya pertenece a un tenant';
  end if;

  insert into public.tenants (name)
  values (p_tenant_name)
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, role, email)
  values (auth.uid(), v_tenant_id, 'owner', auth.jwt() ->> 'email');

  return v_tenant_id;
end;
$$;

grant execute on function public.register_tenant(text) to authenticated;
