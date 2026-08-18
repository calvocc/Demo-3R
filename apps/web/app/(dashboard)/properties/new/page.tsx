"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { PropertyForm, PropertyFormValues } from "@/components/properties/property-form";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Agregar propiedad</h1>
      <PropertyForm submitLabel="Crear propiedad" onSubmit={handleSubmit} />
    </div>
  );
}
