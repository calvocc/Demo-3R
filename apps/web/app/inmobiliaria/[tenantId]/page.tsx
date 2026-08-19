"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBuilding, IconSearch } from "@/components/ui/icons";
import { PublicPropertyCard, PublicProperty } from "@/components/public/public-property-card";

interface PublicTenant {
  id: string;
  name: string;
}

type TypeFilter = "todas" | "venta" | "alquiler";

export default function PublicPropertiesPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<PublicTenant | null>(null);
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todas");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch<PublicTenant>(`/public/tenants/${tenantId}`, undefined),
      apiFetch<PublicProperty[]>(`/public/tenants/${tenantId}/properties`, undefined),
    ])
      .then(([t, props]) => {
        setTenant(t);
        setProperties(props);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : (err as Error).message);
      })
      .finally(() => setLoading(false));
  }, [tenantId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesType = typeFilter === "todas" || p.type === typeFilter;
      const matchesSearch =
        q === "" || p.title.toLowerCase().includes(q) || (p.zone ?? "").toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [properties, typeFilter, search]);

  const counts = useMemo(
    () => ({
      venta: properties.filter((p) => p.type === "venta").length,
      alquiler: properties.filter((p) => p.type === "alquiler").length,
    }),
    [properties],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden bg-sidebar px-4 pb-20 pt-14 text-sidebar-foreground sm:px-6 sm:pt-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 35%), radial-gradient(circle at 85% 60%, white 0, transparent 30%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            {tenant?.name ? tenant.name.slice(0, 1).toUpperCase() : "3R"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {loading ? "Cargando…" : (tenant?.name ?? "Inmobiliaria")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-sidebar-foreground/70 sm:text-base">
            Explora nuestras propiedades disponibles en venta y alquiler. Sin registro, sin
            complicaciones.
          </p>
          {!loading && !error && properties.length > 0 && (
            <div className="mt-6 flex justify-center gap-6 text-sm text-sidebar-foreground/80">
              <span>
                <strong className="text-sidebar-foreground">{counts.venta}</strong> en venta
              </span>
              <span className="text-sidebar-foreground/30">·</span>
              <span>
                <strong className="text-sidebar-foreground">{counts.alquiler}</strong> en alquiler
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Filtros */}
      <div className="mx-auto -mt-10 max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-popover sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o zona…"
              className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            {(
              [
                { value: "todas", label: "Todas" },
                { value: "venta", label: "Venta" },
                { value: "alquiler", label: "Alquiler" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === opt.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listado */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {loading && <p className="text-center text-sm text-muted-foreground">Cargando propiedades…</p>}

        {!loading && error && (
          <EmptyState
            icon={<IconBuilding className="h-6 w-6" />}
            title="No pudimos cargar esta página"
            description={error}
          />
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<IconBuilding className="h-6 w-6" />}
            title={properties.length === 0 ? "Todavía no hay propiedades publicadas" : "Sin resultados"}
            description={
              properties.length === 0
                ? "Vuelve pronto para ver las propiedades disponibles."
                : "Prueba con otra búsqueda o quita los filtros."
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PublicPropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        Página pública generada con 3R Connect CRM
      </footer>
    </div>
  );
}
