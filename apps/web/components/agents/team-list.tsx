import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconUsers } from "@/components/ui/icons";

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "owner" | "agente" | "cliente";
  created_at: string;
}

const roleMeta: Record<TeamMember["role"], { label: string; variant: "primary" | "success" | "outline" }> = {
  owner: { label: "Owner", variant: "primary" },
  agente: { label: "Agente", variant: "success" },
  cliente: { label: "Cliente", variant: "outline" },
};

export function TeamList({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={<IconUsers className="h-6 w-6" />}
        title="Todavía no hay nadie en tu equipo"
        description="Invita a un agente o cliente con el formulario de abajo."
      />
    );
  }

  return (
    <>
      {/* Móvil: grilla de tarjetas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
        {members.map((m) => {
          const role = roleMeta[m.role] ?? { label: m.role, variant: "outline" as const };
          return (
            <div
              key={m.id}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-card"
            >
              <Avatar name={m.full_name ?? m.email} size="md" />
              <p className="line-clamp-1 w-full text-sm font-medium">{m.full_name ?? "Sin nombre"}</p>
              <p className="line-clamp-1 w-full text-xs text-muted-foreground">{m.email}</p>
              <Badge variant={role.variant} className="text-[10px]">
                {role.label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Escritorio/tablet: lista */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-card md:block">
        {members.map((m, i) => {
          const role = roleMeta[m.role] ?? { label: m.role, variant: "outline" as const };
          return (
            <div
              key={m.id}
              className={
                "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/50" +
                (i !== 0 ? " border-t border-border" : "")
              }
            >
              <Avatar name={m.full_name ?? m.email} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.full_name ?? "Sin nombre"}</p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              <Badge variant={role.variant} className="shrink-0">
                {role.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </>
  );
}
