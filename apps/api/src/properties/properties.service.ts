import { Injectable, NotFoundException } from "@nestjs/common";
import { RlsQueryService } from "../common/db/rls-query.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

/**
 * Nunca usa el cliente admin de Supabase ni bypassea RLS de ninguna
 * forma — cada método pasa por `withUserContext`, así que la fila que
 * Postgres deja pasar es exactamente lo que el usuario puede ver o
 * modificar según las policies de `properties`. Este servicio no
 * filtra por tenant_id "a mano" en ningún WHERE: si alguien pide un
 * `id` que no es de su tenant, la query simplemente no lo encuentra,
 * porque la base de datos ya lo excluyó.
 */
@Injectable()
export class PropertiesService {
  constructor(private readonly rls: RlsQueryService) {}

  list(userId: string) {
    return this.rls.withUserContext(userId, async (client) => {
      const { rows } = await client.query(
        `select * from public.properties order by created_at desc`,
      );
      return rows;
    });
  }

  // Página pública (sin login) de un tenant: RLS con el rol `anon` ya
  // limita esto a filas `status = 'activa'` y a las columnas otorgadas
  // en la migración 0003 — el `where tenant_id = $1` de acá es solo
  // para no mostrar propiedades de otras inmobiliarias en esta página,
  // no es la barrera de seguridad (esa es la policy de RLS).
  listPublic(tenantId: string) {
    return this.rls.asAnon(async (client) => {
      const { rows } = await client.query(
        `select id, tenant_id, title, description, price, zone, type, created_at
         from public.properties
         where tenant_id = $1
         order by created_at desc`,
        [tenantId],
      );
      return rows;
    });
  }

  async findOne(userId: string, id: string) {
    const row = await this.rls.withUserContext(userId, async (client) => {
      const { rows } = await client.query(
        `select * from public.properties where id = $1`,
        [id],
      );
      return rows[0];
    });
    if (!row) {
      throw new NotFoundException("Propiedad no encontrada");
    }
    return row;
  }

  create(userId: string, tenantId: string, dto: CreatePropertyDto) {
    return this.rls.withUserContext(userId, async (client) => {
      const { rows } = await client.query(
        `insert into public.properties (tenant_id, title, description, price, zone, type, created_by)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning *`,
        [tenantId, dto.title, dto.description ?? null, dto.price, dto.zone ?? null, dto.type, userId],
      );
      return rows[0];
    });
  }

  async update(userId: string, id: string, dto: UpdatePropertyDto) {
    const fields = Object.entries(dto).filter(([, v]) => v !== undefined);
    if (fields.length === 0) {
      return this.findOne(userId, id);
    }

    const setClause = fields.map(([key], i) => `${toColumn(key)} = $${i + 2}`).join(", ");
    const values = fields.map(([, v]) => v);

    const row = await this.rls.withUserContext(userId, async (client) => {
      const { rows } = await client.query(
        `update public.properties set ${setClause} where id = $1 returning *`,
        [id, ...values],
      );
      return rows[0];
    });

    if (!row) {
      // O no existe, o existe en otro tenant/rol sin permiso — en
      // ambos casos RLS ya lo filtró, así que desde afuera se ve igual.
      throw new NotFoundException("Propiedad no encontrada");
    }
    return row;
  }

  async remove(userId: string, id: string) {
    const row = await this.rls.withUserContext(userId, async (client) => {
      const { rows } = await client.query(
        `delete from public.properties where id = $1 returning id`,
        [id],
      );
      return rows[0];
    });
    if (!row) {
      throw new NotFoundException("Propiedad no encontrada");
    }
    return { id: row.id };
  }
}

function toColumn(dtoKey: string): string {
  // camelCase -> snake_case para las pocas columnas que lo requieren
  return dtoKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
