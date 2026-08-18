import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { WhatsAppService } from "./whatsapp.service";

@Controller("webhooks/whatsapp")
export class WhatsAppController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  // Handshake de verificación de Meta al configurar el Callback URL.
  @Get()
  verify(@Query() query: Record<string, string>, @Res() res: Response) {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (this.whatsapp.verifyToken(mode, token)) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send("Verificación fallida");
  }

  // Recepción de mensajes reales. rawBody viene habilitado en main.ts
  // para poder validar la firma sobre los bytes exactos que envió Meta.
  @Post()
  @HttpCode(200)
  async receive(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("x-hub-signature-256") signature: string | undefined,
  ) {
    if (!this.whatsapp.verifySignature(req.rawBody, signature)) {
      throw new ForbiddenException("Firma inválida");
    }
    await this.whatsapp.handleIncoming(req.body);
    // Meta espera 200 rápido; procesamos de forma síncrona porque el
    // volumen de una demo es mínimo.
    return { received: true };
  }
}
