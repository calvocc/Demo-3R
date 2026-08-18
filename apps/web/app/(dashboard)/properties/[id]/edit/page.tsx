"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { PropertyForm, PropertyFormValues } from "@/components/properties/property-form";
import { Property } from "@/components/properties/property-table";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { session, profile } = useAuth();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.role === "cliente") router.replace("/properties");
  }, [profile, router]);

  useEffect(() => {
    if (!session?.access_token) return;
    apiFetch<Property>(`/properties/${id}`, session.access_token)
      .then(setProperty)
      .catch((err) => setError(err.message));
  }, [id, session?.access_token]);

  async function handleSubmit(values: PropertyFormValues) {
    if (!session?.access_token) return;
    await apiFetch(`/properties/${id}`, session.access_token, {
      method: "PUT",
      body: { ...values, price: Number(values.price) },
    });
    router.push("/properties");
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!property) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar propiedad</h1>
      <PropertyForm
        submitLabel="Guardar cambios"
        initialValues={{
          title: property.title,
          price: String(property.price),
          zone: property.zone ?? "",
          type: property.type,
          description: property.description ?? "",
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
