/**
 * Google Gemini REST helpers — server-side only.
 *
 * Raw fetch against https://generativelanguage.googleapis.com (v1beta).
 * The API key travels only in the x-goog-api-key header and never reaches
 * browser code, logs, Git, or client-facing error messages.
 */

export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Stable, currently documented models (verified on ai.google.dev, Oct 2026). */
export const GEMINI_TEXT_MODEL = "gemini-3.8-flash";
export const GEMINI_TRANSCRIBE_MODEL = "gemini-3.5-transcribe";

/** Upstream safety timeout so a hung provider never hangs the request. */
const UPSTREAM_TIMEOUT_MS = 90_000;

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Combine the caller's abort signal with a safety timeout. */
function withTimeoutSignal(parent: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const onParentAbort = () => controller.abort();
  if (parent) {
    if (parent.aborted) controller.abort();
    else parent.addEventListener("abort", onParentAbort, { once: true });
  }
  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    dispose() {
      clearTimeout(timer);
      parent?.removeEventListener("abort", onParentAbort);
    },
  };
}

/** Map a non-OK Gemini REST response to an honest, sanitized GatewayError. */
async function toGatewayError(res: Response): Promise<GatewayError> {
  let message = "";
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    message = body.error?.message ?? "";
  } catch {
    /* non-JSON error body */
  }
  if (res.status === 401 || res.status === 403) {
    return new GatewayError(res.status, "The AI key was rejected. Check the GEMINI_API_KEY configuration.");
  }
  if (res.status === 404) {
    return new GatewayError(404, "The AI model is unavailable right now. Please try again later.");
  }
  if (res.status === 429) {
    return new GatewayError(429, "rate_limited"); // callers translate this to friendly copy
  }
  // The provider message contains no secrets (key is header-only); cap its length.
  return new GatewayError(res.status, message.slice(0, 300) || `AI request failed (HTTP ${res.status}).`);
}

/** POST JSON to a Gemini model's generateContent endpoint. */
export async function geminiGenerate(
  model: string,
  body: unknown,
  apiKey: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const guard = withTimeoutSignal(signal, UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: guard.signal,
    });
    if (!res.ok) throw await toGatewayError(res);
    return await res.json();
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    if (guard.didTimeout()) {
      throw new GatewayError(504, "The AI took too long to respond. Please try again.");
    }
    throw err; // client aborts propagate so the route can return its Cancelled response
  } finally {
    guard.dispose();
  }
}

/**
 * Concatenated text parts from a generateContent response.
 * Text models return `parts[].text`; the transcription model returns
 * `parts[].audioTranscription.text` — both are handled here.
 */
export function geminiText(data: unknown): string {
  const d = data as {
    candidates?: { content?: { parts?: ({ text?: string; audioTranscription?: { text?: string } } | undefined)[] } }[];
  };
  const parts = d?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p?.text ?? p?.audioTranscription?.text ?? "")
    .join("")
    .trim();
}

/** Parsed JSON object from a structured-output response, or an honest 502. */
export function geminiJson(data: unknown, unreadableMessage: string): Record<string, unknown> {
  const text = geminiText(data);
  if (!text) throw new GatewayError(502, unreadableMessage);
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    return parsed as Record<string, unknown>;
  } catch {
    throw new GatewayError(502, unreadableMessage);
  }
}
