import { Injectable, NotFoundException } from "@nestjs/common";
import { RlsQueryService } from "../common/db/rls-query.service";

/**
 * Lecturas sin sesión (rol `anon` en Postgres) para la página pública
 * de cada inmobiliaria. Solo el tenant en sí — las propiedades públicas
 * viven en PropertiesService.listPublic, que comparte el mismo patrón.
 */
@Injectable()
export class PublicService {
  constructor(private readonly rls: RlsQueryService) {}

  async getTenant(tenantId: string) {
    const row = await this.rls.asAnon(async (client) => {
      const { rows } = await client.query(
        `select id, name from public.tenants where id = $1`,
        [tenantId],
      );
      return rows[0];
    });
    if (!row) {
      throw new NotFoundException("Inmobiliaria no encontrada");
    }
    return row;
  }
}
