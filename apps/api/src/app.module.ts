import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DbModule } from "./common/db/db.module";
import { SupabaseModule } from "./common/supabase/supabase.module";
import { WhatsAppClientModule } from "./common/whatsapp/whatsapp-client.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PropertiesModule } from "./properties/properties.module";
import { MessagesModule } from "./messages/messages.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { PublicModule } from "./public/public.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    SupabaseModule,
    WhatsAppClientModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    MessagesModule,
    WebhooksModule,
    PublicModule,
  ],
})
export class AppModule {}
