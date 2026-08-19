import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { RlsQueryService } from "../db/rls-query.service";

export interface RequestProfile {
  tenantId: string;
  role: "owner" | "agente" | "broker" | "cliente";
  fullName: string | null;
  // Nombre de la inmobiliaria (tenants.name) — el sidebar lo muestra
  // en vez del rol cuando quien está logueado es el owner, porque esa
  // cuenta representa a la inmobiliaria misma, no a una persona (ver
  // register_tenant en 0002_rls_policies.sql).
  tenantName: string | null;
}

/**
 * Corre después de SupabaseAuthGuard. Busca el `profile` (tenant_id +
 * role) del usuario autenticado, usando la MISMA conexión con contexto
 * de usuario que usa el resto de la app — es decir, esta consulta
 * también pasa por RLS (`profiles_select_same_tenant` + `tenants_select_own`),
 * no es una excepción.
 *
 * No lanza error si el usuario todavía no tiene profile (recién hizo
 * signUp pero no ha llamado a /auth/register-tenant): deja
 * `req.profile = null` y cada endpoint decide qué hacer con eso.
 */
@Injectable()
export class ProfileGuard implements CanActivate {
  constructor(private readonly rls: RlsQueryService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const rows = await this.rls.withUserContext(req.userId, async (client) => {
      const { rows } = await client.query(
        `select p.tenant_id, p.role, p.full_name, t.name as tenant_name
         from public.profiles p
         join public.tenants t on t.id = p.tenant_id
         where p.id = $1`,
        [req.userId],
      );
      return rows;
    });

    req.profile = rows[0]
      ? ({
          tenantId: rows[0].tenant_id,
          role: rows[0].role,
          fullName: rows[0].full_name,
          tenantName: rows[0].tenant_name,
        } satisfies RequestProfile)
      : null;

    return true;
  }
}
