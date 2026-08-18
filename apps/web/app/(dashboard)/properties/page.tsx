"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { PropertyTable, Property } from "@/components/properties/property-table";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Propiedades</h1>
        {canWrite && (
          <Link href="/properties/new">
            <Button>Agregar propiedad</Button>
          </Link>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && (
        <PropertyTable
          properties={properties}
          canWrite={canWrite}
          onDelete={handleDelete}
          onSendWhatsApp={handleSendWhatsApp}
        />
      )}
    </div>
  );
}
