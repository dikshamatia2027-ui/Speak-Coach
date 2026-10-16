import { createFileRoute } from "@tanstack/react-router";
import { createDodoCheckout } from "@/lib/payments/dodo.server";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: { email?: string; name?: string; returnUrl?: string } = {};
          try {
            body = await request.json();
          } catch {
            // body is optional
          }

          // Compute return URL fallback from request origin
          const url = new URL(request.url);
          const defaultReturnUrl = `${url.origin}/checkout/success`;
          const returnUrl = body.returnUrl || defaultReturnUrl;

          const result = await createDodoCheckout({
            email: body.email,
            name: body.name,
            returnUrl,
            metadata: {
              source: "speakcoach_web",
            },
          });

          return Response.json(result, { status: result.ok ? 200 : 400 });
        } catch (err: any) {
          console.error("[API /api/checkout] Unexpected error:", err);
          return Response.json(
            { ok: false, error: err?.message || "Internal server error" },
            { status: 500 }
          );
        }
      },
    },
  },
});
