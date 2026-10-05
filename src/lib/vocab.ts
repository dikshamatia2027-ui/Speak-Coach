import { WORDS, wordById, type Tier, type Word } from "./vocab-words";

/**
 * Vocabulary game state: per-word spaced-repetition cards, points, streaks,
 * adaptive difficulty. Persisted in localStorage (swap for a backend later).
 */
export type Card = {
  wordId: string;
  box: number; // Leitner box 0–5; 0 = struggling, 5 = mastered
  due: number;
  seen: number;
  correct: number;
  lastScore: number;
  struggled: boolean;
};

export type Attempt = { wordId: string; score: number; correct: boolean; at: number };

export type VocabState = {
  cards: Record<string, Card>;
  attempts: Attempt[];
  points: number;
  dailyGoal: number;
  difficulty: Tier | "auto";
  bestStreak: number;
};

const KEY = "speakcoach:vocab:v1";
const DAY = 86_400_000;
const INTERVALS = [0, 1, 2, 4, 8, 16].map((d) => d * DAY);
export const MASTERED_BOX = 4;

const initial = (): VocabState => ({ cards: {}, attempts: [], points: 0, dailyGoal: 5, difficulty: "auto", bestStreak: 0 });
const serverSnapshot = initial();

let state: VocabState | null = null;
const listeners = new Set<() => void>();

function read(): VocabState {
  if (state) return state;
  if (typeof window === "undefined") return serverSnapshot;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? { ...initial(), ...(JSON.parse(raw) as VocabState) } : initial();
  } catch {
    state = initial();
  }
  return state;
}

function write(next: VocabState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Points: base by tier, scaled by AI score, plus a bonus for clean answers. */
export function pointsFor(tier: Tier, score: number, isReview: boolean) {
  const base = tier * 10;
  return Math.round(base * (score / 100) + (score >= 85 ? 5 : 0) + (isReview && score >= 70 ? 5 : 0));
}

export const vocabStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: read,
  getServerSnapshot: () => serverSnapshot,
  setSettings(patch: Partial<Pick<VocabState, "dailyGoal" | "difficulty">>) {
    write({ ...read(), ...patch });
  },
  /** Record a sentence attempt; returns points earned. */
  record(wordId: string, score: number, isReview: boolean) {
    const s = read();
    const word = wordById(wordId);
    const correct = score >= 70;
    const prev = s.cards[wordId];
    const box = correct ? Math.min(5, (prev?.box ?? 0) + (score >= 90 ? 2 : 1)) : 0;
    const card: Card = {
      wordId,
      box,
      due: Date.now() + (INTERVALS[box] ?? 0) + (box === 0 ? 10 * 60_000 : 0),
      seen: (prev?.seen ?? 0) + 1,
      correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
      lastScore: score,
      struggled: (prev?.struggled ?? false) || !correct,
    };
    const earned = pointsFor(word?.tier ?? 1, score, isReview);
    const attempts = [...s.attempts, { wordId, score, correct, at: Date.now() }];
    write({
      ...s,
      cards: { ...s.cards, [wordId]: card },
      attempts,
      points: s.points + earned,
      bestStreak: Math.max(s.bestStreak, dayStreak(attempts)),
    });
    return earned;
  },
  reset() {
    write(initial());
  },
};

/* ---------------- Derived ---------------- */

const dayKey = (t: number) => new Date(t).toDateString();

export function dayStreak(attempts: Attempt[]) {
  const days = new Set(attempts.map((a) => dayKey(a.at)));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Consecutive correct answers ending with the latest attempt. */
export function answerStreak(attempts: Attempt[]) {
  let n = 0;
  for (let i = attempts.length - 1; i >= 0 && attempts[i]!.correct; i--) n++;
  return n;
}

export function todayCount(s: VocabState) {
  const k = dayKey(Date.now());
  return new Set(s.attempts.filter((a) => dayKey(a.at) === k).map((a) => a.wordId)).size;
}

export const LEVELS = [
  { name: "Apprentice", min: 0 },
  { name: "Wordsmith", min: 150 },
  { name: "Rhetorician", min: 400 },
  { name: "Lexicographer", min: 900 },
  { name: "Orator", min: 1800 },
];

export function levelInfo(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1]!.min) i++;
  const cur = LEVELS[i]!;
  const next = LEVELS[i + 1];
  return {
    index: i + 1,
    name: cur.name,
    next: next?.name ?? null,
    progress: next ? (points - cur.min) / (next.min - cur.min) : 1,
    toNext: next ? next.min - points : 0,
  };
}

export function stats(s: VocabState) {
  const cards = Object.values(s.cards);
  const learned = cards.filter((c) => c.correct > 0).length;
  const mastered = cards.filter((c) => c.box >= MASTERED_BOX).length;
  const accuracy = s.attempts.length ? Math.round((s.attempts.filter((a) => a.correct).length / s.attempts.length) * 100) : 0;
  const recent = s.attempts.slice(-20);
  const sentenceScore = recent.length ? Math.round(recent.reduce((a, b) => a + b.score, 0) / recent.length) : 0;
  // Personal vocabulary score (0–1000): breadth, depth and quality.
  const tierWeight = cards.reduce((a, c) => a + (c.correct > 0 ? (wordById(c.wordId)?.tier ?? 1) : 0), 0);
  const vocabScore = Math.min(1000, Math.round(tierWeight * 12 + mastered * 15 + sentenceScore * 2));
  return { learned, mastered, accuracy, sentenceScore, vocabScore, dueCount: dueCards(s).length, struggling: cards.filter((c) => c.box === 0 && c.seen > 0).length };
}

export function dueCards(s: VocabState) {
  const now = Date.now();
  return Object.values(s.cards)
    .filter((c) => c.due <= now && c.box < 5)
    .sort((a, b) => a.box - b.box || a.due - b.due);
}

/** Adaptive tier: unlock harder words as recent accuracy climbs. */
export function currentTier(s: VocabState): Tier {
  if (s.difficulty !== "auto") return s.difficulty;
  const recent = s.attempts.slice(-8);
  const learned = Object.values(s.cards).filter((c) => c.correct > 0);
  const avg = recent.length ? recent.reduce((a, b) => a + b.score, 0) / recent.length : 0;
  const t2 = learned.filter((c) => wordById(c.wordId)?.tier === 1).length >= 4 && avg >= 72;
  const t3 = t2 && learned.filter((c) => wordById(c.wordId)?.tier === 2).length >= 4 && avg >= 80;
  return t3 ? 3 : t2 ? 2 : 1;
}

export function nextNewWord(s: VocabState, exclude: string[] = []): Word | null {
  const tier = currentTier(s);
  const fresh = (t: Tier) => WORDS.filter((x) => x.tier === t && !s.cards[x.id] && !exclude.includes(x.id));
  const pool = fresh(tier).length ? fresh(tier) : WORDS.filter((x) => !s.cards[x.id] && !exclude.includes(x.id));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export const TIER_LABEL: Record<Tier, string> = { 1: "Advanced", 2: "GRE core", 3: "Expert" };
