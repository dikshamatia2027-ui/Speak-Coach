import { analyzeResponse, type Analysis, type MetricId } from "@/lib/speakcoach";
import { GatewayError, GROQ_TEXT_MODEL, groqGenerate, groqJson } from "./groq.server";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** JSON Schema for the coaching report (structured output on llama-3.1-8b-instant). */
const metricSchema = {
  type: "object",
  properties: { score: { type: "number" }, detail: { type: "string" } },
  required: ["score", "detail"],
};

const analysisSchema = {
  type: "object",
  properties: {
    clarity: metricSchema,
    pronunciation: metricSchema,
    vocabulary: metricSchema,
    delivery: metricSchema,
    strengths: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, example: { type: "string" } },
        required: ["title", "example"],
      },
    },
    improvements: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, example: { type: "string" }, fix: { type: "string" } },
        required: ["title", "example", "fix"],
      },
    },
    exercises: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, minutes: { type: "number" }, how: { type: "string" } },
        required: ["title", "minutes", "how"],
      },
    },
    summary: { type: "string" },
  },
  required: ["clarity", "pronunciation", "vocabulary", "delivery", "strengths", "improvements", "exercises", "summary"],
};

const SYSTEM =
  "You are an expert public speaking coach. Analyse a transcribed spoken answer. " +
  "Score clarity, pronunciation, vocabulary and delivery/confidence from 0-100 (be honest; 80+ means genuinely strong). " +
  "Pronunciation must be inferred from transcript cues (garbled or misheard words, self-corrections); say so briefly when evidence is thin. " +
  "Each metric detail is one short sentence. Give 2-3 strengths and 2-3 improvements; every example must quote the speaker's exact words in curlyquotes. " +
  "Each improvement fix is one concrete instruction. Give exactly 3 exercises (2-8 minutes each) targeting the weakest areas. " +
  "Summary: 1-2 encouraging, specific sentences. Address the speaker as 'you'.";

/** Analysis step. Objective metrics (pace, filler words, word counts) are
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

  // Groq chat format: messages array with role/content, no contents/systemInstruction
  const response = await groqGenerate(
    GROQ_TEXT_MODEL,
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          `Goal: ${input.goal}`,
          `Scenario: ${input.prompt}`,
          `Duration: ${Math.round(input.durationSec)}s, ${base.wordCount} words, ${base.wordsPerMinute} wpm, ${base.fillerCount} filler words (${base.fillerWords.map((f) => `${f.word}×${f.count}`).join(", ") || "none"}).`,
          `Transcript:\n\"\"\"${input.transcript}\"\"\"`,
        ].join("\n"),
      },
    ],
    input.apiKey,
    input.signal,
  );

  type RawMetric = { score?: unknown; detail?: unknown };
  type RawReport = {
    clarity?: RawMetric;
    pronunciation?: RawMetric;
    vocabulary?: RawMetric;
    delivery?: RawMetric;
    strengths?: unknown;
    improvements?: unknown;
    exercises?: unknown;
    summary?: unknown;
  };
  const ai = groqJson(response, "The AI coach returned an unreadable report. Please try again.") as RawReport;

  // Structured output is a strong hint, not a type system — coerce defensively.
  const asMetric = (v: RawMetric | undefined) => {
    const m = v ?? {};
    return { score: clamp(Number(m.score) || 0), detail: String(m.detail ?? "") };
  };
  const toList = <T>(v: unknown, map: (item: Record<string, unknown>) => T): T[] =>
    (Array.isArray(v) ? v : [])
      .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
      .map(map);

  const qualitative: Record<string, { score: number; detail: string }> = {
    clarity: asMetric(ai.clarity),
    pronunciation: asMetric(ai.pronunciation),
    vocabulary: asMetric(ai.vocabulary),
    delivery: asMetric(ai.delivery),
  };
  const metrics = base.metrics.map((m) => {
    const q = qualitative[m.id as MetricId];
    return q ? { ...m, score: clamp(q.score), detail: q.detail } : m;
  });

  const strengths = toList<{ title: string; example: string }>(ai.strengths, (s) => ({
    title: String(s["title"] ?? ""),
    example: String(s["example"] ?? ""),
  }));
  const improvements = toList<{ title: string; example: string; fix: string }>(ai.improvements, (s) => ({
    title: String(s["title"] ?? ""),
    example: String(s["example"] ?? ""),
    fix: String(s["fix"] ?? ""),
  }));
  const exercises = toList<{ title: string; minutes: number; how: string }>(ai.exercises, (s) => ({
    title: String(s["title"] ?? ""),
    minutes: Math.max(1, Math.round(Number(s["minutes"]) || 1)),
    how: String(s["how"] ?? ""),
  }));

  return {
    ...base,
    metrics,
    overall: clamp(metrics.reduce((a, m) => a + m.score, 0) / metrics.length),
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    exercises: exercises.slice(0, 3),
    summary: String(ai.summary ?? base.summary),
  };
}