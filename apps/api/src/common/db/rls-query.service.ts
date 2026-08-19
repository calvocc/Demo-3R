import { Inject, Injectable } from "@nestjs/common";
import { Pool, PoolClient } from "pg";

export const PG_POOL = "PG_POOL";

/**
 * Punto ÚNICO de acceso a datos de negocio (properties, messages,
 * contacts, profiles, tenants). Nunca se hace `pool.query(...)`
 * directo fuera de aquí — así ningún endpoint puede "olvidar" el
 * contexto de usuario por accidente.
 *
 * `withUserContext` reproduce, dentro de una transacción propia,
 * exactamente lo que Supabase's PostgREST hace por cada request:
 * cambia el ROLE de la conexión a `authenticated` (la connection
 * string usa el rol `postgres`, que tiene BYPASSRLS — sin este
 * cambio de rol no habría ninguna protección real) y define
 * `request.jwt.claims` con el `sub` (user id) del usuario autenticado,
 * que es exactamente lo que lee `auth.uid()` en Postgres. Con eso,
 * las mismas policies de RLS de la base de datos se evalúan igual
 * sin importar si la query llegó por PostgREST o por esta conexión
 * directa — la diferencia es que el pool, la transacción y el
 * control de errores son 100% nuestros, dentro de la API.
 */
@Injectable()
export class RlsQueryService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async withUserContext<T>(
    userId: string,
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE authenticated");
      await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
        JSON.stringify({ sub: userId, role: "authenticated" }),
      ]);
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Corre `fn` como el rol `anon` de Postgres/Supabase — SÍ pasa por
   * RLS, pero con las policies públicas (`to anon`), no las del
   * usuario autenticado. Para endpoints que un visitante sin sesión
   * puede llamar (la página pública de propiedades de un tenant): la
   * protección real sigue viviendo en la base de datos, exactamente
   * igual que `withUserContext`, solo que sin `auth.uid()`.
   */
  async asAnon<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE anon");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Corre `fn` con el rol por defecto del pool (BYPASSRLS) — SIN
   * contexto de usuario, SIN RLS. Reservado exclusivamente para el
   * webhook de WhatsApp: esas requests las autentica Meta con una
   * firma HMAC (X-Hub-Signature-256), no hay un usuario de Supabase
   * detrás, así que no hay ningún `auth.uid()` que fijar. No usar
   * esto para nada que se origine en una request de un usuario final.
   */
  async asSystem<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }
}
