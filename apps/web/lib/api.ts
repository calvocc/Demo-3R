const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/**
 * Wrapper delgado sobre fetch: adjunta el access_token de Supabase
 * como Bearer y apunta siempre a la API de NestJS. Ningún dato de
 * negocio (properties, messages, agents) se consulta directo a
 * Supabase desde el frontend — todo pasa por aquí.
 */
export async function apiFetch<T>(
  path: string,
  accessToken: string | undefined,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => undefined);

  if (!res.ok) {
    throw new ApiError(data?.message ?? `Error ${res.status}`, res.status);
  }
  return data as T;
}
