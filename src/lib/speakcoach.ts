/**
 * SpeakCoach domain layer.
 *
 * All data lives here behind a tiny store so real APIs (speech-to-text,
 * AI analysis, auth + database) can replace the mock implementations
 * without touching any screen. Swap points are marked with `TODO(api)`.
 */

export type GoalId = "interview" | "presentation" | "meeting" | "sales" | "confidence";

export type Goal = {
  id: GoalId;
  label: string;
  blurb: string;
  emoji: string;
};

export const GOALS: Goal[] = [
  {
    id: "interview",
    label: "Job interview",
    blurb: "Answer tough questions with structure and calm.",
    emoji: "💼",
  },
  {
    id: "presentation",
    label: "Presentation",
    blurb: "Open strong, hold attention, land the message.",
    emoji: "🎤",
  },
  {
    id: "meeting",
    label: "Meetings",
    blurb: "Speak up concisely when it matters.",
    emoji: "🗂️",
  },
  {
    id: "sales",
    label: "Sales pitch",
    blurb: "Persuade without sounding scripted.",
    emoji: "📈",
  },
  {
    id: "confidence",
    label: "General confidence",
    blurb: "Sound relaxed, clear and sure of yourself.",
    emoji: "✨",
  },
];

export type ScenarioTier = "free" | "pro";

export type Scenario = {
  id: string;
  goal: GoalId;
  prompt: string;
  context: string;
  seconds: number;
  tier?: ScenarioTier;
  badge?: string;
  isCustom?: boolean;
  /** Used when live transcription is unavailable. TODO(api): remove with real STT. */
  sampleTranscript: string;
};

export const FREE_WEEKLY_LIMIT = 3;

