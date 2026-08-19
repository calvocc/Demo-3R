"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBuilding, IconChevronDown, IconMapPin, IconMessage } from "@/components/ui/icons";
import { buildWhatsAppContactUrl, PLATFORM_WHATSAPP_NUMBER } from "@/lib/whatsapp";

export interface PublicProperty {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  zone: string | null;
  type: "venta" | "alquiler";
  created_at: string;
  // Solo viene poblado en el listado "marketplace" (/inmobiliaria, sin
  // tenantId) — en la página de una sola inmobiliaria ya se sabe cuál es.
  tenant_name?: string;
}

const typeMeta: Record<PublicProperty["type"], { label: string; variant: "primary" | "success" }> = {
  venta: { label: "Venta", variant: "primary" },
  alquiler: { label: "Alquiler", variant: "success" },
};

function formatPrice(price: string | number) {
  return `$${Number(price).toLocaleString("es-CO")}`;
}

export function PublicPropertyCard({ property }: { property: PublicProperty }) {
  const [expanded, setExpanded] = useState(false);
  const type = typeMeta[property.type];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-popover">
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-secondary text-primary/50">
        <IconBuilding className="h-12 w-12" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={type.variant}>{type.label}</Badge>
          <p className="text-lg font-semibold">{formatPrice(property.price)}</p>
        </div>
        <h3 className="text-base font-semibold leading-snug">{property.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <IconMapPin className="h-3.5 w-3.5 shrink-0" />
          {property.zone ?? "Zona no especificada"}
        </p>
        {property.tenant_name && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconBuilding className="h-3.5 w-3.5 shrink-0" />
            {property.tenant_name}
          </p>
        )}

        {property.description && (
          <div className="mt-1">
            <p className={expanded ? "text-sm text-foreground/80" : "line-clamp-2 text-sm text-foreground/80"}>
              {property.description}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? "Ver menos" : "Ver más"}
              <IconChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {/* mt-auto: empuja el botón al fondo de la tarjeta sin importar
            cuánto texto tenga arriba (título/descripción de largo
            variable), para que quede alineado entre tarjetas de la
            misma fila. Requiere que el contenedor padre sea flex-col
            (ya lo es) — el article se estira a la altura de la fila
            porque los ítems de grid se estiran por defecto. */}
        {PLATFORM_WHATSAPP_NUMBER && (
          <a
            href={buildWhatsAppContactUrl(property)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto pt-3"
          >
            <Button variant="success" className="w-full">
              <IconMessage className="h-4 w-4" />
              Contactar por WhatsApp
            </Button>
          </a>
        )}
      </div>
    </article>
  );
}
