import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { RlsQueryService } from "../db/rls-query.service";

export interface RequestProfile {
  tenantId: string;
  role: "owner" | "agente" | "cliente";
}

/**
 * Corre después de SupabaseAuthGuard. Busca el `profile` (tenant_id +
 * role) del usuario autenticado, usando la MISMA conexión con contexto
 * de usuario que usa el resto de la app — es decir, esta consulta
 * también pasa por RLS (`profiles_select_same_tenant`), no es una
 * excepción.
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
        `select tenant_id, role from public.profiles where id = $1`,
        [req.userId],
      );
      return rows;
    });

    req.profile = rows[0]
      ? ({ tenantId: rows[0].tenant_id, role: rows[0].role } satisfies RequestProfile)
      : null;

    return true;
  }
}
