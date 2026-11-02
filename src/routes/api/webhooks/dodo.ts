import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDodoClient, verifyDodoWebhook } from "@/lib/payments/dodo.server";
import { planChangeForSubscription, proProductIds, type PlanChange } from "@/lib/payments/plan-events";
import { adminClient } from "@/lib/supabase.server";

/** Find which of our users a Dodo event belongs to: the user_id we attached at checkout, then the saved Dodo customer, then the customer email. */
async function findUserId(admin: SupabaseClient, data: any): Promise<string | null> {
  const fromMeta = data?.metadata?.user_id;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  const customerId = data?.customer?.customer_id;
  if (typeof customerId === "string" && customerId) {
    const { data: row } = await admin.from("profiles").select("id").eq("dodo_customer_id", customerId).maybeSingle();
    if (row?.id) return row.id as string;
  }
  const email = String(data?.customer?.email ?? "").toLowerCase();
  if (!email) return null;
  for (let page = 1; page <= 10; page++) {
    const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !list?.users.length) return null;
    const hit = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit.id;
    if (list.users.length < 1000) return null;
  }
  return null;
}

/** Money returned on a subscription payment ends Pro. Refund and dispute events do not say what was bought, so ask Dodo. */
async function revocationFromPayment(paymentId: unknown): Promise<{ change: PlanChange; payment: unknown } | null> {
  const { client } = getDodoClient();
  if (!client || typeof paymentId !== "string") throw new Error("Cannot look up the payment for this event");
  const payment = await client.payments.retrieve(paymentId);
  if (!payment.subscription_id) return null;
  return { change: { plan: "free", renewsAt: null }, payment };
}

export const Route = createFileRoute("/api/webhooks/dodo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const rawBody = await request.text();
          const headers: Record<string, string> = {};
          request.headers.forEach((value, key) => {
            headers[key] = value;
          });

          // Fail closed: without the signing key we cannot tell real events from forged ones.
          if (!process.env["DODO_PAYMENTS_WEBHOOK_KEY"]) {
            console.error("[Dodo Webhook] DODO_PAYMENTS_WEBHOOK_KEY is not set; rejecting request");
            return Response.json({ error: "Webhook not configured" }, { status: 500 });
          }

          let event: any;
          try {
            event = verifyDodoWebhook(rawBody, headers);
          } catch (verifyErr: any) {
            console.warn("[Dodo Webhook] Verification failed:", verifyErr?.message);
            return Response.json({ error: "Invalid signature" }, { status: 401 });
          }

          const admin = adminClient();
          if (!admin) {
            console.error("[Dodo Webhook] Supabase is not configured; cannot record the plan");
            return Response.json({ error: "Server not configured" }, { status: 500 });
          }

          // Ignore events we have already handled (Dodo retries and replays).
          const webhookId = headers["webhook-id"];
          if (webhookId) {
            const { data: seen } = await admin.from("webhook_events").select("id").eq("id", webhookId).maybeSingle();
            if (seen) return Response.json({ received: true, duplicate: true }, { status: 200 });
          }

          const eventType: string = event.type || event.event_type || "";
          const data = event.data ?? {};
          console.log(`[Dodo Webhook] ${eventType || "unknown"}`);

          let change: PlanChange | null = null;
          let source: unknown = data;
          if (eventType.startsWith("subscription.")) {
            const proIds = proProductIds();
            if (proIds.size === 0) {
              console.error("[Dodo Webhook] DODO_PAYMENTS_PRODUCT_ID is not set; cannot tell which products unlock Pro");
              return Response.json({ error: "Server not configured" }, { status: 500 });
            }
            change = planChangeForSubscription(eventType, data, proIds);
          } else if ((eventType === "refund.succeeded" && !data.is_partial) || eventType === "dispute.lost") {
            const revocation = await revocationFromPayment(data.payment_id);
            if (revocation) {
              change = revocation.change;
              source = revocation.payment;
            }
          }

          if (change) {
            const userId = await findUserId(admin, source);
            if (!userId) {
              console.warn("[Dodo Webhook] Could not match this event to a user:", eventType);
              // 500 so Dodo retries; a human can also match it later from the Dodo dashboard.
              return Response.json({ error: "User not found" }, { status: 500 });
            }
            const customerId = (source as any)?.customer?.customer_id;
            const eventAt = Date.parse(String(event.timestamp));
            // Events can arrive out of order, so the database keeps only the newest one for each user.
            const { error } = await admin.rpc("apply_plan_event", {
              p_user_id: userId,
              p_plan: change.plan,
              p_renews_at: change.renewsAt,
              p_customer_id: typeof customerId === "string" ? customerId : null,
              p_event_at: new Date(Number.isNaN(eventAt) ? Date.now() : eventAt).toISOString(),
            });
            if (error) {
              console.error("[Dodo Webhook] Could not save plan:", error.message);
              return Response.json({ error: "Could not save plan" }, { status: 500 });
            }
          }

          if (webhookId) await admin.from("webhook_events").insert({ id: webhookId });
          return Response.json({ received: true }, { status: 200 });
        } catch (err: any) {
          console.error("[Dodo Webhook] Handler error:", err);
          return Response.json({ error: "Webhook processing failed" }, { status: 500 });
        }
      },
    },
  },
});
