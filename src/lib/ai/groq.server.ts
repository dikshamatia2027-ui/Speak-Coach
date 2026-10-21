/** Groq LPU API helpers — server-side only.
 * 
 * The Groq API uses an OpenAI-compatible interface:
 *   POST https://api.groq.com/openai/v1/chat/completions
 *   Authorization: Bearer $GROQ_API_KEY
 * 
 * The API key travels only in the header and never reaches browser code,
 * logs, Git, or client-facing error messages.
 */

/** Base URL for the Groq API. */
export const GROQ_API_BASE = "https://api.groq.com/openai/v1";

/** Text generation models (verified on console.groq.com, Oct 2026). */
export const GROQ_TEXT_MODEL = "openai/gpt-oss-20b";
export const GROQ_VERSA_MODEL = "openai/gpt-oss-120b";

/** Speech-to-text model (Whisper-based, equivalent to gemini-3.5-transcribe). */
export const GROQ_TRANSCRIBE_MODEL = "whisper-large-v3";

/** Upstream safety timeout so a hung provider never hangs the request. */
const UPSTREAM_TIMEOUT_MS = 90_000;

/** Gateway error class for Groq API errors. */
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

/** Map a non-OK Groq REST response to an honest, sanitized GatewayError. */
async function toGatewayError(res: Response): Promise<GatewayError> {
  let message = "";
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    message = body.error?.message ?? "";
  } catch {
    /* non-JSON error body */
  }
  if (res.status === 401 || res.status === 403) {
    return new GatewayError(res.status, "The AI key was rejected. Check the GROQ_API_KEY configuration.");
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

/** POST to Groq's chat completions endpoint. */
export async function groqGenerate(
  model: string,
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const guard = withTimeoutSignal(signal, UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 1,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
      signal: guard.signal,
    });
    if (!res.ok) throw await toGatewayError(res);
    return await res.json();
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    if (guard.didTimeout()) {
      throw new GatewayError(504, "The AI took too long to respond. Please try again.");
    }
    throw err;
  } finally {
    guard.dispose();
  }
}

/** Extract the text content from a Groq chat completion response. */
export function groqText(data: unknown): string {
  const d = data as {
    choices?: { message?: { content?: string } }[];
  };
  const choices = d?.choices ?? [];
  if (!choices.length) return "";
  return choices[0]?.message?.content ?? "";
}

/** Parse a Groq structured-output response, or throw an honest 502. */
export function groqJson(data: unknown, unreadableMessage: string): Record<string, unknown> {
  const text = groqText(data);
  if (!text) throw new GatewayError(502, unreadableMessage);
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      throw new Error("not an object");
    return parsed as Record<string, unknown>;
  } catch {
    throw new GatewayError(502, unreadableMessage);
  }
}

/** POST to Groq's speech-to-text (Whisper) endpoint. */
export async function groqTranscribe(
  audioBytes: Uint8Array,
  apiKey: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const guard = withTimeoutSignal(signal, UPSTREAM_TIMEOUT_MS);
  try {
    const formData = new FormData();
    formData.append("file", new Blob([audioBytes] as any), "audio.wav");
    formData.append("model", GROQ_TRANSCRIBE_MODEL);
    formData.append("response_format", "verbose_json");
    formData.append("temperature", "0");
    // language omitted for auto-detect

    const res = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: guard.signal,
    });
    if (!res.ok) throw await toGatewayError(res);
    return await res.json();
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    if (guard.didTimeout()) {
      throw new GatewayError(504, "The AI took too long to respond. Please try again.");
    }
    throw err;
  } finally {
    guard.dispose();
  }
}