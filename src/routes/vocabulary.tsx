import { createFileRoute } from "@tanstack/react-router";
import { getAccessToken } from "@/lib/supabase";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  Layers,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { checkSentence } from "@/lib/vocab.functions";
import {
  answerStreak,
  currentTier,
  dayStreak,
  dueCards,
  levelInfo,
  nextNewWord,
  stats,
  TIER_LABEL,
  todayCount,
  vocabStore,
} from "@/lib/vocab";
import { WORDS, wordById, type Word } from "@/lib/vocab-words";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vocabulary")({
  head: () => ({
    meta: [
      { title: "Vocabulary Practice — SpeakCoach" },
      {
        name: "description",
        content:
          "Build advanced, GRE-level English vocabulary by using every new word in your own sentence, with instant AI feedback and spaced review.",
      },
      { property: "og:title", content: "Vocabulary Practice — SpeakCoach" },
      {
        property: "og:description",
        content: "Learn a word, use it, get AI feedback. Points, levels and spaced repetition built in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Vocabulary,
});

type Feedback = {
  score: number;
  meaning: number;
  grammar: number;
  naturalness: number;
  verdict: "excellent" | "good" | "needs_work" | "incorrect";
  explanation: string;
  improved: string | null;
};

function useVocab() {
  return useSyncExternalStore(vocabStore.subscribe, vocabStore.get, vocabStore.getServerSnapshot);
}

function Vocabulary() {
  const [mode, setMode] = useState<"home" | "learn" | "review">("home");
  return (
    <AppShell>
      {mode === "home" ? (
        <Home onStart={setMode} />
      ) : (
        <Round mode={mode} onExit={() => setMode("home")} />
      )}
    </AppShell>
  );
}

/* ------------------------------ Home ------------------------------ */

function Home({ onStart }: { onStart: (m: "learn" | "review") => void }) {
  const s = useVocab();
  const st = stats(s);
  const lvl = levelInfo(s.points);
  const today = todayCount(s);
  const streak = dayStreak(s.attempts);
  const tier = currentTier(s);
  const struggling = Object.values(s.cards).filter((c) => c.struggled).sort((a, b) => a.box - b.box).slice(0, 6);

  return (
    <div className="animate-rise space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">Vocabulary Practice</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Words you can actually use</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Learn an advanced word, then prove it by writing your own sentence. The coach checks meaning, grammar and
            natural usage.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" disabled={!st.dueCount} onClick={() => onStart("review")}>
            <RotateCcw className="size-4" /> Review {st.dueCount > 0 && `(${st.dueCount})`}
          </Button>
          <Button variant="hero" size="lg" onClick={() => onStart("learn")}>
            Start round <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Vocabulary score</p>
              <p className="font-display text-brand mt-1 text-5xl font-bold tabular-nums">{st.vocabScore}</p>
              <p className="mt-1 text-xs text-muted-foreground">out of 1000 · breadth, mastery and sentence quality</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Level {lvl.index}</p>
              <p className="font-display text-xl font-bold">{lvl.name}</p>
              <p className="mt-1 text-sm tabular-nums text-muted-foreground">{s.points} pts</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {lvl.next ? `${lvl.toNext} pts to ${lvl.next}` : "Top level reached"}
            </p>
          </div>
        </div>

        <div className="surface p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4 text-primary" /> Daily goal
            </p>
            <select
              aria-label="Daily goal"
              value={s.dailyGoal}
              onChange={(e) => vocabStore.setSettings({ dailyGoal: Number(e.target.value) })}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs"
            >
              {[3, 5, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n} words
                </option>
              ))}
            </select>
          </div>
          <p className="font-display mt-4 text-4xl font-bold tabular-nums">
            {Math.min(today, s.dailyGoal)}
            <span className="text-lg text-muted-foreground">/{s.dailyGoal}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${Math.min(1, today / s.dailyGoal) * 100}%` }} />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="size-4 text-warning" /> {streak}-day streak · best {Math.max(s.bestStreak, streak)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={BookOpen} label="Words learned" value={st.learned} sub={`of ${WORDS.length}`} />
        <Stat icon={Trophy} label="Mastered" value={st.mastered} sub="long-term" />
        <Stat icon={Check} label="Accuracy" value={`${st.accuracy}%`} sub={`${s.attempts.length} sentences`} />
        <Stat icon={Sparkles} label="Sentence score" value={st.sentenceScore || "—"} sub="last 20 avg" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-6">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="size-4 text-primary" /> Difficulty
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adaptive mode unlocks harder words as your sentences improve. Currently serving{" "}
            <strong className="text-foreground">{TIER_LABEL[tier]}</strong>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["auto", 1, 2, 3] as const).map((d) => (
              <button
                key={d}
                onClick={() => vocabStore.setSettings({ difficulty: d })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  s.difficulty === d
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/70 bg-card hover:border-border hover:text-foreground",
                )}
              >
                {d === "auto" ? "Adaptive" : TIER_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <RotateCcw className="size-4 text-primary" /> Words to strengthen
          </p>
          {struggling.length ? (
            <ul className="mt-3 divide-y divide-border">
              {struggling.map((c) => {
                const w = wordById(c.wordId);
                return (
                  <li key={c.wordId} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{w?.word}</span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      <BoxMeter box={c.box} />
                      {c.due <= Date.now() ? "Due now" : `Next ${new Date(c.due).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Words you miss come back here on a spaced schedule until you've mastered them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Check; label: string; value: string | number; sub: string }) {
  return (
    <div className="surface p-5">
      <Icon className="size-4 text-primary" />
      <p className="font-display mt-3 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function BoxMeter({ box }: { box: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`Strength ${box} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("h-1.5 w-3 rounded-full", i <= box ? "bg-primary" : "bg-muted")} />
      ))}
    </span>
  );
}

