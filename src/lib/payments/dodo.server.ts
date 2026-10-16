import DodoPayments from "dodopayments";

export interface CreateCheckoutInput {
  email?: string;
  name?: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  ok: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
  testMode?: boolean;
  missingConfig?: boolean;
}

export function getDodoClient(): { client: DodoPayments | null; isTest: boolean; missingConfig: boolean } {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    return { client: null, isTest: true, missingConfig: true };
  }

  const isLive = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode";
  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: isLive ? "live_mode" : "test_mode",
  });

  return { client, isTest: !isLive, missingConfig: false };
}

export async function createDodoCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
  const { client, isTest, missingConfig } = getDodoClient();
  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID || "pdt_speakcoach_pro";

  if (missingConfig || !client) {
    return {
      ok: false,
      missingConfig: true,
      testMode: isTest,
      error: "DODO_PAYMENTS_API_KEY is not configured in environment variables.",
    };
  }

  try {
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: input.email
        ? {
            email: input.email,
            name: input.name || undefined,
          }
        : undefined,
      return_url: input.returnUrl || undefined,
      metadata: input.metadata || undefined,
    });

    if (!session.checkout_url) {
      return {
        ok: false,
        error: "Dodo Payments did not return a checkout URL.",
      };
    }

    return {
      ok: true,
      checkoutUrl: session.checkout_url,
      sessionId: session.session_id,
      testMode: isTest,
    };
  } catch (err: any) {
    console.error("[Dodo Payments] Error creating checkout session:", err);
    return {
      ok: false,
      error: err?.message || "Failed to create Dodo Payments checkout session.",
    };
  }
}

export function getCustomerPortalUrl(businessId?: string): string {
  const id = businessId || process.env.DODO_PAYMENTS_BUSINESS_ID || "";
  const isLive = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode";
  if (!id) {
    return isLive
      ? "https://customer.dodopayments.com"
      : "https://test.customer.dodopayments.com";
  }
  return isLive
    ? `https://customer.dodopayments.com/login/${id}`
    : `https://test.customer.dodopayments.com/login/${id}`;
}

export function verifyDodoWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>
): any {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!webhookKey) {
    throw new Error("DODO_PAYMENTS_WEBHOOK_KEY is not configured");
  }

  const { client } = getDodoClient();
  if (client) {
    return client.webhooks.unwrap(rawBody, {
      headers: headers as Record<string, string>,
      key: webhookKey,
    });
  }

  return JSON.parse(rawBody);
}
