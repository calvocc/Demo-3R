"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function PropertyTable({ properties, canWrite, onDelete, onSendWhatsApp }: Props) {
  if (properties.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay propiedades todavía.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Zona</TableHead>
          <TableHead>Estado</TableHead>
          {canWrite && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.title}</TableCell>
            <TableCell>
              <Badge>{p.type === "venta" ? "Venta" : "Alquiler"}</Badge>
            </TableCell>
            <TableCell>${Number(p.price).toLocaleString("es-CO")}</TableCell>
            <TableCell>{p.zone ?? "—"}</TableCell>
            <TableCell>{p.status}</TableCell>
            {canWrite && (
              <TableCell className="space-x-2 text-right">
                <Button variant="outline" onClick={() => onSendWhatsApp(p.id)}>
                  Enviar por WhatsApp
                </Button>
                <Link href={`/properties/${p.id}/edit`}>
                  <Button variant="outline">Editar</Button>
                </Link>
                <Button variant="destructive" onClick={() => onDelete(p.id)}>
                  Eliminar
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
