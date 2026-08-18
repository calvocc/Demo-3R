import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Array<"owner" | "agente" | "cliente">) =>
  SetMetadata(ROLES_KEY, roles);
