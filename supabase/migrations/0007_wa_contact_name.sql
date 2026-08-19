-- 3R Connect CRM — nombre de WhatsApp del cliente
--
-- Meta manda el nombre de perfil de WhatsApp del remitente en el
-- payload del webhook (`entry[].changes[].value.contacts[].profile.name`),
-- separado del array `messages[]`. Lo guardamos en cada mensaje
-- entrante (no en `contacts.name`) porque `contacts.tenant_id` es
-- NOT NULL — no se puede crear una fila de contacto para un número
-- nuevo que todavía no le pertenece a ningún tenant, así que guardar
-- el nombre en el mensaje mismo es lo único que funciona sin importar
-- si el número ya está "reclamado" por una inmobiliaria o no.

alter table public.messages
  add column if not exists wa_contact_name text;
