/**
 * Seed de demo: 2 tenants (inmobiliarias), cada uno con un owner, un
 * agente y un cliente, más 2-3 propiedades. Es idempotente — se puede
 * correr varias veces sin duplicar usuarios ni tenants.
 *
 * Corre enteramente sobre HTTPS con el cliente de Supabase (Admin API
 * + PostgREST con la service_role key, que bypassea RLS por diseño)
 * en vez de una conexión directa a Postgres — así funciona incluso en
 * entornos donde solo se permite salida HTTPS (como este sandbox). El
 * resto de la app SÍ usa conexión directa a Postgres (ver
 * RlsQueryService); este script es la única excepción, justificada
 * porque es una tarea de setup/infraestructura puntual, no una ruta
 * de negocio de la app.
 *
 * Uso: pnpm --filter api seed
 * Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en apps/api/.env,
 * y que las migraciones de supabase/migrations/ ya estén aplicadas.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const DEMO_PASSWORD = "Demo1234!";

const TENANTS = [
  {
    name: "Inmobiliaria Demo A",
    slug: "a",
    properties: [
      { title: "Apartamento en El Poblado", price: 450_000_000, zone: "El Poblado", type: "venta" },
      { title: "Casa campestre en Llanogrande", price: 3_800_000, zone: "Llanogrande", type: "alquiler" },
      { title: "Local comercial en Laureles", price: 620_000_000, zone: "Laureles", type: "venta" },
    ],
  },
  {
    name: "Inmobiliaria Demo B",
    slug: "b",
    properties: [
      { title: "Apartaestudio en Chapinero", price: 1_900_000, zone: "Chapinero", type: "alquiler" },
      { title: "Casa en Cajicá", price: 780_000_000, zone: "Cajicá", type: "venta" },
    ],
  },
] as const;

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const credentials: Array<{ tenant: string; role: string; email: string; password: string }> = [];

  for (const tenant of TENANTS) {
    console.log(`\n== ${tenant.name} ==`);
    const tenantId = await upsertTenant(admin, tenant.name);

    const roles = ["owner", "agente", "cliente"] as const;
    const profileIds: Record<string, string> = {};

    for (const role of roles) {
      const email = `${role}.${tenant.slug}@3rconnect.demo`;
      const userId = await upsertAuthUser(
        admin,
        email,
        DEMO_PASSWORD,
        `${capitalize(role)} Demo ${tenant.slug.toUpperCase()}`,
      );
      await upsertProfile(admin, userId, tenantId, role, email);
      profileIds[role] = userId;
      credentials.push({ tenant: tenant.name, role, email, password: DEMO_PASSWORD });
      console.log(`  ✓ ${role}: ${email}`);
    }

    for (const prop of tenant.properties) {
      await upsertProperty(admin, tenantId, profileIds.owner, prop);
    }
    console.log(`  ✓ ${tenant.properties.length} propiedades`);
  }

  console.log("\n\n===== Credenciales de demo =====");
  for (const c of credentials) {
    console.log(`${c.tenant.padEnd(22)} ${c.role.padEnd(8)} ${c.email.padEnd(28)} ${c.password}`);
  }
  console.log("=================================\n");
}

async function upsertTenant(admin: ReturnType<typeof createClient>, name: string): Promise<string> {
  const { data: existing, error: selectError } = await admin
    .from("tenants")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data, error } = await admin.from("tenants").insert({ name }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function upsertAuthUser(
  admin: ReturnType<typeof createClient>,
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (!error && created.user) return created.user.id;

  // Ya existe: buscarlo entre los usuarios existentes.
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw error ?? new Error(`No se pudo crear ni encontrar ${email}`);
  return existing.id;
}

async function upsertProfile(
  admin: ReturnType<typeof createClient>,
  userId: string,
  tenantId: string,
  role: string,
  email: string,
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, tenant_id: tenantId, role, email }, { onConflict: "id" });
  if (error) throw error;
}

async function upsertProperty(
  admin: ReturnType<typeof createClient>,
  tenantId: string,
  createdBy: string,
  prop: { title: string; price: number; zone: string; type: string },
): Promise<void> {
  const { data: existing, error: selectError } = await admin
    .from("properties")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("title", prop.title)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return;

  const { error } = await admin.from("properties").insert({
    tenant_id: tenantId,
    title: prop.title,
    price: prop.price,
    zone: prop.zone,
    type: prop.type,
    created_by: createdBy,
  });
  if (error) throw error;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
