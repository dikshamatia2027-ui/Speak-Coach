import { describe, expect, it } from "vitest";
import { planChangeForSubscription, proProductIds } from "./plan-events";

const now = Date.parse("2026-11-01T00:00:00Z");
const pro = new Set(["pdt_pro"]);
const future = "2026-12-01T00:00:00Z";
const past = "2026-10-01T00:00:00Z";
const sub = (next_billing_date: string, product_id = "pdt_pro") => ({
  product_id,
  next_billing_date,
});

describe("proProductIds", () => {
  it("reads the main and extra products", () => {
    const ids = proProductIds({
      DODO_PAYMENTS_PRODUCT_ID: "a",
      DODO_PAYMENTS_EXTRA_PRO_PRODUCT_IDS: " b, c ,",
    });
    expect([...ids]).toEqual(["a", "b", "c"]);
  });
  it("is empty when nothing is configured", () => {
    expect(proProductIds({}).size).toBe(0);
  });
});

describe("planChangeForSubscription", () => {
  it("grants Pro with the paid-until date", () => {
    expect(planChangeForSubscription("subscription.active", sub(future), pro, now)).toEqual({
      plan: "pro",
      renewsAt: future,
    });
    expect(planChangeForSubscription("subscription.renewed", sub(future), pro, now)).toEqual({
      plan: "pro",
      renewsAt: future,
    });
  });
  it("ignores products that do not unlock Pro", () => {
    expect(
      planChangeForSubscription("subscription.active", sub(future, "pdt_pack"), pro, now),
    ).toBeNull();
    expect(
      planChangeForSubscription("subscription.expired", sub(future, "pdt_pack"), pro, now),
    ).toBeNull();
    expect(planChangeForSubscription("subscription.active", {}, pro, now)).toBeNull();
  });
  it("keeps Pro until the end of the paid period after a cancel", () => {
    expect(planChangeForSubscription("subscription.cancelled", sub(future), pro, now)).toEqual({
      plan: "pro",
      renewsAt: future,
    });
  });
  it("ends Pro when a cancel has no paid time left", () => {
    expect(planChangeForSubscription("subscription.cancelled", sub(past), pro, now)).toEqual({
      plan: "free",
      renewsAt: null,
    });
  });
  it("ends Pro on expiry, failure and hold", () => {
    for (const type of ["subscription.expired", "subscription.failed", "subscription.on_hold"]) {
      expect(planChangeForSubscription(type, sub(future), pro, now)).toEqual({
        plan: "free",
        renewsAt: null,
      });
    }
  });
  it("ignores unrelated subscription events", () => {
    expect(planChangeForSubscription("subscription.updated", sub(future), pro, now)).toBeNull();
  });
});
