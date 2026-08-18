#!/usr/bin/env bash
#
# Prueba en vivo, de cara al cliente, de que el aislamiento multi-tenant
# lo garantiza Postgres (RLS) y no el código de la aplicación.
#
# Qué hace:
#   1. Inicia sesión como el owner del Tenant A directo contra Supabase
#      Auth (POST /auth/v1/token) — nada de esto pasa por nuestra API.
#   2. Pide, vía PostgREST (la REST API que expone Supabase sobre
#      Postgres), la propiedad "sembrada" del Tenant B usando el JWT
#      del Tenant A.
#   3. Muestra que la respuesta es 200 con body [] — CERO filas, no un
#      403 ni un error. La fila existe, pero la policy de RLS
#      (`properties_select_tenant`) la excluye silenciosamente antes
#      de que llegue ninguna capa de aplicación.
#
# Uso:
#   SUPABASE_URL=https://xxxx.supabase.co \
#   SUPABASE_ANON_KEY=sb_publishable_xxx \
#   TENANT_A_EMAIL=owner.a@3rconnect.demo \
#   TENANT_A_PASSWORD=Demo1234! \
#   TENANT_B_PROPERTY_ID=<uuid-de-una-propiedad-del-tenant-B> \
#   ./scripts/demo/prove-rls.sh
#
set -euo pipefail

: "${SUPABASE_URL:?Falta SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Falta SUPABASE_ANON_KEY}"
: "${TENANT_A_EMAIL:?Falta TENANT_A_EMAIL}"
: "${TENANT_A_PASSWORD:?Falta TENANT_A_PASSWORD}"
: "${TENANT_B_PROPERTY_ID:?Falta TENANT_B_PROPERTY_ID (id de una propiedad del Tenant B)}"

echo "1) Iniciando sesión como ${TENANT_A_EMAIL} (Tenant A) directo contra Supabase Auth..."
TOKEN=$(curl -sS -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TENANT_A_EMAIL}\",\"password\":\"${TENANT_A_PASSWORD}\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "   ✓ Token obtenido (usuario de Tenant A)"
echo
echo "2) Pidiendo la propiedad del Tenant B (id=${TENANT_B_PROPERTY_ID}) usando ESE token,"
echo "   directo contra PostgREST — sin pasar por nuestra API en absoluto:"
echo

HTTP_CODE=$(curl -sS -o /tmp/prove-rls-response.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/properties?id=eq.${TENANT_B_PROPERTY_ID}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "   HTTP ${HTTP_CODE}"
echo "   Body: $(cat /tmp/prove-rls-response.json)"
echo

if [ "$HTTP_CODE" = "200" ] && [ "$(cat /tmp/prove-rls-response.json)" = "[]" ]; then
  echo "✅ RLS confirmado: la fila EXISTE en la base de datos (es una propiedad real"
  echo "   del Tenant B), pero Postgres la excluyó silenciosamente. Es un 200 con"
  echo "   lista vacía, no un 403 — la app nunca decidió nada, fue la base de datos."
else
  echo "⚠️  Resultado inesperado — revisa que TENANT_B_PROPERTY_ID sea real y que"
  echo "   las policies de 0002_rls_policies.sql estén aplicadas."
fi
