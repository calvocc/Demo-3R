-- 3R Connect CRM — permitir "reclamar" un contacto de WhatsApp
--
-- Motivo (bug real visto en producción, confirmado por logs):
-- `contacts.phone_number` es único a nivel global (el número de
-- WhatsApp del CRM es uno solo, compartido entre todas las
-- inmobiliarias). Cuando dos tenants distintos le escriben al MISMO
-- número de prueba (inevitable en la demo, porque solo hay un par de
-- números de prueba reales disponibles), el `UPDATE ... on conflict`
-- de `messages.service.ts` fallaba con:
--
--   "new row violates row-level security policy (USING expression)
--    for table contacts"
--
-- porque `contacts_update_tenant` exigía que el tenant_id ANTERIOR de
-- la fila (el dueño actual del contacto) coincidiera con el tenant
-- del usuario que escribe — es decir, una vez que el tenant A "tenía"
-- ese contacto, ningún otro tenant podía volver a escribirle.
--
-- El mensaje de WhatsApp igual salía (la llamada a Meta ocurre antes,
-- fuera de esta transacción), pero el INSERT en `messages` quedaba
-- adentro de la misma transacción que este UPDATE, así que un
-- ROLLBACK completo hacía desaparecer el mensaje también — nada
-- quedaba guardado, y la próxima respuesta del cliente se seguía
-- enrutando al tenant viejo.
--
-- Fix: la `USING` solo exige un rol válido (puede leer/tocar
-- cualquier fila de contacts para reclamarla), y la `WITH CHECK` sigue
-- exigiendo que la fila quede, después del update, con su propio
-- tenant_id — así un tenant nunca puede dejar el contacto apuntando a
-- OTRO tenant que no sea el suyo. Esto modela el comportamiento real:
-- el último que le escribe a un cliente por el número compartido es
-- quien "posee" esa conversación de ahí en adelante.

alter policy contacts_update_tenant on public.contacts
  using (
    public.current_role() in ('owner', 'agente', 'broker')
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_role() in ('owner', 'agente', 'broker')
  );
