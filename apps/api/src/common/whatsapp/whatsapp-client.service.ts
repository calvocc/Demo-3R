import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Cliente delgado sobre la Meta Cloud API (WhatsApp Business
 * Platform). Un único número de WhatsApp sirve a todas las
 * inmobiliarias — quién es el dueño de la conversación se resuelve
 * en `contacts`, no aquí.
 */
@Injectable()
export class WhatsAppClientService {
  private readonly logger = new Logger(WhatsAppClientService.name);

  constructor(private readonly config: ConfigService) {}

  private get sendUrl(): string {
    const version = this.config.get<string>("WHATSAPP_GRAPH_API_VERSION", "v21.0");
    const phoneNumberId = this.config.getOrThrow<string>("WHATSAPP_PHONE_NUMBER_ID");
    return `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  }

  async sendText(to: string, body: string): Promise<{ waMessageId: string | null }> {
    const token = this.config.getOrThrow<string>("WHATSAPP_ACCESS_TOKEN");

    const res = await fetch(this.sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`Meta Graph API respondió ${res.status}: ${JSON.stringify(data)}`);
      throw new Error(data?.error?.message ?? "No se pudo enviar el mensaje de WhatsApp");
    }

    return { waMessageId: data?.messages?.[0]?.id ?? null };
  }
}
