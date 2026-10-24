import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyDodoWebhook } from "@/lib/payments/dodo.server";
import { adminClient } from "@/lib/supabase.server";

const ACTIVATE = new Set(["subscription.active", "subscription.renewed", "payment.succeeded"]);
const DEACTIVATE = new Set(["subscription.cancelled", "subscription.expired", "subscription.failed", "subscription.on_hold"]);

/** Find which of our users a Dodo event belongs to: the user_id we attached at checkout, else the customer email. */
async function findUserId(admin: SupabaseClient, data: any): Promise<string | null> {
  const fromMeta = data?.metadata?.user_id;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
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

          if (ACTIVATE.has(eventType) || DEACTIVATE.has(eventType)) {
            const userId = await findUserId(admin, data);
            if (!userId) {
              console.warn("[Dodo Webhook] Could not match this event to a user:", eventType);
              // 500 so Dodo retries; a human can also match it later from the Dodo dashboard.
              return Response.json({ error: "User not found" }, { status: 500 });
            }
            const pro = ACTIVATE.has(eventType);
            const row: Record<string, unknown> = { id: userId, plan: pro ? "pro" : "free" };
            if (pro && data.next_billing_date) row["plan_renews_at"] = data.next_billing_date;
            if (data.customer?.customer_id) row["dodo_customer_id"] = data.customer.customer_id;
            const { error } = await admin.from("profiles").upsert(row, { onConflict: "id" });
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
