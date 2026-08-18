"use client";

import { createClient } from "@supabase/supabase-js";

// Único punto del frontend que habla directo con Supabase: login,
// registro y sesión. Todo lo demás (propiedades, mensajes, agentes)
// va a la API de NestJS vía lib/api.ts.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
