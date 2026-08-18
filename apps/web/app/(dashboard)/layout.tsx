"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppNav } from "@/components/nav/app-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace("/login");
    else if (!profile) router.replace("/register");
  }, [loading, session, profile, router]);

  if (loading || !session || !profile) {
    return <p className="p-6 text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
