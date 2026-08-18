# 3R Connect CRM — Demo técnica multi-tenant

CRM inmobiliario mínimo pero **real**: cada inmobiliaria (tenant) se registra
sola, el primer usuario que se registra queda como *owner* de su
inmobiliaria, invita a sus agentes/brokers, y gestionan propiedades de
venta/alquiler. El aislamiento entre inmobiliarias lo garantiza **Row-Level
Security en Postgres**, no el código de la aplicación — esa es la pieza que
esta demo existe para probar.

## Arquitectura

```
apps/api   → NestJS. Dueño de su propia capa de datos: conexión directa a
             Postgres (pool `pg`), no un proxy hacia la REST API de Supabase.
apps/web   → Next.js (App Router) + shadcn/Tailwind sin personalización.
supabase/  → Migraciones SQL (schema + RLS) y seed de datos de demo.
scripts/   → Script de demo para probar RLS en vivo con curl.
```

**"Directo a Supabase" queda limitado al login.** El frontend solo habla
directo con Supabase Auth para iniciar sesión / registrarse. Todo lo demás
(propiedades, mensajes, agentes, registrar tenant) son llamadas a la API de
NestJS, que internamente abre su propia conexión a Postgres y, por cada
request, hace `SET LOCAL ROLE authenticated` + fija `request.jwt.claims` con
el id del usuario — exactamente lo que hace PostgREST por dentro — para que
las mismas policies de RLS se apliquen sin que el código de NestJS filtre
nada por `tenant_id` a mano. El detalle completo está comentado en
`apps/api/src/common/db/rls-query.service.ts`.

## 1. Poner en marcha Supabase

1. En **SQL Editor** de tu proyecto de Supabase, corre en orden:
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
2. En **Authentication → Providers → Email**, desactiva "Confirm email"
   (para que el registro de una inmobiliaria nueva no dependa de un correo
   de confirmación durante la demo).
3. Copia de **Settings → API**: Project URL, `anon`/publishable key,
   `service_role`/secret key.
4. Copia de **Settings → Database → Connection string** la URI del
   **Transaction pooler** (puerto 6543) — es compatible con el patrón
   `SET LOCAL` por transacción que usa la API.

## 2. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env      # completar con los valores de Supabase
cp apps/web/.env.example apps/web/.env.local
```

Ver cada `.env.example` para la lista completa y comentada de variables.

## 3. Instalar y correr en local

```bash
pnpm install
pnpm --filter api seed     # crea 2 tenants demo con owner/agente/cliente + propiedades
pnpm dev:api                # http://localhost:3001
pnpm dev:web                # http://localhost:3000
```

> **Nota de red:** si corres esto en un entorno con salida a internet
> restringida (solo HTTPS/443), la API no podrá conectarse a Postgres
> directamente (puertos 5432/6543 bloqueados) aunque las credenciales sean
> correctas. Pruébalo en tu máquina local o en el deploy de Railway, donde
> no hay esa restricción.

### Credenciales de demo (creadas por `pnpm --filter api seed`)

| Inmobiliaria | Rol | Correo | Contraseña |
|---|---|---|---|
| Inmobiliaria Demo A | owner | owner.a@3rconnect.demo | Demo1234! |
| Inmobiliaria Demo A | agente | agente.a@3rconnect.demo | Demo1234! |
| Inmobiliaria Demo A | cliente | cliente.a@3rconnect.demo | Demo1234! |
| Inmobiliaria Demo B | owner | owner.b@3rconnect.demo | Demo1234! |
| Inmobiliaria Demo B | agente | agente.b@3rconnect.demo | Demo1234! |
| Inmobiliaria Demo B | cliente | cliente.b@3rconnect.demo | Demo1234! |

## 4. Guion de demo para el cliente

1. **Aislamiento multi-tenant por UI** — dos ventanas (una normal, una
   incógnito): login como `owner.a@...` y `owner.b@...`. Cada uno ve solo
   sus propiedades. Crea una propiedad en A, refresca B: no aparece.
2. **RLS a nivel de base de datos, no de código** — corre:
   ```bash
   SUPABASE_URL=... SUPABASE_ANON_KEY=... \
   TENANT_A_EMAIL=owner.a@3rconnect.demo TENANT_A_PASSWORD=Demo1234! \
   TENANT_B_PROPERTY_ID=<id-de-una-propiedad-de-Demo-B> \
   ./scripts/demo/prove-rls.sh
   ```
   Muestra que pedir por `id` una propiedad ajena devuelve `200 []`, no un
   403 — la fila existe, Postgres la excluyó solo.
3. **WhatsApp de extremo a extremo** — ver sección 6.
4. **Roles** — login como `cliente.a@...`: sin botón de agregar, sin
   `/messages` ni `/agents` en el menú, y navegar directo a esas rutas
   redirige.

## 5. Desplegar (Railway + Vercel)

**Railway** (`apps/api`): nuevo proyecto → conectar el repo → root
directory `apps/api` → variables de entorno (las mismas del `.env`, más
`CORS_ORIGIN` con la URL de Vercel).

**Vercel** (`apps/web`): nuevo proyecto → root directory `apps/web` →
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_API_URL` (la URL de Railway).

## 6. Configurar el webhook de WhatsApp (Meta Cloud API)

Requiere la URL de Railway ya desplegada (Meta exige HTTPS público).

1. Meta App Dashboard → tu App → **WhatsApp → Configuration**.
2. Callback URL: `https://<tu-app>.up.railway.app/webhooks/whatsapp`.
   Verify token: el mismo valor de `WHATSAPP_VERIFY_TOKEN` en Railway.
3. Click "Verify and save" — Meta llama al `GET` del webhook; si el
   token coincide, responde con el challenge y queda verificado.
4. Suscribe el campo `messages`.
5. En **WhatsApp → API Setup**, copia `Phone Number ID` y el token de
   acceso temporal → `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN`
   en Railway. El **App Secret** está en **App Settings → Basic** →
   `WHATSAPP_APP_SECRET`.
6. Agrega tu número personal como destinatario de prueba (los números de
   prueba de Meta solo pueden enviar a números explícitamente autorizados).
7. Desde `/properties` en el CRM, click "Enviar por WhatsApp" en una
   propiedad, con tu número de prueba. Responde desde tu WhatsApp — el
   mensaje debe aparecer en `/messages`.

## Estructura de roles

- **owner** — el primer usuario de una inmobiliaria. CRUD completo de
  propiedades, invita agentes/clientes.
- **agente** — CRUD completo de propiedades, ve mensajes, no invita gente.
- **cliente** — solo lectura de propiedades, sin acceso a `/messages` ni
  `/agents` (ni en la UI ni a nivel de RLS en la base de datos).
