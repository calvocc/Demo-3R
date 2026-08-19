"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  onInvite: (values: { email: string; fullName: string; role: "agente" | "cliente" }) => Promise<{
    tempPassword: string;
  }>;
}

export function InviteAgentForm({ onInvite }: Props) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"agente" | "cliente">("agente");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const { tempPassword } = await onInvite({ email, fullName, role });
      setResult(`Usuario creado. Contraseña temporal: ${tempPassword} (compártela por un canal seguro)`);
      setEmail("");
      setFullName("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 sm:max-w-xs">
              <Label htmlFor="role">Rol</Label>
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value as "agente" | "cliente")}>
                <option value="agente">Agente / broker</option>
                <option value="cliente">Cliente (solo lectura)</option>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && <p className="text-sm text-primary">{result}</p>}
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Invitando…" : "Invitar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
