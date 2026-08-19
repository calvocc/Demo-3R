-- 3R Connect CRM — acceso público de solo lectura a propiedades activas
--
-- Cada inmobiliaria (tenant) tiene una página pública de listados
-- (/inmobiliaria/:tenantId en el frontend) donde cualquier visitante —
-- en particular un `cliente` sin sesión— puede ver las propiedades
-- activas, sin necesidad de login. Se implementa como una fila más de
-- RLS para el rol `anon` de Postgres/Supabase, no como un bypass en la
-- capa de aplicación: el rol `anon` solo puede leer filas con
-- status = 'activa', y solo las columnas explícitamente otorgadas más
-- abajo (sin created_by, sin status, sin updated_at).
--
-- La policy original `properties_select_tenant` no tenía `to authenticated`
-- explícito, así que por defecto aplica a todos los roles (incluido
-- anon). Sin este ALTER, Postgres intentaría evaluarla también para
-- anon y fallaría por falta de permiso de EXECUTE sobre la función
-- `current_tenant_id()` (que es SECURITY DEFINER y solo se otorgó a
-- `authenticated`), rompiendo la nueva policy pública también —varias
-- policies permisivas se combinan con OR, pero un error de permisos al
-- evaluar cualquiera de ellas hace fallar la query completa.
alter policy properties_select_tenant on public.properties to authenticated;
alter policy tenants_select_own on public.tenants to authenticated;

grant usage on schema public to anon;

grant select (id, tenant_id, title, description, price, zone, type, created_at)
  on public.properties to anon;
grant select (id, name) on public.tenants to anon;

create policy properties_select_public_active on public.properties
  for select
  to anon
  using (status = 'activa');

-- El nombre de la inmobiliaria no es sensible (es el nombre del
-- negocio) y se necesita para el encabezado de su página pública.
create policy tenants_select_public on public.tenants
  for select
  to anon
  using (true);