export const SCENARIOS: Scenario[] = [
  // --- Standard / Free Scenarios ---
  {
    id: "int-1",
    goal: "interview",
    prompt: "Tell me about yourself.",
    context: "Final-round interview. The hiring manager opens with the classic question.",
    seconds: 90,
    tier: "free",
    sampleTranscript:
      "So, um, I guess I'd say I'm a product designer with about six years of experience, and, you know, I've mostly worked on data-heavy tools. I started at a small agency where I basically did a bit of everything, and then I moved into a fintech company where I led the redesign of our onboarding flow, which, um, cut drop-off by around thirty percent. I really like problems where the interface has to make something complicated feel obvious. Outside of work I actually run a small newsletter about design systems, which kind of keeps me sharp. And yeah, I'm looking for a role where I can own a product area end to end.",
  },
  {
    id: "int-2",
    goal: "interview",
    prompt: "Describe a time you failed and what you learned.",
    context: "The interviewer wants honesty plus a clear lesson, in under two minutes.",
    seconds: 100,
    tier: "free",
    sampleTranscript:
      "Yeah, so, one that comes to mind, um, we shipped a pricing page redesign without testing it on mobile properly. Basically conversion dropped like eighteen percent in the first week and I, you know, I hadn't pushed for a staged rollout. I owned it in the retro, we rolled back within two days, and after that I made staged rollouts a default for anything touching revenue. The lesson for me was that being fast is only useful if you can also be reversible.",
  },
  // --- Specialized / Pro Scenarios for Interview ---
  {
    id: "int-pro-1",
    goal: "interview",
    prompt: "Executive Leadership: Defend a controversial architectural rewrite.",
    context: "CTO & VP Engineering grilling your decision to pause roadmap features for tech debt.",
    seconds: 120,
    tier: "pro",
    badge: "Specialized",
    sampleTranscript:
      "I appreciate the concern about near-term feature delivery. However, our incident rate doubled over the last two quarters, costing us fifteen hours of customer-facing downtime. Pausing non-critical features for six weeks allows us to decouple the core checkout monolith into resilient services, cutting our p99 latency by half and preventing cascading failovers. In the long run, this enables faster iteration and protects enterprise ARR.",
  },
  {
    id: "int-pro-2",
    goal: "interview",
    prompt: "Salary & Compensation Negotiation: Counter a below-band offer.",
    context: "Recruiter phone screen. You bring high leverage and want a 15% bump plus equity match.",
    seconds: 90,
    tier: "pro",
    badge: "Specialized",
    sampleTranscript:
      "Thank you for extending the offer—I'm genuinely excited about the team and the roadmap. Given the scope of leading the cross-functional infrastructure team and my background scaling similar distributed systems, I was targeting a base closer to one hundred and ninety thousand, alongside competitive equity. If we can bridge that gap, I'm prepared to sign today.",
  },

  // --- Presentation Scenarios ---
  {
    id: "pres-1",
    goal: "presentation",
    prompt: "Open a 10-minute talk about a project you are proud of.",
    context: "A 60-person internal all-hands. You get the first 60 seconds to hook them.",
    seconds: 75,
    tier: "free",
    sampleTranscript:
      "Alright, so, um, today I want to talk about the search rebuild. Last year, basically, our users were, you know, abandoning search about half the time, which is kind of a huge number when search is how people find everything. So we spent a quarter rebuilding the ranking, and I want to walk you through what we learned, um, because I think a lot of it applies to other teams too.",
  },
  {
    id: "pres-2",
    goal: "presentation",
    prompt: "Explain your work to someone outside your field in one minute.",
    context: "A cross-department showcase. No jargon allowed.",
    seconds: 60,
    tier: "free",
    sampleTranscript:
      "So basically I work on the part of the app that decides what you see first. Um, imagine a shop where the shelves rearrange themselves depending on who walks in, right? That's kind of what we do, and, you know, the tricky part is doing it fast enough that nobody notices it happening.",
  },
  // --- Specialized / Pro Presentation Scenarios ---
  {
    id: "pres-pro-1",
    goal: "presentation",
    prompt: "Keynote / Town Hall: Deliver a crisis turnaround vision.",
    context: "Company-wide town hall after missing quarterly growth targets.",
    seconds: 120,
    tier: "pro",
    badge: "Specialized",
    sampleTranscript:
      "I want to address the numbers directly. We missed our target by twelve percent this quarter, and that falls on leadership. But rather than chasing vanity metrics, we are consolidating our focus onto three high-margin enterprise products. We have already streamlined operational burn and improved retention among top cohorts. Here is our exact three-step plan to return to profitability by Q4.",
  },
  {
    id: "pres-pro-2",
    goal: "presentation",
    prompt: "TED-Style Opening: Deliver a memorable hook with personal vulnerability.",
    context: "Industry conference stage with 500 attendees. Capture the audience in 60 seconds.",
    seconds: 75,
    tier: "pro",
    badge: "Specialized",
    sampleTranscript:
      "Three years ago, I stood on a train platform convinced that my entire startup was a failure. We had eighty dollars left in the bank and six weeks of payroll due. But the decision we made on that very platform didn't just save the company—it reshaped how four thousand teams collaborate every single day.",
  },

  // --- Meeting Scenarios ---
  {
    id: "meet-1",
    goal: "meeting",
    prompt: "Disagree with a decision your team just made, respectfully.",
    context: "Weekly planning. You have 45 seconds before the topic closes.",
    seconds: 60,
    tier: "free",
    sampleTranscript:
      "Can I, um, push back slightly on that? I think the timeline works but I'm a bit worried we're committing before we've seen the migration data. Maybe, you know, we could take two days to validate, and if it holds up we keep the same ship date. I just don't want us to find out in week three.",
  },
  // --- Specialized / Pro Meeting Scenarios ---
  {
    id: "meet-pro-1",
    goal: "meeting",
    prompt: "Boardroom Alignment: Handle an aggressive hostile stakeholder interruption.",
    context: "High-stakes stakeholder meeting where a partner challenges your project budget.",
    seconds: 90,
    tier: "pro",
    badge: "Specialized",
    sampleTranscript:
      "That is a fair question regarding the capital allocation. Let me clarify why the upfront investment in automated testing infrastructure directly reduces our quarterly bug triage expenses by forty percent. Let us review slide four together to inspect the exact ROI breakdown.",
  },

  // --- Sales Scenarios ---
  {
    id: "sales-1",
    goal: "sales",
    prompt: "Pitch your product to a skeptical buyer in 60 seconds.",
    context: "A cold discovery call. The buyer already uses a competitor.",
    seconds: 70,
    tier: "free",
    sampleTranscript:
      "Sure, so, um, most teams we talk to are already using something, right, and the thing they complain about is that reporting takes three days to arrive. What we do differently is, basically, everything is live, so your team sees the number the moment it changes. Customers like Northwind cut their reporting cycle from three days to, um, about twenty minutes. I'd love to just show you it on your own data for fifteen minutes.",
  },
  // --- Specialized / Pro Sales Scenarios ---
  {
    id: "sales-pro-1",
    goal: "sales",
    prompt: "Enterprise Closing: Reframe a 40% price objection during procurement.",
    context: "CFO procurement gatekeeper pushing for massive discount before quarter end.",
    seconds: 90,
    tier: "pro",
    badge: "Specialized",
    sampleTranscript:
      "I understand budget constraints are top of mind. When comparing unit cost, remember our platform eliminates the need for two separate third-party analytics add-ons, saving your team over fifty thousand dollars annually. When factoring in implementation speed and security compliance, this package delivers net-positive return by month two.",
  },

  // --- Confidence Scenarios ---
  {
    id: "conf-1",
    goal: "confidence",
    prompt: "Introduce yourself to a room of strangers at an event.",
    context: "A networking evening. Warm, short, memorable.",
    seconds: 45,
    tier: "free",
    sampleTranscript:
      "Hi, um, I'm Alex, I work on, you know, making complicated software feel simple, mostly for finance teams. I'm here because I'm kind of obsessed with how people learn new tools, and, yeah, I'd love to hear what you're working on.",
  },
  {
    id: "conf-2",
    goal: "confidence",
    prompt: "Give a one-minute toast at a friend's celebration.",
    context: "Twenty people, glasses raised, no notes.",
    seconds: 55,
    tier: "free",
    sampleTranscript:
      "Okay, um, so I've known Sam for, like, eleven years now, and the thing about Sam is that she just shows up. You know, quietly, every time. And I think tonight is basically all of us showing up for her for once. So, yeah, to Sam.",
  },
  // --- Specialized / Pro Confidence Scenarios ---
  {
    id: "conf-pro-1",
    goal: "confidence",
    prompt: "Impromptu Media / Press: Answer an unexpected live question on camera.",
    context: "Surprise live interview at a conference with zero preparation time.",
    seconds: 75,
    tier: "pro",
    badge: "Specialized",
    sampleTranscript:
      "Great question. The most important trend we're witnessing today isn't just automation—it's how human judgment and empathetic communication elevate automated workflows. Organizations that invest in both their people's voice and their technical foundation are the ones outperforming the market.",
  },
];

