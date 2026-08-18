import { randomBytes } from "node:crypto";

/**
 * Genera una contraseña temporal para un agente/cliente recién
 * invitado. Se le muestra una sola vez al owner en la UI para que la
 * comparta manualmente — suficiente para una demo sin SMTP
 * configurado en el proyecto de Supabase.
 */
export function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}
