-- 3R Connect CRM — rol `broker` + teléfono de contacto en profiles
--
-- Motivo: la pantalla de "Agentes" deja de poder invitar `cliente`
-- (los clientes ahora navegan la página pública sin login, ver
-- 0003_public_properties.sql) y en su lugar separa el personal de la
-- inmobiliaria en dos roles: `agente` y `broker`. Ambos tienen
-- exactamente los mismos permisos que antes tenía `agente` — es una
-- distinción de título/etiqueta, no de nivel de acceso — así que en
-- todas las policies de RLS donde antes decía `in ('owner','agente')`
-- ahora agregamos `broker` a la lista.
--
-- `phone` guarda el WhatsApp del agente/broker (indicativo de país +
-- número, solo dígitos, mismo formato que usa wa.me — ver
-- apps/web/lib/whatsapp.ts) para que el bot pueda contactarlo cuando
-- un cliente pregunta por una de sus propiedades.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'agente', 'broker', 'cliente'));

alter table public.profiles
  add column if not exists phone text;

-- ─────────────────────────────────────────────────────────────
-- properties: agregar `broker` donde antes solo estaba `agente`
-- ─────────────────────────────────────────────────────────────
alter policy properties_insert_tenant on public.properties
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );

alter policy properties_update_tenant on public.properties
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );

alter policy properties_delete_tenant on public.properties
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );

-- ─────────────────────────────────────────────────────────────
-- contacts
-- ─────────────────────────────────────────────────────────────
alter policy contacts_select_tenant on public.contacts
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );

alter policy contacts_insert_tenant on public.contacts
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );

alter policy contacts_update_tenant on public.contacts
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );

-- ─────────────────────────────────────────────────────────────
-- messages
-- ─────────────────────────────────────────────────────────────
alter policy messages_select_tenant on public.messages
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );

alter policy messages_insert_tenant on public.messages
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );
