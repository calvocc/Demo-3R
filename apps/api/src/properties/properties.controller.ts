import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../common/guards/supabase-auth.guard";
import { ProfileGuard, RequestProfile } from "../common/guards/profile.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { CurrentProfile } from "../common/decorators/current-profile.decorator";
import { PropertiesService } from "./properties.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

@Controller("properties")
@UseGuards(SupabaseAuthGuard, ProfileGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // Lectura: disponible para owner, agente y cliente (RLS ya limita
  // al tenant correspondiente; el rol no restringe SELECT).
  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.propertiesService.list(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.propertiesService.findOne(user.id, id);
  }

  // Escritura: solo owner/agente. Este @Roles es defensa en profundidad
  // para dar un 403 claro — la barrera real es la policy de RLS en
  // `properties`, que rechazaría igual el INSERT/UPDATE/DELETE.
  @UseGuards(RolesGuard)
  @Roles("owner", "agente")
  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @CurrentProfile() profile: RequestProfile,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user.id, profile.tenantId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles("owner", "agente")
  @Put(":id")
  update(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user.id, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles("owner", "agente")
  @Delete(":id")
  remove(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.propertiesService.remove(user.id, id);
  }
}
