import { describe, expect, it } from "vitest";
import { allowRequest, clientIp } from "./rate-limit.server";

describe("allowRequest", () => {
  it("allows up to the limit, then blocks", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(allowRequest(key, 3, 60_000)).toBe(true);
    expect(allowRequest(key, 3, 60_000)).toBe(false);
  });
  it("counts each visitor separately", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(allowRequest(a, 1, 60_000)).toBe(true);
    expect(allowRequest(a, 1, 60_000)).toBe(false);
    expect(allowRequest(b, 1, 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first address in x-forwarded-for", () => {
    const req = new Request("https://x.test", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });
  it("falls back to unknown", () => {
    expect(clientIp(new Request("https://x.test"))).toBe("unknown");
  });
});
