/**
 * Número de WhatsApp de la plataforma — el mismo bot compartido que
 * recibe los mensajes de todas las inmobiliarias (ver
 * apps/api WHATSAPP_PHONE_NUMBER_ID). Formato internacional, solo
 * dígitos (sin "+", espacios ni guiones), como lo pide wa.me.
 *
 * TODO: reemplazar por el número real del bot antes de usar el botón
 * "Contactar" en producción — con este placeholder wa.me no abre un
 * chat válido.
 */
export const PLATFORM_WHATSAPP_NUMBER = "";

interface ContactableProperty {
  title: string;
  type: "venta" | "alquiler";
  price: string | number;
  zone: string | null;
  tenant_name?: string;
}

/** Arma el link wa.me con un mensaje pre-llenado preguntando por la propiedad. */
export function buildWhatsAppContactUrl(property: ContactableProperty): string {
  const price = Number(property.price).toLocaleString("es-CO");
  const lines = [
    "Hola, quiero más información sobre esta propiedad:",
    "",
    property.title,
    `${property.type === "venta" ? "En venta" : "En alquiler"} — $${price}`,
    `Zona: ${property.zone ?? "N/D"}`,
  ];
  if (property.tenant_name) lines.push(`Inmobiliaria: ${property.tenant_name}`);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${PLATFORM_WHATSAPP_NUMBER}?text=${text}`;
}
