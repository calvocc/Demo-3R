import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RlsQueryService } from "../common/db/rls-query.service";
import { WhatsAppClientService } from "../common/whatsapp/whatsapp-client.service";
import { normalizePhone } from "../common/utils/phone";
import { SendMessageDto } from "./dto/send-message.dto";

@Injectable()
export class MessagesService {
  constructor(
    private readonly rls: RlsQueryService,
    private readonly whatsapp: WhatsAppClientService,
  ) {}

  list(userId: string) {
    return this.rls.withUserContext(userId, async (client) => {
      const { rows } = await client.query(
        `select * from public.messages order by created_at desc`,
      );
      return rows;
    });
  }

  /**
   * El agente envía una propiedad (o un texto libre) por WhatsApp a un
   * número de cliente. Además de mandar el mensaje real por la Meta
   * Cloud API, deja registro en `messages` y actualiza `contacts` para
   * que, cuando ese número responda por el webhook, sepamos a qué
   * tenant pertenece la conversación.
   */
  async send(userId: string, tenantId: string, dto: SendMessageDto) {
    const body = await this.resolveBody(userId, dto);

    let waMessageId: string | null;
    try {
      ({ waMessageId } = await this.whatsapp.sendText(dto.to, body));
    } catch (err) {
      // sendText lanza un Error plano cuando Meta responde con un status
      // no-OK (token vencido, número no autorizado, etc.) — sin este
      // catch, ese Error sin clasificar llega tal cual a NestJS y sale
      // como un 500 opaco. Lo convertimos en un error legible.
      const message = err instanceof Error ? err.message : "Error desconocido";
      throw new BadGatewayException(`No se pudo enviar el mensaje por WhatsApp: ${message}`);
    }

    return this.rls.withUserContext(userId, async (client) => {
      // Se guarda normalizado (solo dígitos) porque el webhook entrante
      // recibe los números así (sin "+") — sin esto, un mensaje que
      // responde el cliente nunca hace match contra este contacto.
      //
      // UPDATE primero, INSERT como respaldo — a propósito, en vez de
      // `insert ... on conflict do update`. Postgres exige que la fila
      // en conflicto sea visible bajo la policy de SELECT de la tabla
      // para poder resolver el conflicto, y `contacts_select_tenant`
      // sigue (correctamente) restringida por tenant — así que un
      // upsert nunca puede "reclamar" el contacto de otro tenant, por
      // más que la policy de UPDATE sí lo permita. Un UPDATE simple no
      // tiene esa dependencia de la policy de SELECT, solo de la de
      // UPDATE (`contacts_update_tenant`), que es la que de verdad
      // decide si se puede reclamar.
      const normalizedPhone = normalizePhone(dto.to);
      const { rowCount } = await client.query(
        `update public.contacts
         set tenant_id = $2, last_agent_profile_id = $3, updated_at = now()
         where phone_number = $1`,
        [normalizedPhone, tenantId, userId],
      );
      if (rowCount === 0) {
        await client.query(
          `insert into public.contacts (phone_number, tenant_id, last_agent_profile_id)
           values ($1, $2, $3)`,
          [normalizedPhone, tenantId, userId],
        );
      }

      const { rows } = await client.query(
        `insert into public.messages
           (tenant_id, direction, wa_from, wa_to, body, related_property_id, wa_message_id)
         values ($1, 'outbound', 'crm', $2, $3, $4, $5)
         returning *`,
        [tenantId, dto.to, body, dto.propertyId ?? null, waMessageId],
      );
      return rows[0];
    });
  }

  private async resolveBody(userId: string, dto: SendMessageDto): Promise<string> {
    if (dto.propertyId) {
      const property = await this.rls.withUserContext(userId, async (client) => {
        const { rows } = await client.query(
          `select * from public.properties where id = $1`,
          [dto.propertyId],
        );
        return rows[0];
      });
      if (!property) {
        throw new NotFoundException("Propiedad no encontrada");
      }
      const price = Number(property.price).toLocaleString("es-CO");
      return (
        dto.body ??
        `${property.title}\n${property.type === "venta" ? "En venta" : "En alquiler"} — $${price}\nZona: ${property.zone ?? "N/D"}\n\n${property.description ?? ""}`.trim()
      );
    }
    if (!dto.body) {
      throw new BadRequestException("Debes enviar un propertyId o un body");
    }
    return dto.body;
  }
}
