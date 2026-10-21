import { GatewayError, GROQ_TEXT_MODEL, groqGenerate, groqJson } from "./groq.server";

const feedbackSchema = {
  type: "object",
  properties: {
    meaning: { type: "number" },
    grammar: { type: "number" },
    naturalness: { type: "number" },
    verdict: { type: "string", enum: ["excellent", "good", "needs_work", "incorrect"] },
    explanation: { type: "string" },
    improved: { type: "string" },
  },
  required: ["meaning", "grammar", "naturalness", "verdict", "explanation"],
};

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
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const SYSTEM =
  "You are a demanding but encouraging English vocabulary tutor. Evaluate a learner's sentence using a target word. " +
  "Score meaning (is the word used with its correct sense?), grammar, and naturalness (would a fluent writer phrase it this way?) each 0-100. " +
  "If the target word (or an inflected form) is missing, meaning is 0 and verdict is incorrect. Trivial sentences that don't demonstrate meaning (e.g. 'X is a word') score low on meaning. " +
  "explanation: 1-2 short sentences, specific, addressed to 'you'. improved: one natural improved version that keeps the learner's idea, or null if the sentence is already excellent.";

export async function evaluateSentence(input: {
  word: string;
  pos: string;
  definition: string;
  sentence: string;
  apiKey: string;
}): Promise<SentenceFeedback> {
  type RawFeedback = {
    meaning?: unknown;
    grammar?: unknown;
    naturalness?: unknown;
    verdict?: unknown;
    explanation?: unknown;
    improved?: unknown;
  };
  let raw: RawFeedback;
  try {
    const response = await groqGenerate(
      GROQ_TEXT_MODEL,
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Target word: ${input.word} (${input.pos}) — ${input.definition}\nLearner's sentence: "${input.sentence}"`,
        },
      ],
      input.apiKey,
    );
    raw = groqJson(response, "The tutor's reply was unreadable. Please try again.") as RawFeedback;
  } catch (err) {
    if (err instanceof GatewayError) {
      throw new VocabAiError(
        err.status,
        err.status === 402
          ? "AI credits have run out. Add credits to your workspace to keep practising."
          : err.status === 429
            ? "The tutor is busy right now. Please wait a moment and try again."
            : "The tutor couldn't check your sentence. Please try again.",
      );
    }
    throw err;
  }

  const verdictRaw = String(raw.verdict ?? "");
  const verdict: SentenceFeedback["verdict"] =
    verdictRaw === "excellent" || verdictRaw === "good" || verdictRaw === "incorrect"
      ? verdictRaw
      : "needs_work";
  const meaning = clamp(Number(raw.meaning) || 0);
  const grammar = clamp(Number(raw.grammar) || 0);
  const naturalness = clamp(Number(raw.naturalness) || 0);
  return {
    meaning,
    grammar,
    naturalness,
    score: clamp(meaning * 0.5 + grammar * 0.25 + naturalness * 0.25),
    verdict,
    explanation: String(raw.explanation ?? ""),
    improved: typeof raw.improved === "string" && raw.improved.trim() ? raw.improved : null,
  };
}