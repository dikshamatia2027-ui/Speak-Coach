import { createFileRoute } from "@tanstack/react-router";
import { verifyDodoWebhook } from "@/lib/payments/dodo.server";

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

          let event: any;
          try {
            event = verifyDodoWebhook(rawBody, headers);
          } catch (verifyErr: any) {
            console.warn("[Dodo Webhook] Verification failed:", verifyErr?.message);
            // In dev or if key is omitted, allow json parse fallback if configured
            if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
              event = JSON.parse(rawBody);
            } else {
              return Response.json({ error: "Invalid signature" }, { status: 401 });
            }
          }

          console.log(`[Dodo Webhook] Received event: ${event.type || event.event_type || "unknown"}`);

          // Handle specific Dodo Payments events
          const eventType = event.type || event.event_type || "";
          switch (eventType) {
            case "payment.succeeded":
            case "subscription.active":
            case "subscription.created":
            case "subscription.renewed":
              console.log("[Dodo Webhook] Subscription activated or payment succeeded:", event.data?.customer_id);
              break;
            case "subscription.cancelled":
            case "subscription.failed":
              console.log("[Dodo Webhook] Subscription cancelled or failed:", event.data?.customer_id);
              break;
            default:
              console.log(`[Dodo Webhook] Unhandled event type: ${eventType}`);
          }

          return Response.json({ received: true }, { status: 200 });
        } catch (err: any) {
          console.error("[Dodo Webhook] Handler error:", err);
          return Response.json({ error: "Webhook processing failed" }, { status: 500 });
        }
      },
    },
  },
});