export function scenariosForGoal(goal: GoalId) {
  const custom = getCustomScenarios().filter((s) => s.goal === goal);
  return [...custom, ...SCENARIOS.filter((s) => s.goal === goal)];
}

export function getScenario(id: string) {
  if (id.startsWith("custom-")) {
    return getCustomScenarios().find((s) => s.id === id) || SCENARIOS.find((s) => s.id === id);
  }
  return SCENARIOS.find((s) => s.id === id);
}

const CUSTOM_SCENARIOS_KEY = "speakcoach:custom_scenarios";

export function getCustomScenarios(): Scenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_SCENARIOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomScenario(scenario: Scenario): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCustomScenarios().filter((s) => s.id !== scenario.id);
    const updated = [scenario, ...existing];
    window.localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(updated));
    // Trigger store listeners so components re-render with new scenario
    listeners.forEach((l) => l());
  } catch (e) {
    console.error("Could not save custom scenario", e);
  }
}

/* ------------------------------------------------------------------ */
/* Analysis                                                            */
/* ------------------------------------------------------------------ */

export type MetricId = "pace" | "fillers" | "clarity" | "pronunciation" | "vocabulary" | "delivery" | "relevance";

export type Metric = {
  id: MetricId;
  label: string;
  score: number;
  detail: string;
};

