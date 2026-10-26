import { describe, expect, it } from "vitest";
import { bearerToken, weekStartMs } from "./supabase.server";

const IST_OFFSET = 5.5 * 3600_000;
const istText = (ms: number) => new Date(ms + IST_OFFSET).toISOString().slice(0, 16).replace("T", " ");

describe("weekStartMs (the week the free limit counts)", () => {
  it("starts on Monday 00:00 India time", () => {
    // Friday 23 Oct 2026 -> Monday 19 Oct
    expect(istText(weekStartMs(new Date("2026-10-23T06:30:00Z")))).toBe("2026-10-19 00:00");
  });
  it("rolls over exactly at Monday midnight India time", () => {
    expect(istText(weekStartMs(new Date("2026-10-18T23:50:00+05:30")))).toBe("2026-10-12 00:00");
    expect(istText(weekStartMs(new Date("2026-10-19T00:10:00+05:30")))).toBe("2026-10-19 00:00");
  });
});

describe("bearerToken", () => {
  it("reads a Bearer token", () => {
    const req = new Request("https://x.test", { headers: { authorization: "Bearer abc123" } });
    expect(bearerToken(req)).toBe("abc123");
  });
  it("returns null without one", () => {
    expect(bearerToken(new Request("https://x.test"))).toBeNull();
    expect(bearerToken(new Request("https://x.test", { headers: { authorization: "Basic xyz" } }))).toBeNull();
  });
});
