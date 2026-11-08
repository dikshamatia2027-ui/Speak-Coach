import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GatewayError, GROQ_TEXT_MODEL, groqGenerate, groqJson } from "@/lib/ai/groq.server";
import { allowRequest, clientIp } from "@/lib/rate-limit.server";
import { userFromRequest } from "@/lib/supabase.server";

const scenarioSchema = z.object({
  prompt: z.string().min(5).max(300),
  context: z.string().min(10).max(500),
  seconds: z.coerce.number().min(30).max(180),
  goal: z.enum(["interview", "presentation", "meeting", "sales", "confidence"]),
});

const SYSTEM = `You are an expert speaking coach designing practice scenarios.
The user describes a situation they want to practice. Generate ONE realistic speaking scenario.

Rules:
- prompt: the exact question or instruction the speaker should answer (10-40 words, in quotes as if someone is saying it)
- context: a 1-2 sentence description of the setting and stakes
- seconds: how long the ideal response should take (30-180)
- goal: which category this fits (interview, presentation, meeting, sales, or confidence)

Reply with one json object: {"prompt":"...","context":"...","seconds":60,"goal":"interview"}`;

export const Route = createFileRoute("/api/generate-scenario")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["GROQ_API_KEY"];
        if (!apiKey) return json({ error: "AI is not configured." }, 500);

        if (!allowRequest(`scenario:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
          return json({ error: "Too many scenario requests. Please try again later." }, 429);
        }

        const authed = await userFromRequest(request);
        if (!authed) return json({ error: "Please sign in first." }, 401);

        try {
          const body = await request.json();
          const userPrompt = String(body?.prompt ?? "").trim().slice(0, 500);
          if (userPrompt.length < 5) {
            return json({ error: "Please describe the situation in more detail." }, 400);
          }

          const messages = [
            { role: "system", content: SYSTEM },
            { role: "user", content: `Create a practice scenario for this situation: "${userPrompt}"` },
          ];

          const raw = await groqGenerate(GROQ_TEXT_MODEL, messages, apiKey, request.signal, 0.6);
          const parsed = scenarioSchema.safeParse(groqJson(raw, "Could not generate scenario."));

          if (!parsed.success) {
            return json({ error: "The AI returned an invalid scenario. Please try again." }, 502);
          }

          const scenario = {
            id: `custom-${Date.now()}`,
            ...parsed.data,
            tier: "free" as const,
            badge: "Custom",
            isCustom: true,
            sampleTranscript: "",
          };

          return json({ ok: true, scenario }, 200);
        } catch (err) {
          if (err instanceof GatewayError) {
            return json({ error: err.message }, err.status);
          }
          console.error("generate-scenario error:", err);
          return json({ error: "Failed to generate scenario." }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}