export type Analysis = {
  overall: number;
  metrics: Metric[];
  wordsPerMinute: number;
  fillerCount: number;
  fillerWords: { word: string; count: number }[];
  wordCount: number;
  strengths: { title: string; example: string }[];
  improvements: { title: string; example: string; fix: string }[];
  exercises: { title: string; minutes: number; how: string }[];
  summary: string;
};

/** Coaching is derived at display time so previously saved attempts receive it too. */
export function metricCoaching(metric: Metric, transcript: string, analysis: Analysis) {
  if (metric.score >= 80 || !transcript.trim()) return null;

  const sentences = transcript.trim().match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const first = sentences[0] ?? transcript.trim();
  const longest = [...sentences].sort((a, b) => b.length - a.length)[0] ?? first;
  // Keep quotations verbatim: no generated words or mid-word truncation.
  const quote = (text: string) => {
    const snippet = text.trim();
    if (snippet.length <= 140) return snippet;
    const cut = snippet.lastIndexOf(" ", 140);
    return snippet.slice(0, cut > 0 ? cut : 140);
  };
  const filler = analysis.fillerWords[0]?.word;
  const fillerSentence = filler
    ? sentences.find((sentence) => new RegExp(`\\b${filler}\\b`, "i").test(sentence)) ?? first
    : first;

  switch (metric.id) {
    case "pace":
      return {
        why: analysis.wordsPerMinute > 160
          ? `At ${analysis.wordsPerMinute} words per minute, listeners may miss your key point.`
          : `At ${analysis.wordsPerMinute} words per minute, long gaps can make your point harder to follow.`,
        quote: quote(first),
        exercise: analysis.wordsPerMinute > 160
          ? "Read this excerpt aloud again. Pause for one full breath after the main idea, then record it once more."
          : "Read this excerpt aloud as one complete thought. Pause only at the end, then record it once more.",
      };
    case "fillers":
      return {
        why: "Frequent filler words can distract listeners from the point you want them to remember.",
        quote: quote(fillerSentence),
        exercise: `Record this sentence three times. Each time you reach ${filler ? `“${filler}”` : "a filler"}, close your mouth and pause for one beat instead.`,
      };
    case "clarity":
      return {
        why: "Long or crowded sentences make it harder for listeners to hold on to your main idea.",
        quote: quote(longest),
        exercise: "Rewrite this excerpt as two short sentences, one idea in each. Say both aloud without rushing.",
      };
    case "pronunciation":
      return {
        why: "Clear articulation helps listeners catch important words. A transcript alone cannot verify how you pronounced them.",
        quote: quote(first),
        exercise: "Say this excerpt slowly three times, clearly finishing each word. Record a fourth pass at your natural pace and listen back.",
      };
    case "vocabulary":
      return {
        why: "More precise wording makes your message easier to picture and remember.",
        quote: quote(first),
        exercise: "Rewrite this excerpt with one more specific noun and one concrete verb. Speak both versions aloud and compare.",
      };
    case "delivery":
      return {
        why: "A complete, decisive thought gives listeners a stronger sense of your point. Confidence in your voice needs an audio listen-back to assess.",
        quote: quote(first),
        exercise: "Record this thought three times. End each pass with a full sentence and a one-beat pause; listen for a steady finish.",
      };
    case "relevance":
      return {
        why: "Listeners judge you first on whether you answered the question. A clear voice does not make up for skipping it.",
        quote: quote(first),
        exercise: "Say the question back in your own words, then answer it in one sentence before adding any detail. Record the answer again, opening with that one sentence.",
      };
  }
}

const FILLERS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "kind of",
  "sort of",
  "i mean",
  "so",
  "right",
  "literally",
];

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function firstSentence(text: string) {
  const s = text.split(/(?<=[.?!])\s/)[0] ?? text;
  return s.length > 140 ? s.slice(0, 137) + "…" : s;
}

