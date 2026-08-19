"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";
import {
  IconBuilding,
  IconMessage,
  IconUsers,
  IconLogout,
  IconMenu,
  IconClose,
} from "@/components/ui/icons";

const roleLabels: Record<string, string> = {
  owner: "Cuenta de la inmobiliaria",
  agente: "Agente",
  broker: "Broker",
  cliente: "Cliente",
};

/**
 * Nombre a mostrar en el sidebar: el owner ES la cuenta de la
 * inmobiliaria (se crea sin datos de una persona — ver register_tenant
 * en 0002_rls_policies.sql), así que mostramos el nombre de la
 * inmobiliaria; agente/broker son personas, así que mostramos su
 * nombre. Si por lo que sea todavía no cargó, cae al label del rol.
 */
function displayName(profile: { role: string; fullName: string | null; tenantName: string | null }): string {
  if (profile.role === "owner") return profile.tenantName ?? roleLabels.owner;
  return profile.fullName ?? roleLabels[profile.role] ?? profile.role;
}

function useNavLinks() {
  const { profile } = useAuth();
  return [
    { href: "/properties", label: "Propiedades", icon: IconBuilding, show: true },
    { href: "/messages", label: "Mensajes", icon: IconMessage, show: profile?.role !== "cliente" },
    { href: "/agents", label: "Agentes", icon: IconUsers, show: profile?.role === "owner" },
  ].filter((l) => l.show);
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        3R
      </div>
      <span className="text-sm font-semibold text-sidebar-foreground">3R Connect CRM</span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const links = useNavLinks();
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileFooter() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  if (!profile) return null;

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const name = displayName(profile);
  return (
    <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 p-2">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-sidebar-foreground">{name}</p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">{roleLabels[profile.role] ?? profile.role}</p>
      </div>
      <button
        onClick={handleSignOut}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white"
      >
        <IconLogout className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

/** Sidebar fija para escritorio (≥ md). */
export function Sidebar() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-sidebar p-4 md:flex">
      <Brand />
      <NavLinks />
      <ProfileFooter />
    </aside>
  );
}

/** Topbar + drawer deslizable para móvil (< md). */
export function MobileTopbar() {
  const { profile } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("drawer-open", open);
    return () => document.documentElement.classList.remove("drawer-open");
  }, [open]);

  if (!profile) return null;

  return (
    <div className="md:hidden">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <IconMenu />
        </button>
        <Brand />
        <Avatar name={displayName(profile)} size="sm" />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-72 max-w-[80vw] animate-slide-in flex-col gap-6 bg-sidebar p-4 shadow-popover">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <IconClose />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <ProfileFooter />
          </div>
        </div>
      )}
    </div>
  );
}
