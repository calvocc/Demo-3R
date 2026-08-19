"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { MessageList, Message } from "@/components/messages/message-list";
import { PageHeader } from "@/components/ui/page-header";

export default function MessagesPage() {
  const { session, profile } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.role === "cliente") router.replace("/properties");
  }, [profile, router]);

  useEffect(() => {
    if (!session?.access_token) return;
    apiFetch<Message[]>("/messages", session.access_token)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  return (
    <div>
      <PageHeader
        title="Mensajes de WhatsApp"
        description="Log de mensajes entrantes/salientes — prueba de que el flujo de datos funciona de extremo a extremo."
      />

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && <MessageList messages={messages} />}
    </div>
  );
}