function longestSentence(text: string) {
  const parts = text.split(/(?<=[.?!])\s/).filter(Boolean);
  const longest = parts.sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length)[0] ?? text;
  return longest.length > 160 ? longest.slice(0, 157) + "…" : longest;
}

/**
 * Mock AI analysis. Deterministic and derived from the real transcript,
 * so scores genuinely move when the user speaks differently.
 *
 * TODO(api): replace with a server call to the AI provider and keep this
 * exact return shape so the UI is unchanged.
 */
export function analyzeResponse(transcript: string, durationSec: number): Analysis {
  const clean = transcript.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const minutes = Math.max(durationSec, 5) / 60;
  const wpm = Math.round(wordCount / minutes) || 0;
  const lower = " " + clean.toLowerCase().replace(/[.,!?;:]/g, " ") + " ";

  const fillerWords = FILLERS.map((w) => ({
    word: w,
    count: (lower.match(new RegExp(`\\s${w.replace(/ /g, "\\s")}\\s`, "g")) || []).length,
  }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);
  const fillerCount = fillerWords.reduce((a, b) => a + b.count, 0);
  const fillerRate = wordCount ? (fillerCount / wordCount) * 100 : 0;

  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""))).size;
  const variety = wordCount ? unique / wordCount : 0;

  const sentences = clean.split(/(?<=[.?!])\s/).filter(Boolean);
  const avgSentence = sentences.length ? wordCount / sentences.length : wordCount;

  const paceScore = clamp(100 - Math.abs(wpm - 145) * 1.15);
  const fillerScore = clamp(100 - fillerRate * 11);
  const clarityScore = clamp(96 - Math.max(0, avgSentence - 22) * 2.6 - fillerRate * 2.5);
  const pronunciationScore = clamp(74 + variety * 30 - fillerRate * 1.6);
  const vocabScore = clamp(38 + variety * 115 - fillerRate * 2);
  const deliveryScore = clamp(
    (paceScore + fillerScore + clarityScore) / 3 + (wordCount > 60 ? 6 : -10),
  );

  const metrics: Metric[] = [
    {
      id: "pace",
      label: "Pace",
      score: paceScore,
      detail: `${wpm} words per minute (ideal 130–160)`,
    },
    {
      id: "fillers",
      label: "Filler words",
      score: fillerScore,
      detail: `${fillerCount} filler${fillerCount === 1 ? "" : "s"} in ${wordCount} words`,
    },
    {
      id: "clarity",
      label: "Clarity",
      score: clarityScore,
      detail: `Average sentence ${Math.round(avgSentence)} words`,
    },
    {
      id: "pronunciation",
      label: "Pronunciation",
      score: pronunciationScore,
      detail: "Word endings and articulation",
    },
    {
      id: "vocabulary",
      label: "Vocabulary",
      score: vocabScore,
      detail: `${Math.round(variety * 100)}% unique words`,
    },
    {
      id: "delivery",
      label: "Delivery & confidence",
      score: deliveryScore,
      detail: wordCount > 60 ? "Committed, steady energy" : "Answer was short for the scenario",
    },
  ];

  const overall = clamp(metrics.reduce((a, m) => a + m.score, 0) / metrics.length);

  const strengths: { title: string; example: string }[] = [];
  if (paceScore >= 70)
    strengths.push({
      title: "Your pace is easy to follow",
      example: `You averaged ${wpm} words per minute — comfortably in the range listeners absorb best.`,
    });
  if (vocabScore >= 65)
    strengths.push({
      title: "Varied, specific language",
      example: `You used ${unique} distinct words and avoided repeating the same phrase to fill space.`,
    });
  if (wordCount > 60)
    strengths.push({
      title: "You gave a complete answer",
      example: `Opening line: “${firstSentence(clean)}”`,
    });
  if (fillerScore >= 75)
    strengths.push({
      title: "Clean of verbal clutter",
      example: `Only ${fillerCount} filler words across the whole response.`,
    });
  if (!strengths.length)
    strengths.push({
      title: "You finished the attempt",
      example: "Showing up and speaking out loud is the part most people skip. Build from here.",
    });

  const improvements: { title: string; example: string; fix: string }[] = [];
  if (fillerCount > 2 && fillerWords[0])
    improvements.push({
      title: `Cut “${fillerWords[0].word}”`,
      example: `You said “${fillerWords[0].word}” ${fillerWords[0].count} times — most often at the start of a sentence.`,
      fix: "Replace the filler with a closed mouth and a half-second pause. Silence reads as confidence.",
    });
  if (wpm > 165)
    improvements.push({
      title: "Slow down slightly",
      example: `${wpm} wpm is fast enough that key numbers get lost.`,
      fix: "Mark two places to breathe, and land the last three words of every sentence.",
    });
  if (wpm > 0 && wpm < 120)
    improvements.push({
      title: "Lift the tempo",
      example: `${wpm} wpm can read as hesitant, even when the content is strong.`,
      fix: "Say each sentence as one unbroken thought instead of pausing mid-phrase.",
    });
  if (avgSentence > 24)
    improvements.push({
      title: "Shorten your sentences",
      example: `Your longest ran on: “${longestSentence(clean)}”`,
      fix: "One idea per sentence. Cut every “and” that joins two complete thoughts.",
    });
  if (wordCount <= 60)
    improvements.push({
      title: "Add evidence",
      example: "The answer ended before you gave a concrete example or result.",
      fix: "Use Point → Example → Result. The example is where credibility lives.",
    });
  if (!improvements.length)
    improvements.push({
      title: "Push for more colour",
      example: "The mechanics are solid, so the next gain is in storytelling.",
      fix: "Add one vivid detail — a name, a number, a moment — in the first fifteen seconds.",
    });

  const pool = [
    {
      title: "Pause instead of filler",
      minutes: 4,
      how: "Re-record the same answer. Every time you feel a filler coming, close your mouth and count one beat.",
    },
    {
      title: "Metronome pacing",
      minutes: 5,
      how: "Read any paragraph aloud at 140 bpm, one word per beat, then speak your answer at that tempo.",
    },
    {
      title: "Point, Example, Result",
      minutes: 6,
      how: "Write your answer as exactly three sentences in that order, then deliver it without notes.",
    },
    {
      title: "Last-word landing",
      minutes: 3,
      how: "Say ten sentences, holding volume through the final word instead of trailing off.",
    },
    {
      title: "Cold open drill",
      minutes: 4,
      how: "Record only your first fifteen seconds, five times, until it lands without a warm-up ramble.",
    },
  ];
  const seed = (fillerCount + wpm + wordCount) % pool.length;
  const exercises = [seed, (seed + 2) % pool.length, (seed + 4) % pool.length].map(
    (i) => pool[i]!,
  );

  const summary =
    overall >= 80
      ? "Strong, confident delivery. Polish the details and this is ready for the real room."
      : overall >= 60
        ? "Solid foundation. Tightening your filler words and structure will move this up fast."
        : "Plenty of raw material here — focus on one habit at a time and re-record.";

  return {
    overall,
    metrics,
    wordsPerMinute: wpm,
    fillerCount,
    fillerWords: fillerWords.slice(0, 5),
    wordCount,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    exercises,
    summary,
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export type Session = {
  id: string;
  scenarioId: string;
  goal: GoalId;
  prompt: string;
  transcript: string;
  durationSec: number;
  createdAt: number;
  analysis: Analysis;
  /** Set when this attempt is a retry of an earlier session. */
  retryOf?: string;
  attempt: number;
  /** "ai" = transcribed + scored by the real AI pipeline. Anything else is legacy mock data. */
  source?: "ai";
};

export type SubscriptionTier = "free" | "pro";

export type Profile = {
  name: string;
  goal: GoalId | null;
  level: "new" | "some" | "confident";
  weeklyTarget: number;
  onboarded: boolean;
  reminders: boolean;
  strictFillers: boolean;
  plan: SubscriptionTier;
  dodoPaymentLink?: string;
};

export type StoreState = { profile: Profile; sessions: Session[] };

const KEY = "speakcoach:v1";

const defaultProfile: Profile = {
  name: "",
  goal: null,
  level: "some",
  weeklyTarget: 3,
  onboarded: false,
  reminders: true,
  strictFillers: false,
  plan: "free",
};

export function seedSessions(): Session[] {
  const day = 86_400_000;
  const now = Date.now();
  const picks: { s: string; ago: number; d: number }[] = [
    { s: "int-1", ago: 9, d: 82 },
    { s: "pres-1", ago: 6, d: 64 },
    { s: "meet-1", ago: 3, d: 51 },
    { s: "int-2", ago: 1, d: 88 },
  ];
  return picks.map((p, i) => {
    const sc = getScenario(p.s)!;
    const transcript =
      i >= 2 ? sc.sampleTranscript.replace(/\b(um|uh|basically|you know), /gi, "") : sc.sampleTranscript;
    return {
      id: `seed-${i}`,
      scenarioId: sc.id,
      goal: sc.goal,
      prompt: sc.prompt,
      transcript,
      durationSec: p.d,
      createdAt: now - p.ago * day,
      analysis: analyzeResponse(transcript, p.d),
      attempt: 1,
    };
  });
}

function initial(): StoreState {
  return { profile: { ...defaultProfile }, sessions: [] };
}

let state: StoreState | null = null;
const listeners = new Set<() => void>();

function read(): StoreState {
  if (state) return state;
  if (typeof window === "undefined") return initial();
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as StoreState) : initial();
    // The plan is held on the server. Never trust a value read from the browser's storage.
    parsed.profile.plan = "free";
    // Only AI-analysed sessions count toward scores; drop legacy mock/sample sessions.
    const real = parsed.sessions.filter((x) => x.source === "ai");
    state = { ...parsed, sessions: real };
    if (real.length !== parsed.sessions.length) window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    state = initial();
  }
  return state;
}

