import { Global, Module } from "@nestjs/common";
import { WhatsAppClientService } from "./whatsapp-client.service";

@Global()
@Module({
  providers: [WhatsAppClientService],
  exports: [WhatsAppClientService],
})
export class WhatsAppClientModule {}
