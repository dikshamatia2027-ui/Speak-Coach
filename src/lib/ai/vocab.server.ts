import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

const schema = z.object({
  meaning: z.number(),
  grammar: z.number(),
  naturalness: z.number(),
  verdict: z.enum(["excellent", "good", "needs_work", "incorrect"]),
  explanation: z.string(),
  improved: z.string().nullable(),
});

export type SentenceFeedback = {
  score: number;
  meaning: number;
  grammar: number;
  naturalness: number;
  verdict: "excellent" | "good" | "needs_work" | "incorrect";
  explanation: string;
  improved: string | null;
};

export class VocabAiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export async function evaluateSentence(input: {
  word: string;
  pos: string;
  definition: string;
  sentence: string;
  apiKey: string;
}): Promise<SentenceFeedback> {
  const runId = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: input.apiKey,
    headers: { "Lovable-API-Key": input.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runId.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    output: Output.object({ schema }),
    system:
      "You are a demanding but encouraging English vocabulary tutor. Evaluate a learner's sentence using a target word. " +
      "Score meaning (is the word used with its correct sense?), grammar, and naturalness (would a fluent writer phrase it this way?) each 0-100. " +
      "If the target word (or an inflected form) is missing, meaning is 0 and verdict is incorrect. Trivial sentences that don't demonstrate meaning (e.g. 'X is a word') score low on meaning. " +
      "explanation: 1-2 short sentences, specific, addressed to 'you'. improved: one natural improved version that keeps the learner's idea, or null if the sentence is already excellent.",
    prompt: `Target word: ${input.word} (${input.pos}) — ${input.definition}\nLearner's sentence: """${input.sentence}"""`,
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
  try {
    const o = await result.output;
    const meaning = clamp(o.meaning);
    const grammar = clamp(o.grammar);
    const naturalness = clamp(o.naturalness);
    return {
      meaning,
      grammar,
      naturalness,
      score: clamp(meaning * 0.5 + grammar * 0.25 + naturalness * 0.25),
      verdict: o.verdict,
      explanation: o.explanation,
      improved: o.improved,
    };
  } catch (err) {
    if (APICallError.isInstance(err)) {
      const s = err.statusCode ?? 502;
      throw new VocabAiError(
        s,
        s === 402
          ? "AI credits have run out. Add credits to your workspace to keep practising."
          : s === 429
            ? "The tutor is busy right now. Please wait a moment and try again."
            : "The tutor couldn't check your sentence. Please try again.",
      );
    }
    if (NoObjectGeneratedError.isInstance(err)) throw new VocabAiError(502, "The tutor's reply was unreadable. Please try again.");
    throw err;
  }
}
