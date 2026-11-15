import { describe, expect, it } from "vitest";
import { isProActive, PLAN_GRACE_MS } from "./plan";

const now = Date.parse("2026-11-01T00:00:00Z");

describe("isProActive", () => {
  it("is false for free or missing rows", () => {
    expect(isProActive(null, now)).toBe(false);
    expect(isProActive({ plan: "free" }, now)).toBe(false);
  });
  it("is true while the paid period lasts", () => {
    expect(isProActive({ plan: "pro", plan_renews_at: "2026-12-01T00:00:00Z" }, now)).toBe(true);
    expect(isProActive({ plan: "pro", plan_renews_at: null }, now)).toBe(true);
  });
  it("allows a short grace period, then ends", () => {
    const end = new Date(now - PLAN_GRACE_MS + 1000).toISOString();
    expect(isProActive({ plan: "pro", plan_renews_at: end }, now)).toBe(true);
    const lapsed = new Date(now - PLAN_GRACE_MS - 1000).toISOString();
    expect(isProActive({ plan: "pro", plan_renews_at: lapsed }, now)).toBe(false);
  });
});
