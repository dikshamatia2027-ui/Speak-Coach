import { createFileRoute } from "@tanstack/react-router";
import { analyzeTranscript } from "@/lib/ai/analyze.server";
import { GatewayError, MAX_AUDIO_BYTES, transcribeAudio } from "@/lib/ai/transcribe.server";
import { takeAiQuota } from "@/lib/ai-quota.server";
import { parseWav, readBodyCapped, resolveScenario } from "@/lib/ai/analyze-input.server";
import { MAX_RECORDING_SECONDS } from "@/lib/record-wav";
import { allowRequest, clientIp } from "@/lib/rate-limit.server";
import { FREE_WEEKLY_LIMIT } from "@/lib/speakcoach";
import { getPlan, releaseAnalysis, reserveAnalysis, userFromRequest } from "@/lib/supabase.server";

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
        // Loose flood guard per network, so people sharing Wi-Fi are not blocked by each other.
        if (!allowRequest(`analyze:${clientIp(request)}`, 60, 60 * 60 * 1000)) {
          return json({ error: "Too many requests from this network. Please try again a bit later." }, 429);
        }
        const authed = await userFromRequest(request);
        if (!authed) return json({ error: "Please sign in to practise." }, 401);
        const { user, admin } = authed;
        // The real cap is per account and shared across servers, so a loop cannot burn the AI quota.
        if (!(await takeAiQuota(admin, user.id, "analyze"))) {
          return json({ error: "You've reached the hourly practice limit. Please try again a bit later." }, 429);
        }
        const plan = await getPlan(admin, user.id);
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_AUDIO_BYTES + 64 * 1024) return json({ error: "Recording is too long." }, 413);

        let reservationId: string | null = null;
        let succeeded = false;
        try {
          // Count the bytes actually received; Content-Length can be missing or wrong.
          const body = await readBodyCapped(request, MAX_AUDIO_BYTES + 64 * 1024);
          if (!body) return json({ error: "Recording is too long." }, 413);
          const form = await new Response(body, {
            headers: { "content-type": request.headers.get("content-type") ?? "" },
          }).formData();
          const audio = form.get("audio");
          if (!(audio instanceof File) || audio.size < 2048) {
            return json({ error: "We couldn't hear anything. Please record again." }, 400);
          }
          // Only the WAV files our recorder makes are accepted, and the length comes from the audio itself.
          const wav = parseWav(new Uint8Array(await audio.arrayBuffer()));
          if (!wav) return json({ error: "We couldn't read that recording. Please record again." }, 415);
          if (wav.durationSec > MAX_RECORDING_SECONDS + 5) return json({ error: "Recording is too long." }, 413);
          const durationSec = Math.max(1, Math.round(wav.durationSec));

          // Built-in scenarios use the server's own question and goal; Pro-only ones need Pro.
          const scenario = resolveScenario({
            scenarioId: String(form.get("scenarioId") ?? ""),
            prompt: String(form.get("prompt") ?? ""),
            goal: String(form.get("goal") ?? ""),
            plan,
          });
          if (!scenario.ok) return json({ error: scenario.error }, scenario.status);
          const { prompt, goal } = scenario;

          // Reserve before any AI call. Only the server can write this table.
          const reservation = await reserveAnalysis(admin, user.id, plan === "pro" ? null : FREE_WEEKLY_LIMIT);
          if (!reservation.ok) {
            return reservation.reason === "limit"
              ? json({ error: `You've used your ${FREE_WEEKLY_LIMIT} free sessions this week. Upgrade to Pro for unlimited practice.` }, 429)
              : json({ error: "We couldn't start your analysis. Please try again in a moment." }, 503);
          }
          reservationId = reservation.id;

          const transcript = await transcribeAudio(audio, apiKey, request.signal);
          if (transcript.split(/\s+/).filter(Boolean).length < 8) {
            return json({ error: "We couldn't make out enough speech. Try again a little closer to the mic." }, 422);
          }
          const fullName = String(user.user_metadata?.["full_name"] ?? "").trim();
          const speakerName = fullName.split(/\s+/)[0] ?? "";
          const analysis = await analyzeTranscript({
            transcript,
            durationSec,
            prompt,
            goal,
            apiKey,
            ...(speakerName ? { speakerName } : {}),
            signal: request.signal,
          });
          succeeded = true;
          return json({ transcript, analysis, durationSec }, 200);
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
        } finally {
          // Count only sessions that produced a report.
          if (reservationId && !succeeded) await releaseAnalysis(admin, reservationId);
        }
      },
    },
  },
});

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}
