/**
 * Meta solo permite enviar mensajes a números explícitamente
 * verificados como destinatarios de prueba (WhatsApp → API Setup →
 * To, en el dashboard de Meta for Developers) — así que en vez de un
 * input abierto, el CRM ofrece un selector fijo con los números ya
 * autorizados para esta demo.
 *
 * Formato E.164 con "+" (no la convención sin "+" de
 * lib/country-codes.ts / whatsapp.ts): SendMessageDto.to en el backend
 * valida con IsPhoneNumber, que exige el "+".
 */
export interface WhatsAppRecipient {
  name: string;
  phone: string;
}

export const WHATSAPP_TEST_RECIPIENTS: WhatsAppRecipient[] = [
  { name: "Jhonathan Calvo", phone: "+573214777790" },
  { name: "Lorena", phone: "+573188214190" },
];
