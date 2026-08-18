import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Gate de conveniencia a nivel de API (mejor UX: 403 con mensaje claro
 * en vez de una lista vacía). La barrera REAL para lectura/escritura
 * de datos sigue siendo RLS en Postgres — este guard no reemplaza
 * eso, solo evita round-trips innecesarios a la base de datos para
 * acciones que ya sabemos que van a fallar.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    if (!req.profile) {
      throw new ForbiddenException("No perteneces a ninguna inmobiliaria todavía");
    }
    if (!required.includes(req.profile.role)) {
      throw new ForbiddenException("No tienes permisos para esta acción");
    }
    return true;
  }
}
