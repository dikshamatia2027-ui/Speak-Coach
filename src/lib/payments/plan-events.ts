export type PlanChange = { plan: "pro" | "free"; renewsAt: string | null };

const GRANT = new Set(["subscription.active", "subscription.renewed", "subscription.plan_changed"]);
const REVOKE = new Set(["subscription.expired", "subscription.failed", "subscription.on_hold"]);

/** The Dodo products that unlock Pro. A one-time pack or any other product must never appear here. */
export function proProductIds(env: Record<string, string | undefined> = process.env): Set<string> {
  const ids = [
    env["DODO_PAYMENTS_PRODUCT_ID"],
    ...(env["DODO_PAYMENTS_EXTRA_PRO_PRODUCT_IDS"] ?? "").split(","),
  ];
  return new Set(ids.map((id) => id?.trim() ?? "").filter(Boolean));
}

/** What a subscription event means for the plan, or null if it should not change anything. */
export function planChangeForSubscription(
  eventType: string,
  data: { product_id?: unknown; next_billing_date?: unknown },
  proIds: Set<string>,
  now = Date.now(),
): PlanChange | null {
  if (typeof data.product_id !== "string" || !proIds.has(data.product_id)) return null;
  const nextBilling = typeof data.next_billing_date === "string" ? data.next_billing_date : null;
  if (GRANT.has(eventType)) return { plan: "pro", renewsAt: nextBilling };
  if (REVOKE.has(eventType)) return { plan: "free", renewsAt: null };
  if (eventType === "subscription.cancelled") {
    // Terms promise access until the end of the paid period; isProActive ends it on that date.
    const paidUntil = nextBilling ? Date.parse(nextBilling) : Number.NaN;
    return paidUntil > now
      ? { plan: "pro", renewsAt: nextBilling }
      : { plan: "free", renewsAt: null };
  }
  return null;
}
