"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="max-w-2xl">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
              <Select
                id="type"
                value={values.type}
                onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as "venta" | "alquiler" }))}
              >
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              rows={4}
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Guardando…" : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
