import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/lib/speakcoach";
import { parseWav, readBodyCapped, resolveScenario } from "./analyze-input.server";

/** Minimal PCM WAV like the browser recorder makes: 16-bit, given rate and seconds of silence. */
function wav(seconds: number, rate = 16000, opts: { format?: number; bits?: number } = {}) {
  const dataBytes = Math.round(seconds * rate) * 2;
  const buf = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(buf);
  const tag = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  tag(0, "RIFF"); v.setUint32(4, 36 + dataBytes, true); tag(8, "WAVE");
  tag(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, opts.format ?? 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, opts.bits ?? 16, true);
  tag(36, "data"); v.setUint32(40, dataBytes, true);
  return new Uint8Array(buf);
}

describe("parseWav", () => {
  it("measures the real length of a recorder WAV", () => {
    expect(parseWav(wav(30))?.durationSec).toBeCloseTo(30, 3);
  });
  it("uses the bytes actually sent, not a header that claims more", () => {
    const short = wav(10);
    new DataView(short.buffer).setUint32(40, 999_999_999, true);
    expect(parseWav(short)?.durationSec).toBeCloseTo(10, 3);
  });
  it("rejects files that are not 16-bit PCM WAV", () => {
    expect(parseWav(new TextEncoder().encode("ID3 this is an mp3 file, not a wav at all......"))).toBeNull();
    expect(parseWav(wav(5, 16000, { format: 3 }))).toBeNull();
    expect(parseWav(wav(5, 16000, { bits: 8 }))).toBeNull();
    expect(parseWav(wav(5, 96000))).toBeNull();
    expect(parseWav(new Uint8Array(10))).toBeNull();
  });
});

describe("readBodyCapped", () => {
  const req = (bytes: number) =>
    new Request("https://x.test", { method: "POST", body: new Uint8Array(bytes) });
  it("returns the body when it fits", async () => {
    expect((await readBodyCapped(req(1000), 1000))?.byteLength).toBe(1000);
  });
  it("stops when the body is bigger than the cap, even with a false Content-Length", async () => {
    const r = new Request("https://x.test", {
      method: "POST",
      body: new Uint8Array(5000),
      headers: { "content-length": "10" },
    });
    expect(await readBodyCapped(r, 1000)).toBeNull();
  });
});

describe("resolveScenario", () => {
  const free = SCENARIOS.find((s) => s.tier !== "pro")!;
  const pro = SCENARIOS.find((s) => s.tier === "pro")!;

  it("uses the server's own question and goal for built-in scenarios", () => {
    expect(resolveScenario({ scenarioId: free.id, prompt: "anything", goal: "sales", plan: "free" })).toEqual({
      ok: true, prompt: free.prompt, goal: free.goal,
    });
  });
  it("refuses Pro-only scenarios on the free plan and allows them on Pro", () => {
    expect(resolveScenario({ scenarioId: pro.id, prompt: "", goal: "", plan: "free" })).toMatchObject({ ok: false, status: 403 });
    expect(resolveScenario({ scenarioId: pro.id, prompt: "", goal: "", plan: "pro" })).toMatchObject({ ok: true, prompt: pro.prompt });
  });
  it("refuses a Pro question sent under a made-up id on the free plan", () => {
    expect(
      resolveScenario({ scenarioId: "custom-1", prompt: `  ${pro.prompt.toUpperCase()} `, goal: pro.goal, plan: "free" }),
    ).toMatchObject({ ok: false, status: 403 });
  });
  it("keeps custom questions, trims them, and replaces unknown goals", () => {
    const r = resolveScenario({ scenarioId: "custom-9", prompt: "x".repeat(900), goal: "hacking", plan: "free" });
    expect(r).toMatchObject({ ok: true, goal: "confidence" });
    expect(r.ok && r.prompt.length).toBe(500);
  });
});
