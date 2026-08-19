import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RlsQueryService } from "../common/db/rls-query.service";
import { normalizePhone } from "../common/utils/phone";

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly rls: RlsQueryService,
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
        for (const message of value?.messages ?? []) {
          await this.storeInboundMessage({
            waFrom: message.from,
            waTo: myNumber ?? "crm",
            body: message.text?.body ?? `[${message.type}]`,
            waMessageId: message.id,
          });
        }
      }
    }
  }

  private async storeInboundMessage(msg: {
    waFrom: string;
    waTo: string;
    body: string;
    waMessageId: string;
  }): Promise<void> {
    await this.rls.asSystem(async (client) => {
      const { rows: contactRows } = await client.query(
        `select tenant_id from public.contacts where phone_number = $1`,
        [normalizePhone(msg.waFrom)],
      );
      const tenantId = contactRows[0]?.tenant_id ?? null;

      await client.query(
        `insert into public.messages (tenant_id, direction, wa_from, wa_to, body, wa_message_id)
         values ($1, 'inbound', $2, $3, $4, $5)`,
        [tenantId, msg.waFrom, msg.waTo, msg.body, msg.waMessageId],
      );

      if (!tenantId) {
        this.logger.warn(
          `Mensaje entrante de ${msg.waFrom} sin tenant asociado (no hay match en contacts)`,
        );
      }
    });
  }
}
