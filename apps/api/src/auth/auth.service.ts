import { ConflictException, Injectable } from "@nestjs/common";
import { RlsQueryService } from "../common/db/rls-query.service";

@Injectable()
export class AuthService {
  constructor(private readonly rls: RlsQueryService) {}

  /**
   * Registro atómico de una inmobiliaria nueva. Llama a la función
   * `register_tenant(...)` de Postgres (0002_rls_policies.sql) dentro
   * de una transacción con el contexto del usuario que se acaba de
   * autenticar — auth.uid() dentro de esa función resuelve al mismo
   * id que si la llamada hubiera llegado por PostgREST.
   */
  async registerTenant(userId: string, tenantName: string) {
    try {
      const tenantId = await this.rls.withUserContext(userId, async (client) => {
        const { rows } = await client.query(
          `select public.register_tenant($1) as id`,
          [tenantName],
        );
        return rows[0].id as string;
      });
      return { tenantId, role: "owner" as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("ya pertenece a un tenant")) {
        throw new ConflictException(
          "Este usuario ya pertenece a una inmobiliaria",
        );
      }
      throw err;
    }
  }
}
