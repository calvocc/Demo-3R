"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace("/login");
    else if (!profile) router.replace("/register");
    else router.replace("/properties");
  }, [loading, session, profile, router]);

  return <p className="p-6 text-sm text-muted-foreground">Cargando…</p>;
}
