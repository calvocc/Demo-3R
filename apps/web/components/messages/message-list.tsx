import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconArrowDownLeft, IconArrowUpRight, IconInbox } from "@/components/ui/icons";

export interface Message {
  id: string;
  direction: "inbound" | "outbound";
  wa_from: string;
  wa_to: string;
  body: string | null;
  created_at: string;
}

export function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<IconInbox className="h-6 w-6" />}
        title="Todavía no hay mensajes"
        description="Los mensajes de WhatsApp entrantes y salientes aparecerán aquí."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {messages.map((m, i) => {
        const inbound = m.direction === "inbound";
        return (
          <div
            key={m.id}
            className={
              "flex items-start gap-3 px-4 py-3" + (i !== 0 ? " border-t border-border" : "")
            }
          >
            <div
              className={
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full " +
                (inbound ? "bg-success-subtle text-success" : "bg-accent text-accent-foreground")
              }
            >
              {inbound ? <IconArrowDownLeft className="h-4 w-4" /> : <IconArrowUpRight className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={inbound ? "success" : "primary"} className="shrink-0">
                  {inbound ? "Entrante" : "Saliente"}
                </Badge>
                <p className="truncate text-xs text-muted-foreground">
                  {m.wa_from} → {m.wa_to}
                </p>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm">{m.body}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {new Date(m.created_at).toLocaleString("es-CO")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
