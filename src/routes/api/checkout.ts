import { createFileRoute } from "@tanstack/react-router";
import { createDodoCheckout } from "@/lib/payments/dodo.server";
import { userFromRequest } from "@/lib/supabase.server";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Only signed-in users can start a checkout, so every payment can be tied to an account.
          const authed = await userFromRequest(request);
          if (!authed) return Response.json({ ok: false, error: "Please sign in first." }, { status: 401 });

          let body: { name?: string; returnUrl?: string } = {};
          try {
            body = await request.json();
          } catch {
            // body is optional
          }

          const url = new URL(request.url);
          const returnUrl = `${url.origin}/checkout/success`;

          const input: Parameters<typeof createDodoCheckout>[0] = {
            returnUrl,
            metadata: { source: "speakcoach_web", user_id: authed.user.id },
          };
          if (authed.user.email) input.email = authed.user.email;
          if (body.name) input.name = body.name;
          const result = await createDodoCheckout(input);

          return Response.json(result, { status: result.ok ? 200 : 400 });
        } catch (err: any) {
          console.error("[API /api/checkout] Unexpected error:", err);
          return Response.json({ ok: false, error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
