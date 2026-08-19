"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { InviteAgentForm } from "@/components/agents/invite-agent-form";
import { TeamList, TeamMember } from "@/components/agents/team-list";
import { PageHeader } from "@/components/ui/page-header";

export default function AgentsPage() {
  const { session, profile } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== "owner") router.replace("/properties");
  }, [profile, router]);

  async function load() {
    if (!session?.access_token) return;
    const data = await apiFetch<TeamMember[]>("/users", session.access_token);
    setMembers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  async function handleInvite(values: { email: string; fullName: string; role: "agente" | "cliente" }) {
    const result = await apiFetch<{ tempPassword: string }>("/users/invite", session!.access_token, {
      method: "POST",
      body: values,
    });
    await load();
    return result;
  }

  if (profile && profile.role !== "owner") return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agentes de tu inmobiliaria"
        description="Invita a tus brokers (rol agente) o da acceso de solo lectura a un cliente."
      />

      {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : <TeamList members={members} />}

      <div>
        <h2 className="mb-4 text-lg font-medium">Invitar a alguien nuevo</h2>
        <InviteAgentForm onInvite={handleInvite} />
      </div>
    </div>
  );
}