function write(next: StoreState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  listeners.forEach((l) => l());
}

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: read,
  getServerSnapshot: (): StoreState => initial(),
  setProfile(patch: Partial<Profile>) {
    const s = read();
    write({ ...s, profile: { ...s.profile, ...patch } });
  },
  addSession(session: Session) {
    const s = read();
    write({ ...s, sessions: [...s.sessions, session] });
  },
  setSessions(sessions: Session[]) {
    const s = read();
    write({ ...s, sessions });
  },
  reset() {
    write(initial());
  },
  clearHistory() {
    const s = read();
    write({ ...s, sessions: [] });
  },
};

/* ------------------------------------------------------------------ */
/* Derived helpers                                                     */
/* ------------------------------------------------------------------ */

export const sortedSessions = (sessions: Session[]) =>
  [...sessions].sort((a, b) => b.createdAt - a.createdAt);

export function averageScore(sessions: Session[]) {
  if (!sessions.length) return 0;
  return Math.round(sessions.reduce((a, s) => a + s.analysis.overall, 0) / sessions.length);
}

export function trend(sessions: Session[]) {
  const ordered = [...sessions].sort((a, b) => a.createdAt - b.createdAt);
  if (ordered.length < 2) return 0;
  const half = Math.max(1, Math.floor(ordered.length / 2));
  const first = averageScore(ordered.slice(0, half));
  const last = averageScore(ordered.slice(-half));
  return last - first;
}

