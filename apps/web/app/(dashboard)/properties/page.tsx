"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { PropertyList, Property } from "@/components/properties/property-list";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { IconExternalLink, IconPlus } from "@/components/ui/icons";

export default function PropertiesPage() {
  const { session, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canWrite = profile?.role === "owner" || profile?.role === "agente";
  const accessToken = session?.access_token;

  async function load() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<Property[]>("/properties", accessToken);
      setProperties(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleDelete(id: string) {
    if (!accessToken || !confirm("¿Eliminar esta propiedad?")) return;
    await apiFetch(`/properties/${id}`, accessToken, { method: "DELETE" });
    load();
  }

  async function handleSendWhatsApp(id: string) {
    if (!accessToken) return;
    const to = prompt("Número de WhatsApp del cliente (formato internacional, ej. +573001234567):");
    if (!to) return;
    try {
      await apiFetch("/messages/send", accessToken, { method: "POST", body: { to, propertyId: id } });
      alert("Mensaje enviado ✅ (revisa /messages)");
    } catch (err) {
      alert(`No se pudo enviar: ${(err as Error).message}`);
    }
  }

  return (
    <div>
      <PageHeader
        title="Propiedades"
        description={`${properties.length} propiedad${properties.length === 1 ? "" : "es"} en tu inventario`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {profile?.tenantId && (
              <Link href={`/inmobiliaria/${profile.tenantId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <IconExternalLink className="h-4 w-4" />
                  Ver página pública
                </Button>
              </Link>
            )}
            {canWrite && (
              <Link href="/properties/new">
                <Button>
                  <IconPlus className="h-4 w-4" />
                  Agregar propiedad
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && (
        <PropertyList
          properties={properties}
          canWrite={canWrite}
          onDelete={handleDelete}
          onSendWhatsApp={handleSendWhatsApp}
        />
      )}
    </div>
  );
}
