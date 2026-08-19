"use client";

import Link from "next/link";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBuilding, IconMapPin, IconMessage, IconPencil, IconTrash } from "@/components/ui/icons";

export interface Property {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  zone: string | null;
  type: "venta" | "alquiler";
  status: string;
}

interface Props {
  properties: Property[];
  canWrite: boolean;
  onDelete: (id: string) => void;
  onSendWhatsApp: (id: string) => void;
}

const typeMeta: Record<Property["type"], { label: string; variant: "primary" | "success" }> = {
  venta: { label: "Venta", variant: "primary" },
  alquiler: { label: "Alquiler", variant: "success" },
};

const statusMeta: Record<string, { label: string; variant: "success" | "warning" | "outline" | "primary" }> = {
  activa: { label: "Activa", variant: "success" },
  pausada: { label: "Pausada", variant: "warning" },
  vendida: { label: "Vendida", variant: "outline" },
  alquilada: { label: "Alquilada", variant: "primary" },
};

function formatPrice(price: string | number) {
  return `$${Number(price).toLocaleString("es-CO")}`;
}

export function PropertyList({ properties, canWrite, onDelete, onSendWhatsApp }: Props) {
  if (properties.length === 0) {
    return (
      <EmptyState
        icon={<IconBuilding className="h-6 w-6" />}
        title="No hay propiedades todavía"
        description="Las propiedades que agregues aparecerán aquí."
      />
    );
  }

  return (
    <>
      {/* Móvil: grilla de tarjetas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
        {properties.map((p) => {
          const type = typeMeta[p.type];
          const status = statusMeta[p.status] ?? { label: p.status, variant: "outline" as const };
          return (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="flex h-16 items-center justify-center bg-gradient-to-br from-accent to-secondary text-primary/60">
                <IconBuilding className="h-6 w-6" />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant={type.variant} className="px-1.5 py-0 text-[10px]">
                    {type.label}
                  </Badge>
                  <Badge variant={status.variant} className="px-1.5 py-0 text-[10px]">
                    {status.label}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm font-medium leading-snug">{p.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconMapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{p.zone ?? "Sin zona"}</span>
                </p>
                <p className="mt-auto pt-1 text-sm font-semibold">{formatPrice(p.price)}</p>
                {canWrite && (
                  <div className="flex items-center gap-1 pt-1.5">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      title="Enviar por WhatsApp"
                      onClick={() => onSendWhatsApp(p.id)}
                    >
                      <IconMessage className="h-3.5 w-3.5" />
                    </Button>
                    <Link href={`/properties/${p.id}/edit`}>
                      <Button size="icon" variant="outline" className="h-7 w-7" title="Editar">
                        <IconPencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      title="Eliminar"
                      onClick={() => onDelete(p.id)}
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Escritorio/tablet: lista */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-card md:block">
        {properties.map((p, i) => {
          const type = typeMeta[p.type];
          const status = statusMeta[p.status] ?? { label: p.status, variant: "outline" as const };
          return (
            <div
              key={p.id}
              className={clsx(
                "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/50",
                i !== 0 && "border-t border-border",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <IconBuilding className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconMapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{p.zone ?? "Sin zona"}</span>
                </p>
              </div>
              <Badge variant={type.variant} className="shrink-0">
                {type.label}
              </Badge>
              <Badge variant={status.variant} className="shrink-0">
                {status.label}
              </Badge>
              <p className="w-28 shrink-0 text-right text-sm font-semibold">{formatPrice(p.price)}</p>
              {canWrite && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Enviar por WhatsApp"
                    onClick={() => onSendWhatsApp(p.id)}
                  >
                    <IconMessage className="h-4 w-4" />
                  </Button>
                  <Link href={`/properties/${p.id}/edit`}>
                    <Button size="icon" variant="ghost" title="Editar">
                      <IconPencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    title="Eliminar"
                    onClick={() => onDelete(p.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
