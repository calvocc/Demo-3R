import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../common/guards/supabase-auth.guard";
import { ProfileGuard, RequestProfile } from "../common/guards/profile.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { CurrentProfile } from "../common/decorators/current-profile.decorator";
import { MessagesService } from "./messages.service";
import { SendMessageDto } from "./dto/send-message.dto";

// El rol `cliente` no tiene ningún policy de RLS sobre `messages` (ver
// 0002_rls_policies.sql) — @Roles aquí es solo para devolver un 403
// claro en vez de dejar que la consulta simplemente vuelva vacía.
@Controller("messages")
@UseGuards(SupabaseAuthGuard, ProfileGuard, RolesGuard)
@Roles("owner", "agente", "broker")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.messagesService.list(user.id);
  }

  @Post("send")
  send(
    @CurrentUser() user: RequestUser,
    @CurrentProfile() profile: RequestProfile,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(user.id, profile.tenantId, dto);
  }
}
