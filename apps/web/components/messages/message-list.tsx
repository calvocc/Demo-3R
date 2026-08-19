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
 * Agrupa el log plano de mensajes en conversaciones por (cliente,
 * propiedad) — no solo por cliente. El mismo número puede escribir
 * sobre dos propiedades distintas, y eso debe verse como dos hilos
 * separados, no uno solo donde la propiedad más reciente pisa a la
 * anterior.
 *
 * El truco: solo los mensajes SALIENTES traen `related_property_id`
 * (Meta no manda eso en el entrante, así que una respuesta del
 * cliente nunca lo trae). Por eso cada respuesta "hereda" la última
 * propiedad que un agente le envió a ESE número antes de esa
 * respuesta — se recorre en orden cronológico manteniendo, por
 * cliente, cuál es la propiedad "activa" en cada momento.
 */
function groupConversations(messages: Message[]): Conversation[] {
  const activePropertyByClient = new Map<string, { id: string; title: string | null }>();

  const tagged = messages.map((m) => {
    const rawPhone = m.direction === "outbound" ? m.wa_to : m.wa_from;
    const clientKey = normalizePhone(rawPhone);

    if (m.direction === "outbound" && m.related_property_id) {
      activePropertyByClient.set(clientKey, { id: m.related_property_id, title: m.property_title });
    }
    const active = activePropertyByClient.get(clientKey);

    return {
      message: m,
      rawPhone,
      groupKey: `${clientKey}::${active?.id ?? "none"}`,
      propertyTitle: active?.title ?? null,
    };
  });

  const groups = new Map<string, Conversation>();
  for (const t of tagged) {
    let group = groups.get(t.groupKey);
    if (!group) {
      group = {
        key: t.groupKey,
        phone: t.rawPhone,
        clientName: t.rawPhone,
        propertyTitle: t.propertyTitle,
        messages: [],
        lastActivity: t.message.created_at,
      };
      groups.set(t.groupKey, group);
    }
    group.messages.push(t.message);
    group.lastActivity = t.message.created_at; // los mensajes llegan en orden asc, el último gana
    if (t.message.wa_contact_name) group.clientName = t.message.wa_contact_name;
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

  const conversations = groupConversations(messages);

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
