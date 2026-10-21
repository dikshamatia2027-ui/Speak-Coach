/**
 * Small in-memory rate limiter (per server instance).
 * Good enough to stop a casual loop from burning the Groq quota, but NOT a hard limit:
 * on serverless each instance has its own counter and it resets on cold start.
 * A real limit needs a shared store (Supabase table or Upstash Redis).
 */
const hits = new Map<string, number[]>();
const MAX_KEYS = 5000;

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || request.headers.get("x-real-ip") || "unknown";
}

/** Returns true if the request is allowed, false if the caller is over the limit. */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k);
      if (hits.size <= MAX_KEYS / 2) break;
    }
  }
  return true;
}
