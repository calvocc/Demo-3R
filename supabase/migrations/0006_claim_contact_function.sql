-- 3R Connect CRM — función SECURITY DEFINER para "reclamar" un contacto
--
-- Motivo (segundo intento de fix, confirmado por logs): la migración
-- 0005 aflojó la policy de UPDATE de `contacts`, pero seguía fallando
-- — primero con el mismo error de RLS en el upsert (`insert ... on
-- conflict`), y después con "duplicate key value violates unique
-- constraint" al cambiar a un UPDATE simple + INSERT de respaldo.
--
-- La razón real: Postgres combina, para UPDATE/DELETE, tanto el USING
-- de la policy de ese comando COMO el USING de la policy de SELECT de
-- la tabla, para decidir qué filas son visibles/tocables — no hay
-- forma de que un UPDATE (ni siquiera uno simple, sin ON CONFLICT)
-- "vea" una fila que la policy de SELECT no deja ver. Como
-- `contacts_select_tenant` sigue (correctamente) restringida por
-- tenant, ningún UPDATE directo del rol `authenticated` puede
-- reasignar un contacto de otro tenant, sin importar qué tan permisiva
-- se haga la policy de UPDATE.
--
-- Aflojar `contacts_select_tenant` en cambio filtraría datos entre
-- inmobiliarias (cualquiera podría leer `/rest/v1/contacts` de Supabase
-- directo con su JWT y ver números/tenants ajenos) — inaceptable en una
-- demo que existe justamente para probar aislamiento multi-tenant.
--
-- Fix real: una función SECURITY DEFINER (mismo patrón que
-- `register_tenant`, `current_tenant_id()`) que hace el upsert con
-- privilegios elevados (bypassea RLS internamente), pero repite a mano
-- las mismas dos validaciones que hacían las policies: el rol de quien
-- llama y que solo pueda reclamar el contacto PARA SU PROPIO tenant
-- (nunca para uno arbitrario) — la garantía de seguridad es idéntica,
-- solo que se aplica en la función en vez de en RLS declarativo.

create or replace function public.claim_contact(
  p_phone_number text,
  p_tenant_id uuid,
  p_agent_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() not in ('owner', 'agente', 'broker') then
    raise exception 'No tienes permisos para escribir contactos';
  end if;

  if p_tenant_id is distinct from public.current_tenant_id() then
    raise exception 'No puedes reclamar un contacto para otro tenant';
  end if;

  insert into public.contacts (phone_number, tenant_id, last_agent_profile_id)
  values (p_phone_number, p_tenant_id, p_agent_profile_id)
  on conflict (phone_number)
  do update set tenant_id = excluded.tenant_id,
                 last_agent_profile_id = excluded.last_agent_profile_id,
                 updated_at = now();
end;
$$;

grant execute on function public.claim_contact(text, uuid, uuid) to authenticated;
