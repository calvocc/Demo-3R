"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  wa_from: string;
  wa_to: string;
  body: string | null;
  created_at: string;
}

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mensajes de WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Log crudo de mensajes entrantes/salientes — prueba de que el flujo de datos funciona
          de extremo a extremo.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && messages.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay mensajes.</p>
      )}
      {!loading && !error && messages.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dirección</TableHead>
              <TableHead>De</TableHead>
              <TableHead>Para</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Badge>{m.direction === "inbound" ? "Entrante" : "Saliente"}</Badge>
                </TableCell>
                <TableCell>{m.wa_from}</TableCell>
                <TableCell>{m.wa_to}</TableCell>
                <TableCell className="max-w-md whitespace-pre-wrap">{m.body}</TableCell>
                <TableCell>{new Date(m.created_at).toLocaleString("es-CO")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
