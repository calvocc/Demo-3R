/**
 * Normaliza un número de teléfono a solo dígitos para poder comparar
 * de forma consistente el número que un agente escribe en formato
 * E.164 ("+573001234567") contra el que manda Meta en el payload del
 * webhook (sin "+", ej. "573001234567") — sin esto, la tabla
 * `contacts` nunca hace match y todo mensaje entrante queda "sin
 * tenant asignado".
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
