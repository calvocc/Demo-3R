"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  agente: "Agente",
  cliente: "Cliente",
};

export function AppNav() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!profile) return null;

  const links = [
    { href: "/properties", label: "Propiedades", show: true },
    { href: "/messages", label: "Mensajes (WhatsApp)", show: profile.role !== "cliente" },
    { href: "/agents", label: "Agentes", show: profile.role === "owner" },
  ].filter((l) => l.show);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <nav className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold">3R Connect CRM</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "text-sm",
              pathname?.startsWith(link.href) ? "font-medium text-primary" : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Badge>{roleLabels[profile.role] ?? profile.role}</Badge>
        <Button variant="outline" onClick={handleSignOut}>
          Salir
        </Button>
      </div>
    </nav>
  );
}
