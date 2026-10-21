import { createFileRoute } from "@tanstack/react-router";
import { analyzeTranscript } from "@/lib/ai/analyze.server";
import { GatewayError, MAX_AUDIO_BYTES, transcribeAudio } from "@/lib/ai/transcribe.server";
import { allowRequest, clientIp } from "@/lib/rate-limit.server";

/**
 * POST multipart: audio (file), durationSec, prompt, goal.
 * Pipeline: audio → speech-to-text → AI analysis → { transcript, analysis }.
 * The API key never leaves the server.
 */
export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["GROQ_API_KEY"];
        if (!apiKey) return json({ error: "AI is not configured." }, 500);
        // Best-effort cap per visitor so a loop cannot burn the AI quota (see rate-limit.server.ts).
        if (!allowRequest(`analyze:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
          return json({ error: "You've reached the hourly practice limit. Please try again a bit later." }, 429);
        }
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_AUDIO_BYTES + 64 * 1024) return json({ error: "Recording is too long." }, 413);

        try {
          const form = await request.formData();
          const audio = form.get("audio");
          const durationSec = Math.min(Math.max(Number(form.get("durationSec")) || 0, 1), 900);
          const prompt = String(form.get("prompt") ?? "").slice(0, 500);
          const goal = String(form.get("goal") ?? "confidence").slice(0, 40);
          if (!(audio instanceof File) || audio.size < 2048) {
            return json({ error: "We couldn't hear anything. Please record again." }, 400);
          }

          const transcript = await transcribeAudio(audio, apiKey, request.signal);
          if (transcript.split(/\s+/).filter(Boolean).length < 8) {
            return json({ error: "We couldn't make out enough speech. Try again a little closer to the mic." }, 422);
          }
          const analysis = await analyzeTranscript({ transcript, durationSec, prompt, goal, apiKey, signal: request.signal });
          return json({ transcript, analysis }, 200);
        } catch (err) {
          if (request.signal.aborted) return json({ error: "Cancelled" }, 499);
          if (err instanceof GatewayError) {
            const msg =
              err.status === 402
                ? "AI credits have run out. Add credits to your workspace to keep analysing."
                : err.status === 429
                  ? "The coach is busy right now. Please wait a moment and try again."
                  : err.message;
            return json({ error: msg }, err.status);
          }
          console.error(err);
          return json({ error: "Analysis failed. Please try again." }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}
