import { createHash, timingSafeEqual } from "node:crypto";

/** True only when CRON_SECRET is set and the request sends it as a Bearer token. A missing secret refuses everyone. */
export function isAuthorizedCron(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false;
  // Hash both sides so the comparison takes the same time whatever the input length.
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(authHeader), digest(`Bearer ${secret}`));
}