export function streak(sessions: Session[]) {
  const days = new Set(sessions.map((s) => new Date(s.createdAt).toDateString()));
  let count = 0;
  const cursor = new Date();
  for (;;) {
    if (days.has(cursor.toDateString())) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (count === 0 && days.size) {
      cursor.setDate(cursor.getDate() - 1);
      if (Date.now() - cursor.getTime() > 2 * 86_400_000) break;
    } else break;
  }
  return count;
}

export function scoreTone(score: number) {
  if (score >= 80) return "success" as const;
  if (score >= 60) return "warning" as const;
  return "destructive" as const;
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function goalById(id: GoalId | null | undefined) {
  return GOALS.find((g) => g.id === id) ?? null;
}

// ---------- Progress ----------
export function longestStreak(sessions: Session[]) {
  const days = [...new Set(sessions.map((s) => {
    const d = new Date(s.createdAt); d.setHours(0, 0, 0, 0); return d.getTime();
  }))].sort((a, b) => a - b);
  let best = 0, run = 0, prev = 0;
  for (const d of days) {
    run = prev && Math.round((d - prev) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return best;
}

export function weekDays(sessions: Session[]) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start); day.setDate(start.getDate() + i);
    const next = day.getTime() + 86_400_000;
    const count = sessions.filter((s) => s.createdAt >= day.getTime() && s.createdAt < next).length;
    return { label: day.toLocaleDateString(undefined, { weekday: "narrow" }), count, isToday: day.toDateString() === new Date().toDateString(), isFuture: day.getTime() > Date.now() };
  });
}

