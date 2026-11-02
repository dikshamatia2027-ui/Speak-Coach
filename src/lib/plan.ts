/** Renewal events can arrive late, so a paying user keeps Pro for a short while past the billing date. */
export const PLAN_GRACE_MS = 86_400_000;

/** A profile row counts as Pro only while its paid period lasts. No date means no known end. */
export function isProActive(
  row: { plan?: unknown; plan_renews_at?: unknown } | null | undefined,
  now = Date.now(),
): boolean {
  if (row?.plan !== "pro") return false;
  if (typeof row.plan_renews_at !== "string") return true;
  const end = Date.parse(row.plan_renews_at);
  return Number.isNaN(end) || end + PLAN_GRACE_MS > now;
}
