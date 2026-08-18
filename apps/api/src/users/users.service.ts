import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { RlsQueryService } from "../common/db/rls-query.service";
import { SupabaseService } from "../common/supabase/supabase.service";
import { RequestProfile } from "../common/guards/profile.guard";
import { generateTempPassword } from "../common/utils/temp-password";
import { InviteUserDto } from "./dto/invite-user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly rls: RlsQueryService,
    private readonly supabase: SupabaseService,
  ) {}

  async listByTenant(userId: string, profile: RequestProfile | null) {
    if (!profile) {
      throw new ForbiddenException("No perteneces a ninguna inmobiliaria todavía");
    }
    return this.rls.withUserContext(userId, async (client) => {
      const { rows } = await client.query(
        `select id, full_name, email, role, created_at
         from public.profiles
         where tenant_id = $1
         order by created_at asc`,
        [profile.tenantId],
      );
      return rows;
    });
  }

  /**
   * Invitar a un agente/cliente nuevo. Dos pasos:
   *  1) Crear el auth.users vía Admin API — el único caso en todo el
   *     backend donde es inevitable llamar directo a la API de
   *     Supabase para una operación de negocio, porque solo Supabase
   *     puede crear un usuario de Auth nuevo.
   *  2) Insertar su `profile` (tenant_id + role) por NUESTRA conexión
   *     directa a Postgres, con el contexto del owner que invita —
   *     la policy `profiles_insert_by_owner` es la que autoriza esto.
   */
  async inviteAgent(ownerUserId: string, profile: RequestProfile | null, dto: InviteUserDto) {
    if (!profile) {
      throw new ForbiddenException("No perteneces a ninguna inmobiliaria todavía");
    }

    const tempPassword = generateTempPassword();
    const { data, error } = await this.supabase.adminClient.auth.admin.createUser({
      email: dto.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: dto.fullName },
    });

    if (error || !data.user) {
      throw new ConflictException(error?.message ?? "No se pudo crear el usuario");
    }

    await this.rls.withUserContext(ownerUserId, async (client) => {
      await client.query(
        `insert into public.profiles (id, tenant_id, role, full_name, email)
         values ($1, $2, $3, $4, $5)`,
        [data.user!.id, profile.tenantId, dto.role, dto.fullName, dto.email],
      );
    });

    return {
      id: data.user.id,
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      tempPassword,
    };
  }
}
