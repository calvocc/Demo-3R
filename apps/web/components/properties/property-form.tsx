"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PropertyFormValues {
  title: string;
  price: string;
  zone: string;
  type: "venta" | "alquiler";
  description: string;
}

interface Props {
  initialValues?: Partial<PropertyFormValues>;
  submitLabel: string;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
}

export function PropertyForm({ initialValues, submitLabel, onSubmit }: Props) {
  const [values, setValues] = useState<PropertyFormValues>({
    title: initialValues?.title ?? "",
    price: initialValues?.price ?? "",
    zone: initialValues?.zone ?? "",
    type: initialValues?.type ?? "venta",
    description: initialValues?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          required
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="price">Precio</Label>
        <Input
          id="price"
          type="number"
          min={0}
          required
          value={values.price}
          onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="zone">Zona</Label>
        <Input
          id="zone"
          value={values.zone}
          onChange={(e) => setValues((v) => ({ ...v, zone: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={values.type}
          onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as "venta" | "alquiler" }))}
        >
          <option value="venta">Venta</option>
          <option value="alquiler">Alquiler</option>
        </select>
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
