import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../common/guards/supabase-auth.guard";
import { ProfileGuard, RequestProfile } from "../common/guards/profile.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { CurrentProfile } from "../common/decorators/current-profile.decorator";
import { UsersService } from "./users.service";
import { InviteUserDto } from "./dto/invite-user.dto";

@Controller("users")
@UseGuards(SupabaseAuthGuard, ProfileGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @CurrentProfile() profile: RequestProfile | null) {
    return this.usersService.listByTenant(user.id, profile);
  }

  @UseGuards(RolesGuard)
  @Roles("owner")
  @Post("invite")
  invite(
    @CurrentUser() user: RequestUser,
    @CurrentProfile() profile: RequestProfile | null,
    @Body() dto: InviteUserDto,
  ) {
    return this.usersService.inviteAgent(user.id, profile, dto);
  }
}
