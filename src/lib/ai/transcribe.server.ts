import { GatewayError, GROQ_TRANSCRIBE_MODEL, groqTranscribe } from "./groq.server";

/** Upload guard. Recordings are capped at 180s (≈6 MB WAV @ 16 kHz mono), and
 * inline base64 stays comfortably under Groq's request-size limits.
 */
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

/** Speech-to-text step: audio file in, verbatim transcript out.
 * 
 * Uses Groq's Whisper model (whisper-large-v3) via the audio transcriptions endpoint.
 * VERBATIM is the default mode: it preserves filler words ("um", "uh",
 * "like", "you know"), repetitions and false starts exactly as spoken — which
 * the filler-word counter in the domain layer depends on. SMART mode (which
 * strips disfluencies) is deliberately not enabled.
 */
/** Transcribe audio from a File using Groq's Whisper model. */
export async function transcribeAudio(file: File, apiKey: string, signal?: AbortSignal) {
  if (!file.size || file.size > MAX_AUDIO_BYTES) throw new GatewayError(400, "Recording is empty or too large.");

  const type = file.type.startsWith("audio/") ? file.type : "audio/wav";

  const bytes = new Uint8Array(await file.arrayBuffer());

  // Groq Whisper expects a FormData with the audio file
  const formData = new FormData();
  formData.append("file", new Blob([bytes]), "audio.wav");
  formData.append("model", GROQ_TRANSCRIBE_MODEL);
  // language omitted for auto-detection

  const response = await groqTranscribe(bytes, apiKey, signal);

  // Extract text from the Groq Whisper response
  let transcript = "";
  try {
    const data = response as {
      text?: string;
      language?: string;
      segments?: Array<{ id: number; start: number; end: number; text: string }>;
      // fallback: any string-valued property
      [key: string]: unknown;
    };
    if (data.text) {
      transcript = data.text;
    } else if (data.segments && data.segments.length > 0) {
      transcript = data.segments.map((s) => s.text).join(" ");
    } else {
      // Fallback: iterate known keys
      const possibleKeys = ["text", "transcript", "result", "response"];
      for (const key of possibleKeys) {
        if (key in data && typeof (data as any)[key] === "string") {
          transcript = (data as any)[key];
          break;
        }
      }
    }
  } catch {
    // ignore
  }

  if (!transcript) throw new GatewayError(502, "Transcription ended before completing. Please try again.");
  return transcript.trim();
}

/** Extract a human message from an error body. Kept for interface compatibility. */
export async function safeMessage(res: Response, fallback: string) {
  try {
    const text = await res.text();
    const j = JSON.parse(text) as { message?: string; error?: { message?: string } | string };
    return j.message ?? (typeof j.error === "string" ? j.error : j.error?.message) ?? fallback;
  } catch {
    return fallback;
  }
}
export { GatewayError }
