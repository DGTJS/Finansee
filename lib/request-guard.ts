import { createHash } from "node:crypto";
import { headers } from "next/headers";

type GuardOptions = { limit: number; windowMs: number; concurrency?: number; timeoutMs?: number };
type Bucket = { startedAt: number[]; active: number };

const buckets = new Map<string, Bucket>();
const DEFAULTS: GuardOptions = { limit: 60, windowMs: 60_000, concurrency: 8, timeoutMs: 8_000 };

function bucketFor(key: string) {
  const current = buckets.get(key) ?? { startedAt: [], active: 0 };
  buckets.set(key, current);
  return current;
}

function clean(now: number, bucket: Bucket, windowMs: number) {
  while (bucket.startedAt[0] !== undefined && bucket.startedAt[0] <= now - windowMs) bucket.startedAt.shift();
}

export class RequestLimitError extends Error {
  retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) { super(message); this.name = "RequestLimitError"; this.retryAfterSeconds = retryAfterSeconds; }
}

export function getClientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const address = forwarded || realIp || "unknown-client";
  return `${scope}:${hash(address)}`;
}

export async function getHeaderClientKey(scope: string, identity?: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  return `${scope}:${hash(identity ? `${identity}:${forwarded || realIp || "unknown-client"}` : forwarded || realIp || "unknown-client")}`;
}

export async function withRequestLimit<T>(key: string, operation: () => Promise<T>, options: Partial<GuardOptions> = {}) {
  const config = { ...DEFAULTS, ...options };
  const now = Date.now();
  const bucket = bucketFor(key);
  clean(now, bucket, config.windowMs);
  const retryFromWindow = bucket.startedAt[0] === undefined ? 1 : Math.max(1, Math.ceil((bucket.startedAt[0] + config.windowMs - now) / 1000));
  if (bucket.startedAt.length >= config.limit) throw new RequestLimitError("Muitas tentativas. Aguarde alguns instantes.", retryFromWindow);
  if (bucket.active >= (config.concurrency ?? DEFAULTS.concurrency!)) throw new RequestLimitError("Muitas requisições simultâneas. Aguarde a conclusão das anteriores.", 2);
  bucket.startedAt.push(now);
  bucket.active += 1;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let released = false;
  let timedOut = false;
  const release = () => {
    if (released) return;
    released = true;
    if (timeout) clearTimeout(timeout);
    bucket.active = Math.max(0, bucket.active - 1);
    if (!bucket.active && !bucket.startedAt.length) buckets.delete(key);
  };
  try {
    const request = operation();
    request.then(release, release);
    return await Promise.race([request, new Promise<never>((_, reject) => { timeout = setTimeout(() => { timedOut = true; reject(new RequestLimitError("A requisição excedeu o tempo limite.", 2)); }, config.timeoutMs); })]);
  } catch (error) {
    if (!timedOut) release();
    throw error;
  }
}

export function hash(value: string) { return createHash("sha256").update(value).digest("hex").slice(0, 32); }
