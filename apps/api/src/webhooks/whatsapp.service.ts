import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RlsQueryService } from "../common/db/rls-query.service";
import { normalizePhone } from "../common/utils/phone";
import { WhatsAppClientService } from "../common/whatsapp/whatsapp-client.service";

// Respuesta automática del bot a cualquier mensaje entrante. No hay
// lógica real de "conectar con un agente" — es el mensaje canned que
// prueba el flujo de extremo a extremo (el cliente escribe desde la
// página pública → el bot confirma recepción). Un agente humano sigue
// viendo y respondiendo la conversación real desde /messages.
const AUTO_REPLY_BODY =
  "¡Hola! 👋 Gracias por escribirnos. Ya recibimos tu mensaje sobre la propiedad — un agente de la inmobiliaria lo va a revisar y te va a contactar por acá muy pronto.";

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly rls: RlsQueryService,
    private readonly whatsappClient: WhatsAppClientService,
  ) {}

  verifyToken(mode: string | undefined, token: string | undefined): boolean {
    return mode === "subscribe" && token === this.config.get<string>("WHATSAPP_VERIFY_TOKEN");
  }

  /**
   * Valida que el body venga realmente de Meta: recalcula el HMAC-SHA256
   * del cuerpo crudo (bytes exactos, antes de parsear JSON) con el App
   * Secret, y lo compara contra el header X-Hub-Signature-256.
   */
  verifySignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): boolean {
    const appSecret = this.config.get<string>("WHATSAPP_APP_SECRET");
    if (!appSecret || !rawBody || !signatureHeader) return false;

    const expected =
      "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /**
   * Inserta cada mensaje entrante del payload de Meta. Corre "como
   * sistema" (RlsQueryService.asSystem, sin contexto de usuario) porque
   * no hay ningún Supabase Auth user detrás de una llamada de Meta —
   * la autenticidad ya la garantizó verifySignature(). El tenant se
   * resuelve buscando el número remitente en `contacts` (se llenó
   * cuando algún agente le escribió antes desde el CRM); si no hay
   * match, el mensaje queda con tenant_id NULL ("sin asignar") en vez
   * de perderse.
   */
  async handleIncoming(payload: any): Promise<void> {
    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const myNumber: string | undefined = value?.metadata?.display_phone_number;

        // Meta manda el nombre de perfil de WhatsApp del remitente en un
        // array separado (`contacts`), no adentro de cada mensaje —
        // hay que cruzarlo por wa_id.
        const contactNames = new Map<string, string>();
        for (const contact of value?.contacts ?? []) {
          if (contact?.wa_id && contact?.profile?.name) {
            contactNames.set(contact.wa_id, contact.profile.name);
          }
        }

        for (const message of value?.messages ?? []) {
          await this.storeInboundMessage({
            waFrom: message.from,
            waTo: myNumber ?? "crm",
            body: message.text?.body ?? `[${message.type}]`,
            waMessageId: message.id,
            contactName: contactNames.get(message.from) ?? null,
          });
          await this.sendAutoReply(message.from);
        }
      }
    }
  }

  private async storeInboundMessage(msg: {
    waFrom: string;
    waTo: string;
    body: string;
    waMessageId: string;
    contactName: string | null;
  }): Promise<void> {
    await this.rls.asSystem(async (client) => {
      const { rows: contactRows } = await client.query(
        `select tenant_id from public.contacts where phone_number = $1`,
        [normalizePhone(msg.waFrom)],
      );
      const tenantId = contactRows[0]?.tenant_id ?? null;

      await client.query(
        `insert into public.messages
           (tenant_id, direction, wa_from, wa_to, body, wa_message_id, wa_contact_name)
         values ($1, 'inbound', $2, $3, $4, $5, $6)`,
        [tenantId, msg.waFrom, msg.waTo, msg.body, msg.waMessageId, msg.contactName],
      );

      if (!tenantId) {
        this.logger.warn(
          `Mensaje entrante de ${msg.waFrom} sin tenant asociado (no hay match en contacts)`,
        );
      }
    });
  }

  /**
   * Envía el mensaje canned y lo deja registrado en `messages` como
   * cualquier otro saliente (mismo patrón que MessagesService.send),
   * para que aparezca en el log de /messages. Si Meta rechaza el envío
   * no tumba el webhook — solo se loguea, Meta ya recibió su 200 por el
   * mensaje entrante.
   */
  private async sendAutoReply(to: string): Promise<void> {
    try {
      const { waMessageId } = await this.whatsappClient.sendText(to, AUTO_REPLY_BODY);
      await this.rls.asSystem(async (client) => {
        const { rows: contactRows } = await client.query(
          `select tenant_id from public.contacts where phone_number = $1`,
          [normalizePhone(to)],
        );
        const tenantId = contactRows[0]?.tenant_id ?? null;
        await client.query(
          `insert into public.messages (tenant_id, direction, wa_from, wa_to, body, wa_message_id)
           values ($1, 'outbound', 'crm', $2, $3, $4)`,
          [tenantId, to, AUTO_REPLY_BODY, waMessageId],
        );
      });
    } catch (err) {
      this.logger.error(
        `No se pudo enviar la respuesta automática a ${to}: ${(err as Error).message}`,
      );
    }
  }
}
