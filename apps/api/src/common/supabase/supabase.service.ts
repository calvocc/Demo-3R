import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Único punto de contacto con la API de Supabase fuera del login.
 *
 * - `authClient` (anon key): se usa exclusivamente para validar el JWT
 *   de una request (`auth.getUser(token)`), es decir, verificar
 *   identidad — no para leer/escribir datos de negocio.
 * - `adminClient` (service role key): se usa exclusivamente para crear
 *   usuarios nuevos de Auth al invitar agentes (Admin API), porque solo
 *   Supabase puede crear un `auth.users`. Nunca se usa para consultar
 *   `properties`/`messages`/etc. — eso vive en RlsQueryService.
 */
@Injectable()
export class SupabaseService {
  readonly authClient: SupabaseClient;
  readonly adminClient: SupabaseClient;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>("SUPABASE_URL");
    const anonKey = config.getOrThrow<string>("SUPABASE_ANON_KEY");
    const serviceRoleKey = config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY");

    this.authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
}
