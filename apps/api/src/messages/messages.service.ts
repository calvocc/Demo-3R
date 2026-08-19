import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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

    const { waMessageId } = await this.whatsapp.sendText(dto.to, body);

    return this.rls.withUserContext(userId, async (client) => {
      // Se guarda normalizado (solo dígitos) porque el webhook entrante
      // recibe los números así (sin "+") — sin esto, un mensaje que
      // responde el cliente nunca hace match contra este contacto.
      await client.query(
        `insert into public.contacts (phone_number, tenant_id, last_agent_profile_id)
         values ($1, $2, $3)
         on conflict (phone_number)
         do update set tenant_id = excluded.tenant_id,
                        last_agent_profile_id = excluded.last_agent_profile_id,
                        updated_at = now()`,
        [normalizePhone(dto.to), tenantId, userId],
      );

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
