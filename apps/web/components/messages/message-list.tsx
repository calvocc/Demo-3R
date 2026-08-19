import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconArrowDownLeft, IconArrowUpRight, IconBuilding, IconInbox } from "@/components/ui/icons";

export interface Message {
  id: string;
  direction: "inbound" | "outbound";
  wa_from: string;
  wa_to: string;
  body: string | null;
  created_at: string;
  related_property_id: string | null;
  property_title: string | null;
  wa_contact_name: string | null;
}

interface Conversation {
  key: string;
  phone: string;
  clientName: string;
  propertyTitle: string | null;
  messages: Message[];
  lastActivity: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Agrupa el log plano de mensajes en una conversación por cliente —
 * ver todos los mensajes de todos los clientes uno tras otro (como
 * antes) era confuso porque mezclaba distintas propiedades y personas
 * en una sola lista. El "cliente" de una fila es el número que NO es
 * el nuestro: `wa_to` si el mensaje es saliente, `wa_from` si es
 * entrante. La agrupación es por número normalizado (sin "+"/espacios)
 * porque un mensaje saliente lo guarda con "+" y uno entrante sin él.
 */
function groupByClient(messages: Message[]): Conversation[] {
  const groups = new Map<string, Conversation>();

  for (const m of messages) {
    const rawPhone = m.direction === "outbound" ? m.wa_to : m.wa_from;
    const key = normalizePhone(rawPhone);

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        phone: rawPhone,
        clientName: rawPhone,
        propertyTitle: null,
        messages: [],
        lastActivity: m.created_at,
      };
      groups.set(key, group);
    }

    group.messages.push(m);
    group.lastActivity = m.created_at; // los mensajes llegan en orden asc, así que el último gana
    if (m.wa_contact_name) group.clientName = m.wa_contact_name;
    if (m.property_title) group.propertyTitle = m.property_title;
  }

  // Conversación con actividad más reciente primero.
  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
  );
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

  const conversations = groupByClient(messages);

  return (
    <div className="space-y-4">
      {conversations.map((conv) => (
        <div key={conv.key} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{conv.clientName}</p>
              {conv.clientName !== conv.phone && (
                <p className="truncate text-xs text-muted-foreground">{conv.phone}</p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              <IconBuilding className="h-3 w-3" />
              {conv.propertyTitle ?? "Sin propiedad asociada"}
            </Badge>
          </div>

          {conv.messages.map((m, i) => {
            const inbound = m.direction === "inbound";
            return (
              <div
                key={m.id}
                className={"flex items-start gap-3 px-4 py-3" + (i !== 0 ? " border-t border-border" : "")}
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
                  <Badge variant={inbound ? "success" : "primary"}>
                    {inbound ? "Entrante" : "Saliente"}
                  </Badge>
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm">{m.body}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("es-CO")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
