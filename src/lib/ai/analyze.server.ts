import { z } from "zod";
import { analyzeResponse, type Analysis, type MetricId } from "@/lib/speakcoach";
import { GatewayError, GROQ_VERSA_MODEL, groqGenerate, groqJson } from "./groq.server";

const metric = z.object({ score: z.coerce.number(), detail: z.string() });
const schema = z.object({
  clarity: metric,
  pronunciation: metric,
  vocabulary: metric,
  delivery: metric,
  strengths: z.array(z.object({ title: z.string(), example: z.string() })),
  improvements: z.array(z.object({ title: z.string(), example: z.string(), fix: z.string() })),
  exercises: z.array(z.object({ title: z.string(), minutes: z.coerce.number(), how: z.string() })),
  summary: z.string(),
});

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

type AiReport = z.infer<typeof schema>;

const filled = (t: string) => t.trim().length > 3;

/** True if the model really did the work, and did not just echo the empty answer format back. */
function isUsable(ai: AiReport): boolean {
  const scores = [ai.clarity.score, ai.pronunciation.score, ai.vocabulary.score, ai.delivery.score];
  if (scores.every((s) => s <= 0)) return false;
  return (
    filled(ai.summary) &&
    ai.strengths.some((x) => filled(x.title) && filled(x.example)) &&
    ai.improvements.some((x) => filled(x.title) && filled(x.fix)) &&
    ai.exercises.some((x) => filled(x.title) && filled(x.how))
  );
}

const SYSTEM_PROMPT =
  "You are an expert, honest public speaking coach. You are coaching one specific person on one specific scenario, " +
  "using the transcript of what they actually said. Everything you write must be about THEIR words and THEIR scenario. " +
  "Generic advice that could apply to anyone is a failure.\n\n" +
  "SCORING (0-100, whole numbers): clarity, pronunciation, vocabulary, delivery (delivery includes confidence). " +
  "Calibrate honestly: a typical short, unrehearsed answer lands 50-75; 80+ means genuinely strong; below 40 only for serious problems. " +
  "Pronunciation can only be inferred from the transcript (misheard or garbled words, self-corrections). If there are no such cues, " +
  "score it 70-80 and say in the detail that this is an estimate from text. Judge delivery from hedging ('I think', 'kind of'), " +
  "trailing off, whether the thought was finished, and how the answer ends.\n\n" +
  "WRITING RULES:\n" +
  "- Each metric detail: 2 sentences. First what you noticed, with a short exact quote. Then why it matters for this scenario.\n" +
  "- strengths: exactly 3. title is under 8 words. example is an exact quote in curly quotes plus one sentence on why it works here.\n" +
  "- improvements: exactly 3, most important first. title is under 8 words. example is an exact quote. " +
  "fix says what to change and ends with 'Try saying: “...”' giving a rewritten version of that exact line.\n" +
  "- exercises: exactly 3, each aimed at a specific weakness you found, 2-8 minutes, 'how' is 2-3 concrete steps that use the speaker's own content.\n" +
  "- summary: 3-4 sentences. Say how well this works for the scenario, the biggest win, the single most important fix, " +
  "and a concrete target for the next attempt (for example a pace, a structure or a line to rewrite).\n" +
  "- Quotes must be copied exactly from the transcript. Never invent anything the speaker did not say. " +
  "If the transcript is very short, say so plainly in the summary and score accordingly.\n" +
  "- Address the speaker as 'you'. Use their first name at most once, in the summary, if it is given.\n\n" +
  "OUTPUT: reply with one single json object and nothing else. Use exactly these keys. Every <...> below describes what to put there; " +
  "replace each one with your own real content, never copy it:\n" +
  '{"clarity":{"score":<0-100>,"detail":"<2 sentences>"},"pronunciation":{"score":<0-100>,"detail":"<2 sentences>"},' +
  '"vocabulary":{"score":<0-100>,"detail":"<2 sentences>"},"delivery":{"score":<0-100>,"detail":"<2 sentences>"},' +
  '"strengths":[{"title":"<short>","example":"<quote and why it works>"},{...},{...}],' +
  '"improvements":[{"title":"<short>","example":"<exact quote>","fix":"<change and Try saying: ...>"},{...},{...}],' +
  '"exercises":[{"title":"<short>","minutes":<2-8>,"how":"<2-3 steps>"},{...},{...}],' +
  '"summary":"<3-4 sentences>"}';

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
  speakerName?: string;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<Analysis> {
  const base = analyzeResponse(input.transcript, input.durationSec);
  const user = [
    input.speakerName ? `Speaker's first name: ${input.speakerName}` : "",
    `Speaker's goal: ${input.goal}`,
    `Scenario they were answering: ${input.prompt}`,
    `Measured facts: ${Math.round(input.durationSec)} seconds, ${base.wordCount} words, ${base.wordsPerMinute} words per minute, ` +
      `${base.fillerCount} filler words (${base.fillerWords.map((f) => `${f.word}×${f.count}`).join(", ") || "none"}).`,
    `Transcript of what they said:\n"""${input.transcript}"""`,
  ]
    .filter(Boolean)
    .join("\n");

  const unreadable = "The AI coach returned an unreadable report. Please try again.";
  let ai: AiReport | null = null;
  for (let attempt = 0; attempt < 2 && !ai; attempt++) {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
      ...(attempt > 0
        ? [{ role: "user", content: "Your last reply had empty or placeholder fields. Write the full report again with real content in every field, as one json object." }]
        : []),
    ];
    const raw = await groqGenerate(GROQ_VERSA_MODEL, messages, input.apiKey, input.signal, attempt === 0 ? 0.5 : 0.3);
    const parsed = schema.safeParse(groqJson(raw, unreadable));
    if (parsed.success && isUsable(parsed.data)) ai = parsed.data;
  }
  if (!ai) throw new GatewayError(502, unreadable);

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
    strengths: ai.strengths.filter((x) => filled(x.title)).slice(0, 3),
    improvements: ai.improvements.filter((x) => filled(x.title)).slice(0, 3),
    exercises: ai.exercises.filter((x) => filled(x.title)).slice(0, 3).map((e) => ({ ...e, minutes: Math.max(1, Math.round(e.minutes)) })),
    summary: ai.summary,
  };
}