export function personalBests(sessions: Session[]) {
  const best = (pick: (s: Session) => number) =>
    sessions.reduce<Session | null>((b, s) => (!b || pick(s) > pick(b) ? s : b), null);
  const overall = best((s) => s.analysis.overall);
  const metricIds: MetricId[] = ["pace", "fillers", "clarity", "pronunciation", "vocabulary", "delivery", "relevance"];
  const metrics = metricIds.map((id) => {
    const score = (s: Session) => s.analysis.metrics.find((m) => m.id === id)?.score ?? 0;
    const s = best(score);
    return { id, label: s?.analysis.metrics.find((m) => m.id === id)?.label ?? id, score: s ? score(s) : 0, sessionId: s?.id };
  });
  return { overall, metrics };
}

export type Milestone = { id: string; title: string; detail: string; current: number; target: number; done: boolean };

export function milestones(sessions: Session[]): Milestone[] {
  const top = Math.max(0, ...sessions.map((s) => s.analysis.overall));
  const goals = new Set(sessions.map((s) => s.goal)).size;
  const cleanest = Math.min(Infinity, ...sessions.map((s) => s.analysis.fillerCount));
  const defs: Omit<Milestone, "done">[] = [
    { id: "first", title: "First session", detail: "Record your first response", current: sessions.length, target: 1 },
    { id: "ten", title: "10 sessions", detail: "Build a consistent practice habit", current: sessions.length, target: 10 },
    { id: "streak7", title: "7-day streak", detail: "Practise on seven consecutive days", current: longestStreak(sessions), target: 7 },
    { id: "score80", title: "Score 80+", detail: "Reach a strong overall score", current: top, target: 80 },
    { id: "score90", title: "Score 90+", detail: "Deliver an excellent response", current: top, target: 90 },
    { id: "range", title: "Versatile speaker", detail: "Practise every goal type", current: goals, target: GOALS.length },
    { id: "clean", title: "Filler-free", detail: "Finish a response with zero fillers", current: sessions.length && cleanest === 0 ? 1 : 0, target: 1 },
  ];
  return defs.map((m) => ({ ...m, current: Math.min(m.current, m.target), done: m.current >= m.target }));
}

export function currentWeekSessions(sessions: Session[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday start
  const startMs = start.getTime();
  return sessions.filter((s) => s.createdAt >= startMs);
}

export function checkPracticeAccess(profile: Profile, sessions: Session[], scenario?: Scenario | null) {
  const isPro = profile.plan === "pro";
  const thisWeekCount = currentWeekSessions(sessions).length;
  const isScenarioProOnly = scenario?.tier === "pro";

  if (!isPro && isScenarioProOnly) {
    return {
      allowed: false,
      reason: "scenario_locked" as const,
      message: "This specialized scenario requires SpeakCoach Pro.",
    };
  }

  if (!isPro && thisWeekCount >= FREE_WEEKLY_LIMIT) {
    return {
      allowed: false,
      reason: "quota_reached" as const,
      message: `You have reached your free weekly limit of ${FREE_WEEKLY_LIMIT} practice sessions. Upgrade to Pro for unlimited practice.`,
    };
  }

  return {
    allowed: true,
    reason: null,
    message: "",
  };
}
