"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AMERICAN_COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "@/lib/country-codes";

interface Props {
  onInvite: (values: {
    email: string;
    fullName: string;
    role: "agente" | "broker";
    phone: string;
  }) => Promise<{
    tempPassword: string;
  }>;
}

export function InviteAgentForm({ onInvite }: Props) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"agente" | "broker">("agente");
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY_CODE.dialCode);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const localDigits = phoneNumber.replace(/\D/g, "");
    if (localDigits.length < 6) {
      setError("Ingresa un número de teléfono válido");
      return;
    }
    const phone = `${dialCode.replace("+", "")}${localDigits}`;

    setLoading(true);
    try {
      const { tempPassword } = await onInvite({ email, fullName, role, phone });
      setResult(`Usuario creado. Contraseña temporal: ${tempPassword} (compártela por un canal seguro)`);
      setEmail("");
      setFullName("");
      setPhoneNumber("");
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
              <Select id="role" value={role} onChange={(e) => setRole(e.target.value as "agente" | "broker")}>
                <option value="agente">Agente</option>
                <option value="broker">Broker</option>
              </Select>
            </div>
            {/* sm:col-span-2: ocupa todo el ancho del contenedor (las
                dos columnas del grid) para que la fila de indicativo +
                número no se vea cortada. */}
            <div className="sm:col-span-2">
              <Label htmlFor="phoneNumber">Teléfono (WhatsApp)</Label>
              <p className="mb-1.5 text-xs text-muted-foreground">
                A este número el bot le escribirá cuando un cliente pregunte por una de sus propiedades.
              </p>
              <div className="flex w-full gap-2">
                {/* El <Select> trae "w-full" en sus clases base (ver
                    components/ui/select.tsx) — Tailwind decide qué
                    utilidad de ancho gana por el orden en su hoja de
                    estilos generada, NO por el orden del className, así
                    que sobreescribirlo con "w-auto" ahí mismo no es
                    confiable (por eso el selector de país quedaba más
                    grande que el input de número). En vez de pelear esa
                    clase, lo encerramos en un contenedor de ancho fijo
                    y angosto: adentro, el propio w-full del <Select> se
                    resuelve contra ESE ancho, no contra la fila entera. */}
                <div className="w-[6.5rem] shrink-0">
                  <Select
                    aria-label="Indicativo de país"
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                  >
                    {AMERICAN_COUNTRY_CODES.map((c) => (
                      <option key={c.iso} value={c.dialCode}>
                        {c.flag} {c.dialCode}
                      </option>
                    ))}
                  </Select>
                </div>
                <Input
                  id="phoneNumber"
                  type="tel"
                  required
                  placeholder="3001234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="min-w-0 flex-1"
                />
              </div>
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
