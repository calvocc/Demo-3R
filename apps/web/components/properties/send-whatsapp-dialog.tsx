"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WHATSAPP_TEST_RECIPIENTS } from "@/lib/whatsapp-recipients";
import { apiFetch } from "@/lib/api";

interface Props {
  propertyId: string | null;
  accessToken: string | undefined;
  onClose: () => void;
  onSent: () => void;
}

/**
 * Reemplaza el prompt() nativo que pedía el número en texto libre.
 * Meta solo deja enviar a números explícitamente verificados como
 * destinatarios de prueba — así que en vez de un input abierto, esto
 * es un <select> con la lista fija de WHATSAPP_TEST_RECIPIENTS.
 */
export function SendWhatsAppDialog({ propertyId, accessToken, onClose, onSent }: Props) {
  const [phone, setPhone] = useState(WHATSAPP_TEST_RECIPIENTS[0]?.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al abrir para una propiedad nueva, limpiar cualquier error de un
  // intento anterior.
  useEffect(() => {
    if (propertyId) setError(null);
  }, [propertyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !propertyId) return;
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/messages/send", accessToken, {
        method: "POST",
        body: { to: phone, propertyId },
      });
      onSent();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={propertyId !== null}
      onClose={onClose}
      title="Enviar propiedad por WhatsApp"
      description="Meta solo permite enviar a números verificados como destinatarios de prueba."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="recipient">Destinatario</Label>
          <Select id="recipient" value={phone} onChange={(e) => setPhone(e.target.value)}>
            {WHATSAPP_TEST_RECIPIENTS.map((r) => (
              <option key={r.phone} value={r.phone}>
                {r.name} ({r.phone})
              </option>
            ))}
          </Select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Enviar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