/* ------------------------------ Round ----------------------------- */

const ROUND_SIZE = 5;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function Round({ mode, onExit }: { mode: "learn" | "review"; onExit: () => void }) {
  const queue = useMemo<Word[]>(() => {
    const s = vocabStore.get();
    if (mode === "review") {
      return dueCards(s)
        .slice(0, ROUND_SIZE)
        .map((c) => wordById(c.wordId))
        .filter((w): w is Word => !!w);
    }
    // Mix in up to 2 due reviews, fill the rest with new words.
    const reviews = dueCards(s).slice(0, 2).map((c) => wordById(c.wordId)).filter((w): w is Word => !!w);
    const picked = reviews.map((w) => w.id);
    const out = [...reviews];
    while (out.length < ROUND_SIZE) {
      const n = nextNewWord(s, picked);
      if (!n) break;
      picked.push(n.id);
      out.push(n);
    }
    return out;
  }, [mode]);

  // Snapshot which words were already known when the round started.
  const [knownAtStart] = useState(() => new Set(Object.keys(vocabStore.get().cards)));
  const [i, setI] = useState(0);
  const [step, setStep] = useState<"card" | "write" | "result">("card");
  const [sentence, setSentence] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [earned, setEarned] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const check = useServerFn(checkSentence);
  const s = useVocab();

  const word = queue[i];
  const isReview = mode === "review" || knownAtStart.has(word?.id ?? "");

  if (!word || i >= queue.length) {
    return (
      <div className="animate-rise mx-auto max-w-md py-12 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-xs">
          <Trophy className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{queue.length ? "Round complete" : "Nothing to review"}</h1>
        {queue.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {roundCorrect}/{queue.length} correct · +{roundPoints} pts · {answerStreak(s.attempts)} in a row
          </p>
        )}
        <Button variant="hero" size="lg" className="mt-6" onClick={onExit}>
          Back to overview
        </Button>
      </div>
    );
  }

  async function submit() {
    if (!sentence.trim() || !word) return;
    setBusy(true);
    setError(null);
    try {
      const res = await check({ data: { wordId: word.id, sentence: sentence.trim(), token: (await getAccessToken()) ?? "" } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const pts = vocabStore.record(word.id, res.feedback.score, isReview);
      setFb(res.feedback);
      setEarned(pts);
      setRoundPoints((p) => p + pts);
      if (res.feedback.score >= 70) setRoundCorrect((c) => c + 1);
      setStep("result");
    } catch {
      setError("Couldn't reach the tutor. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setI((n) => n + 1);
    setStep("card");
    setSentence("");
    setFb(null);
    setError(null);
  }

  const passed = (fb?.score ?? 0) >= 70;

  return (
    <div className="animate-rise mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button onClick={onExit} className="text-sm text-muted-foreground hover:text-foreground">
          <X className="mr-1 inline size-4" /> End round
        </button>
        <div className="flex flex-1 gap-1.5">
          {queue.map((q, n) => (
            <span key={q.id} className={cn("h-1.5 flex-1 rounded-full", n < i ? "bg-primary" : n === i ? "bg-primary/50" : "bg-muted")} />
          ))}
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
          <Flame className="size-4 text-warning" />
          {answerStreak(s.attempts)}
        </span>
      </div>

      {/* Flashcard */}
      <div className="surface overflow-hidden">
        <div className="bg-soft border-b border-border p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">
              {isReview ? "Review" : "New word"} · {TIER_LABEL[word.tier]}
            </span>
            <span className="text-xs text-muted-foreground italic">{word.pos}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="font-display text-4xl font-bold sm:text-5xl">{word.word}</h1>
            <button
              onClick={() => speak(word.word)}
              aria-label={`Hear ${word.word}`}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:border-primary/40"
            >
              <Volume2 className="size-4" />
            </button>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{word.ipa}</p>
          <p className="mt-4 text-lg">{word.definition}</p>
        </div>

        {step === "card" && (
          <div className="space-y-5 p-6 sm:p-8">
            <p className="border-l-2 border-primary/40 pl-4 text-sm italic">“{word.example}”</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <WordList label="Synonyms" words={word.synonyms} />
              <WordList label="Antonyms" words={word.antonyms} muted />
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={() => setStep("write")}>
              I've got it — let me use it <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {step === "write" && (
          <div className="p-6 sm:p-8">
            <label htmlFor="sentence" className="text-sm font-semibold">
              Write your own sentence using “{word.word}”
            </label>
            <p className="mt-1 text-xs text-muted-foreground">Make the meaning clear from context. Avoid copying the example.</p>
            <textarea
              id="sentence"
              autoFocus
              value={sentence}
              maxLength={400}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
              }}
              rows={3}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-card p-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={`e.g. a sentence about your work, a meeting, or a decision…`}
            />
            {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={() => setStep("card")}>
                See card again
              </Button>
              <Button variant="hero" className="flex-1" disabled={busy || sentence.trim().length < 4} onClick={() => void submit()}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {busy ? "Checking…" : "Check sentence"}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && fb && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    passed ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {passed ? <Check className="size-5" /> : <RotateCcw className="size-5" />}
                </span>
                <div>
                  <p className="font-semibold">
                    {fb.verdict === "excellent" ? "Excellent usage" : fb.verdict === "good" ? "Good usage" : fb.verdict === "needs_work" ? "Almost there" : "Not quite"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {passed ? "Scheduled for spaced review" : "This word will come back soon"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold tabular-nums">{fb.score}</p>
                <p className="text-xs font-semibold text-primary">+{earned} pts</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <SubScore label="Meaning" v={fb.meaning} />
              <SubScore label="Grammar" v={fb.grammar} />
              <SubScore label="Natural" v={fb.naturalness} />
            </div>

            <p className="mt-5 rounded-xl bg-muted/60 p-4 text-sm">
              <span className="text-muted-foreground">You wrote: </span>“{sentence.trim()}”
            </p>
            <p className="mt-4 text-sm leading-relaxed">{fb.explanation}</p>
            {fb.improved && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">Improved version</p>
                <p className="mt-1 text-sm">“{fb.improved}”</p>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              {!passed && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("write");
                    setFb(null);
                  }}
                >
                  Try again
                </Button>
              )}
              <Button variant="hero" className="flex-1" onClick={next}>
                {i + 1 < queue.length ? "Next word" : "Finish round"} <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WordList({ label, words, muted }: { label: string; words: string[]; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {words.map((w) => (
          <span
            key={w}
            className={cn("rounded-md border px-2 py-0.5 text-xs font-medium", muted ? "border-border text-muted-foreground" : "border-primary/25 bg-primary/5 text-foreground")}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

function SubScore({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-bold tabular-nums">{v}</p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className="bg-brand h-full" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
