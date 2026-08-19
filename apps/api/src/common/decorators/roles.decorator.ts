import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Array<"owner" | "agente" | "broker" | "cliente">) =>
  SetMetadata(ROLES_KEY, roles);
