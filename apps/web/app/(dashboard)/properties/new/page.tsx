"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { PropertyForm, PropertyFormValues } from "@/components/properties/property-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewPropertyPage() {
  const { session, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && profile.role === "cliente") router.replace("/properties");
  }, [profile, router]);

  async function handleSubmit(values: PropertyFormValues) {
    if (!session?.access_token) return;
    await apiFetch("/properties", session.access_token, {
      method: "POST",
      body: { ...values, price: Number(values.price) },
    });
    router.push("/properties");
  }

  return (
    <div>
      <PageHeader title="Agregar propiedad" description="Completa los datos para publicarla en tu inventario." />
      <PropertyForm submitLabel="Crear propiedad" onSubmit={handleSubmit} />
    </div>
  );
}
