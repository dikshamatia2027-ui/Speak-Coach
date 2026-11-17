import { GOALS, SCENARIOS, type GoalId } from "@/lib/speakcoach";

/**
 * Read the request body, stopping as soon as it passes maxBytes.
 * Returns null when the body is too large, whatever the Content-Length header says.
 */
export async function readBodyCapped(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out;
}

export type WavInfo = { durationSec: number; sampleRate: number; channels: number };

/**
 * Check that the bytes are an uncompressed PCM WAV file (what our recorder makes) and
 * return its real length. Returns null for anything else.
 */
export function parseWav(bytes: Uint8Array): WavInfo | null {
  if (bytes.byteLength < 44) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;

  let fmt: { channels: number; sampleRate: number; bits: number } | null = null;
  let offset = 12;
  while (offset + 8 <= bytes.byteLength) {
    const id = tag(offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === "fmt ") {
      if (size < 16 || body + 16 > bytes.byteLength) return null;
      const format = view.getUint16(body, true);
      const channels = view.getUint16(body + 2, true);
      const sampleRate = view.getUint32(body + 4, true);
      const bits = view.getUint16(body + 14, true);
      if (format !== 1 || channels < 1 || channels > 2 || bits !== 16) return null;
      if (sampleRate < 8000 || sampleRate > 48000) return null;
      fmt = { channels, sampleRate, bits };
    } else if (id === "data") {
      if (!fmt) return null;
      // Trust the bytes actually sent, not the size written in the header.
      const dataBytes = Math.min(size, bytes.byteLength - body);
      const bytesPerSecond = fmt.sampleRate * fmt.channels * (fmt.bits / 8);
      return { durationSec: dataBytes / bytesPerSecond, sampleRate: fmt.sampleRate, channels: fmt.channels };
    }
    offset = body + size + (size % 2);
  }
  return null;
}

export type ResolvedScenario =
  | { ok: true; prompt: string; goal: GoalId }
  | { ok: false; status: number; error: string };

const GOAL_IDS = new Set<string>(GOALS.map((g) => g.id));
const normalise = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const PRO_PROMPTS = new Set(SCENARIOS.filter((s) => s.tier === "pro").map((s) => normalise(s.prompt)));

/**
 * Decide which question and goal to analyse against.
 * Built-in scenarios use the server's own text and are refused on the free plan when they are Pro-only.
 * Custom scenarios (made per user) keep the sent text, with the goal checked against the known list.
 */
export function resolveScenario(input: {
  scenarioId: string;
  prompt: string;
  goal: string;
  plan: "free" | "pro";
}): ResolvedScenario {
  const builtIn = SCENARIOS.find((s) => s.id === input.scenarioId);
  const isPro = input.plan === "pro";
  if (builtIn) {
    if (builtIn.tier === "pro" && !isPro) return proOnly();
    return { ok: true, prompt: builtIn.prompt, goal: builtIn.goal };
  }
  const prompt = input.prompt.trim().slice(0, 500);
  // Stops a free user replaying a Pro question under a made-up id.
  if (!isPro && PRO_PROMPTS.has(normalise(prompt))) return proOnly();
  const goal = GOAL_IDS.has(input.goal) ? (input.goal as GoalId) : "confidence";
  return { ok: true, prompt, goal };
}

function proOnly(): ResolvedScenario {
  return { ok: false, status: 403, error: "This scenario is part of SpeakCoach Pro. Upgrade to practise it." };
}
