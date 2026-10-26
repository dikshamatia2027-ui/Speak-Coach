import { z } from "zod";
import { analyzeResponse, type Analysis, type MetricId } from "@/lib/speakcoach";
import { GatewayError, GROQ_VERSA_MODEL, groqGenerate, groqJson } from "./groq.server";

const metric = z.object({ score: z.coerce.number(), detail: z.string() });
const schema = z.object({
  clarity: metric,
  pronunciation: metric,
  vocabulary: metric,
  delivery: metric,
  relevance: metric,
  strengths: z.array(z.object({ title: z.string(), example: z.string() })),
  improvements: z.array(z.object({ title: z.string(), example: z.string(), fix: z.string() })),
  exercises: z.array(z.object({ title: z.string(), minutes: z.coerce.number(), how: z.string() })),
  summary: z.string(),
});

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

type AiReport = z.infer<typeof schema>;

/**
 * The overall score can never be higher than the answer deserves. Saying something is not the same as answering:
 * an off-topic or very short answer is capped no matter how clean the voice was.
 */
export function finalOverall(average: number, relevance: number, wordCount: number): number {
  let cap = 100;
  if (relevance < 25) cap = 35;
  else if (relevance < 45) cap = 50;
  else if (relevance < 60) cap = 70;
  if (wordCount < 20) cap = Math.min(cap, 45);
  else if (wordCount < 40) cap = Math.min(cap, 65);
  return clamp(Math.min(average, cap));
}

const filled = (t: string) => t.trim().length > 3;

/** True if the model really did the work, and did not just echo the empty answer format back. */
export function isUsable(ai: AiReport): boolean {
  const scores = [ai.clarity.score, ai.pronunciation.score, ai.vocabulary.score, ai.delivery.score, ai.relevance.score];
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
  "RELEVANCE comes first. Before scoring anything else, decide whether the speaker actually answered the scenario they were given. " +
  "Score relevance 0-100: 0-20 means off topic, random talk, only introducing themselves, repeating the question, or filler; " +
  "21-45 means it touches the topic but never really answers it; 46-70 means a partial answer with gaps; 71-100 means a direct, on-topic answer. " +
  "Be strict. Saying something is not the same as answering. If relevance is below 50, say so plainly in the summary, in the first improvement, " +
  "and make the exercises about answering the actual question. A clear voice does not rescue an answer that skips the question.\n\n" +
  "SCORING (0-100, whole numbers): clarity, pronunciation, vocabulary, delivery (delivery includes confidence). " +
  "If relevance is below 50, clarity and delivery cannot be above 55. " +
  "Calibrate honestly: a typical short, unrehearsed answer lands 50-75; 80+ means genuinely strong; below 40 only for serious problems. " +
  "Pronunciation can only be inferred from the transcript (misheard or garbled words, self-corrections). If there are no such cues, " +
  "score it 70-80 and say in the detail that this is an estimate from text. Judge delivery from hedging ('I think', 'kind of'), " +
  "trailing off, whether the thought was finished, and how the answer ends.\n\n" +
  "WRITING RULES:\n" +
  "- Each metric detail (including relevance): 2 sentences. First what you noticed, with a short exact quote. Then why it matters for this scenario.\n" +
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
  '"relevance":{"score":<0-100>,"detail":"<2 sentences: did they answer the scenario, with a quote>"},' +
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
  const relevance = clamp(ai.relevance.score);
  const allMetrics = [...metrics, { id: "relevance" as MetricId, label: "Relevance", score: relevance, detail: ai.relevance.detail }];
  const average = allMetrics.reduce((a, m) => a + m.score, 0) / allMetrics.length;
  return {
    ...base,
    metrics: allMetrics,
    overall: finalOverall(average, relevance, base.wordCount),
    strengths: ai.strengths.filter((x) => filled(x.title)).slice(0, 3),
    improvements: ai.improvements.filter((x) => filled(x.title)).slice(0, 3),
    exercises: ai.exercises.filter((x) => filled(x.title)).slice(0, 3).map((e) => ({ ...e, minutes: Math.max(1, Math.round(e.minutes)) })),
    summary: ai.summary,
  };
}
