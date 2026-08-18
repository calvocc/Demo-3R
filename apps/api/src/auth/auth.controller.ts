import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../common/guards/supabase-auth.guard";
import { ProfileGuard } from "../common/guards/profile.guard";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { CurrentProfile } from "../common/decorators/current-profile.decorator";
import { RequestProfile } from "../common/guards/profile.guard";
import { AuthService } from "./auth.service";
import { RegisterTenantDto } from "./dto/register-tenant.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * El frontend llama a esto justo después de iniciar sesión con
   * Supabase Auth para saber si el usuario ya tiene inmobiliaria
   * (profile) y qué rol/tenant le corresponde.
   */
  @UseGuards(SupabaseAuthGuard, ProfileGuard)
  @Get("me")
  me(@CurrentUser() user: RequestUser, @CurrentProfile() profile: RequestProfile | null) {
    return { user, profile };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post("register-tenant")
  registerTenant(@CurrentUser() user: RequestUser, @Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(user.id, dto.tenantName);
  }
}
