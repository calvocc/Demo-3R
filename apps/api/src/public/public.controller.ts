import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { PropertiesService } from "../properties/properties.service";
import { PublicService } from "./public.service";

/**
 * Endpoints SIN guards: cualquier visitante sin sesión puede llamarlos
 * (la página pública de propiedades de un tenant). No es un descuido —
 * es el punto. La protección real vive en RLS con el rol `anon` (ver
 * migración 0003_public_properties.sql y RlsQueryService.asAnon), así
 * que aunque este controlador no valide nada, la base de datos sí:
 * solo se puede leer el nombre del tenant y sus propiedades con
 * status = 'activa'.
 */
@Controller("public")
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly propertiesService: PropertiesService,
  ) {}

  @Get("tenants/:tenantId")
  getTenant(@Param("tenantId", ParseUUIDPipe) tenantId: string) {
    return this.publicService.getTenant(tenantId);
  }

  @Get("tenants/:tenantId/properties")
  listProperties(@Param("tenantId", ParseUUIDPipe) tenantId: string) {
    return this.propertiesService.listPublic(tenantId);
  }
}
