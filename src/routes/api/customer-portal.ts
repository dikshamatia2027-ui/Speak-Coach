import { createFileRoute } from "@tanstack/react-router";
import { getCustomerPortalUrl } from "@/lib/payments/dodo.server";

export const Route = createFileRoute("/api/customer-portal")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const businessId = url.searchParams.get("business_id") || undefined;
        const portalUrl = getCustomerPortalUrl(businessId);
        return Response.json({ portalUrl }, { status: 200 });
      },
    },
  },
});
