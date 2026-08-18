import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";

/**
 * Valida el JWT de la request contra Supabase Auth (round-trip a
 * `auth.getUser()`) en vez de verificar la firma localmente — así no
 * importa si el proyecto firma con el secreto compartido (HS256) o
 * con claves asimétricas (JWKS): funciona igual en ambos casos.
 *
 * Esto es identidad, no acceso a datos: adjunta `req.userId` /
 * `req.userEmail` y nada más. El tenant/rol se resuelve después, en
 * ProfileGuard, contra nuestra propia base de datos.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers["authorization"];
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException(
        "Falta el header Authorization: Bearer <token>",
      );
    }

    const { data, error } = await this.supabase.authClient.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException("Token inválido o expirado");
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    return true;
  }
}
