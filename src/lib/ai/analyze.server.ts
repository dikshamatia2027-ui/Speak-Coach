import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { analyzeResponse, type Analysis, type MetricId } from "@/lib/speakcoach";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";
import { GatewayError } from "./transcribe.server";

const MODEL = "openai/gpt-6-astra";

const metric = z.object({ score: z.number(), detail: z.string() });
const schema = z.object({
  clarity: metric,
  pronunciation: metric,
  vocabulary: metric,
  delivery: metric,
  strengths: z.array(z.object({ title: z.string(), example: z.string() })),
  improvements: z.array(z.object({ title: z.string(), example: z.string(), fix: z.string() })),
  exercises: z.array(z.object({ title: z.string(), minutes: z.number(), how: z.string() })),
  summary: z.string(),
});

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Analysis step. Objective metrics (pace, filler words, word counts) are
 * measured in code from the transcript; the AI scores the qualitative
 * metrics and writes the coaching. Returns the same Analysis shape the UI uses.
 */
export async function analyzeTranscript(input: {
  transcript: string;
  durationSec: number;
  prompt: string;
  goal: string;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<Analysis> {
  const base = analyzeResponse(input.transcript, input.durationSec);
  const runId = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: input.apiKey,
    headers: { "Lovable-API-Key": input.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runId.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    output: Output.object({ schema }),
    ...(input.signal ? { abortSignal: input.signal } : {}),
    system:
      "You are an expert public speaking coach. Analyse a transcribed spoken answer. " +
      "Score clarity, pronunciation, vocabulary and delivery/confidence from 0-100 (be honest; 80+ means genuinely strong). " +
      "Pronunciation must be inferred from transcript cues (garbled or misheard words, self-corrections); say so briefly when evidence is thin. " +
      "Each metric detail is one short sentence. Give 2-3 strengths and 2-3 improvements; every example must quote the speaker's exact words in “curly quotes”. " +
      "Each improvement fix is one concrete instruction. Give exactly 3 exercises (2-8 minutes each) targeting the weakest areas. " +
      "Summary: 1-2 encouraging, specific sentences. Address the speaker as 'you'.",
    prompt: [
      `Goal: ${input.goal}`,
      `Scenario: ${input.prompt}`,
      `Duration: ${Math.round(input.durationSec)}s, ${base.wordCount} words, ${base.wordsPerMinute} wpm, ${base.fillerCount} filler words (${base.fillerWords.map((f) => `${f.word}×${f.count}`).join(", ") || "none"}).`,
      `Transcript:\n"""${input.transcript}"""`,
    ].join("\n"),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  let ai: z.infer<typeof schema>;
  try {
    ai = await result.output;
  } catch (err) {
    if (APICallError.isInstance(err)) {
      throw new GatewayError(err.statusCode ?? 502, extractMessage(err.responseBody) ?? "AI analysis failed.");
    }
    if (NoObjectGeneratedError.isInstance(err)) throw new GatewayError(502, "The AI coach returned an unreadable report. Please try again.");
    throw err;
  }

  const qualitative: Record<string, { score: number; detail: string }> = {
    clarity: ai.clarity,
    pronunciation: ai.pronunciation,
    vocabulary: ai.vocabulary,
    delivery: ai.delivery,
  };
  const metrics = base.metrics.map((m) => {
    const q = qualitative[m.id as MetricId];
    return q ? { ...m, score: clamp(q.score), detail: q.detail } : m;
  });
  return {
    ...base,
    metrics,
    overall: clamp(metrics.reduce((a, m) => a + m.score, 0) / metrics.length),
    strengths: ai.strengths.slice(0, 3),
    improvements: ai.improvements.slice(0, 3),
    exercises: ai.exercises.slice(0, 3).map((e) => ({ ...e, minutes: Math.max(1, Math.round(e.minutes)) })),
    summary: ai.summary,
  };
}

function extractMessage(body: string | undefined) {
  if (!body) return undefined;
  try {
    const j = JSON.parse(body) as { message?: string; error?: { message?: string } };
    return j.message ?? j.error?.message;
  } catch {
    return undefined;
  }
}
