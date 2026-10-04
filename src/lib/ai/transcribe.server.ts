import { createParser } from "eventsource-parser";

const GATEWAY = "https://ai.gateway.lovable.dev";
const MODEL = "google/gemini-3.5-transcribe";
/** Gemini transcription caps files at 14 MB. */
export const MAX_AUDIO_BYTES = 13 * 1024 * 1024;

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Speech-to-text step: audio file in, full transcript out (streams SSE server-side). */
export async function transcribeAudio(file: File, apiKey: string, signal?: AbortSignal) {
  if (!file.size || file.size > MAX_AUDIO_BYTES) throw new GatewayError(400, "Recording is empty or too large.");
  const type = file.type.startsWith("audio/") ? file.type : "audio/wav";
  const form = new FormData();
  form.append("model", MODEL);
  form.append("file", new File([file], file.name || "recording.wav", { type }));
  form.append("response_format", "json");
  form.append("stream", "true");

  const res = await fetch(`${GATEWAY}/v1/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    ...(signal ? { signal } : {}),
  });
  if (!res.ok || !res.body) {
    throw new GatewayError(res.status, await safeMessage(res, "Transcription failed."));
  }

  let deltas = "";
  let final: string | null = null;
  let streamError: string | null = null;
  const parser = createParser({
    onEvent(ev) {
      if (!ev.data || ev.data === "[DONE]") return;
      try {
        const data = JSON.parse(ev.data) as { type?: string; delta?: string; text?: string; error?: { message?: string } };
        if (data.type === "transcript.text.delta" && data.delta) deltas += data.delta;
        else if (data.type === "transcript.text.done") final = data.text ?? deltas;
        else if (data.error || data.type === "error") streamError = data.error?.message ?? "Transcription failed.";
      } catch {
        /* ignore keep-alives */
      }
    },
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value, { stream: true }));
  }
  if (streamError) throw new GatewayError(502, streamError);
  if (final === null) throw new GatewayError(502, "Transcription ended before completing. Please try again.");
  return (final as string).trim();
}

export async function safeMessage(res: Response, fallback: string) {
  try {
    const text = await res.text();
    const j = JSON.parse(text) as { message?: string; error?: { message?: string } | string };
    return j.message ?? (typeof j.error === "string" ? j.error : j.error?.message) ?? fallback;
  } catch {
    return fallback;
  }
}
