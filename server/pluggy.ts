import { z } from "zod";

const baseUrl = process.env.PLUGGY_BASE_URL ?? "https://api.pluggy.ai";
const tokenResponse = z.object({ apiKey: z.string(), expiresIn: z.number().optional() });
let cachedToken: { value: string; expiresAt: number } | null = null;

export class PluggyError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "PluggyError";
  }
}

async function getApiToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new PluggyError("PLUGGY_NOT_CONFIGURED");
  const response = await fetch(`${baseUrl}/auth`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId, clientSecret }), cache: "no-store" });
  if (!response.ok) throw new PluggyError("PLUGGY_AUTH_FAILED", response.status);
  const parsed = tokenResponse.safeParse(await response.json());
  if (!parsed.success) throw new PluggyError("PLUGGY_INVALID_AUTH_RESPONSE");
  cachedToken = { value: parsed.data.apiKey, expiresAt: Date.now() + (parsed.data.expiresIn ?? 3600) * 1000 };
  return parsed.data.apiKey;
}

async function pluggyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = await getApiToken();
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "content-type": "application/json", "x-api-key": apiKey, ...init?.headers }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (response.status === 401) { cachedToken = null; throw new PluggyError("PLUGGY_AUTH_EXPIRED", response.status); }
  if (!response.ok) throw new PluggyError(response.status === 429 ? "PLUGGY_RATE_LIMIT" : "PLUGGY_API_ERROR", response.status);
  return await response.json() as T;
}

export function createConnectToken(clientUserId: string) {
  return pluggyFetch<{ accessToken: string }>("/connect_token", { method: "POST", body: JSON.stringify({ options: { clientUserId, avoidDuplicates: true } }) });
}

export type PluggyItem = { id: string; connector?: { name?: string; imageUrl?: string }; status?: string; error?: { message?: string } };
export type PluggyAccount = { id: string; name?: string; type?: string; subtype?: string; number?: string; balance?: number; availableBalance?: number; currencyCode?: string };
export type PluggyTransaction = { id: string; description?: string; merchant?: { name?: string }; amount?: number; type?: string; date?: string; category?: string };

export const getItem = (itemId: string) => pluggyFetch<PluggyItem>(`/items/${encodeURIComponent(itemId)}`);
export const getAccounts = (itemId: string) => pluggyFetch<{ results: PluggyAccount[] }>(`/accounts?itemId=${encodeURIComponent(itemId)}`);
export const getTransactions = (accountId: string) => pluggyFetch<{ results: PluggyTransaction[] }>(`/transactions?accountId=${encodeURIComponent(accountId)}&pageSize=500`);
