import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Lightbulb,
  Lock,
  PieChart,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MetricBar, ScoreRing } from "@/components/score";
import { Button } from "@/components/ui/button";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";
import { useStore } from "@/hooks/use-store";
import { goalById, metricCoaching, scoreTone, timeAgo } from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results/$sessionId")({
  head: () => ({
    meta: [
      { title: "Your coaching report — SpeakCoach" },
      {
        name: "description",
        content:
          "Your speaking score, metric breakdown, strengths, improvements and tailored practice exercises.",
      },
      { property: "og:title", content: "Your coaching report — SpeakCoach" },
      {
        property: "og:description",
        content: "Pace, fillers, clarity and confidence — scored and explained.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Results,
});

function Results() {
  const { sessionId } = Route.useParams();
  const { sessions, profile } = useStore();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = profile.plan === "pro";
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <AppShell>
        <div className="surface mx-auto max-w-md p-10 text-center">
          <h1 className="text-xl font-bold">Session not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been cleared from your history.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const previous = sessions
    .filter((s) => s.scenarioId === session.scenarioId && s.createdAt < session.createdAt)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const delta = previous ? session.analysis.overall - previous.analysis.overall : 0;
  const focusAreas = session.analysis.metrics.flatMap((metric) => {
    const coaching = metricCoaching(metric, session.transcript, session.analysis);
    return coaching ? [{ metric, coaching }] : [];
  });

  return (
    <AppShell>
      <ProUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        triggerReason="advanced_analytics"
      />

      <div className="animate-rise">
        <button
          onClick={() => void navigate({ to: "/dashboard" })}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </button>

        <div className="surface flex flex-col items-center gap-6 p-8 sm:flex-row sm:gap-10">
          <ScoreRing score={session.analysis.overall} size={180} />
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {goalById(session.goal)?.label} · {timeAgo(session.createdAt)}
              {session.attempt > 1 ? ` · attempt ${session.attempt}` : ""}
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{session.prompt}</h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {session.analysis.summary}
            </p>
            {delta !== 0 && (
              <p
                className={cn(
                  "mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold",
                  delta > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta} vs your last attempt
              </p>
            )}
          </div>
        </div>

        {focusAreas.length > 0 && (
          <section className="mt-8" aria-labelledby="focus-areas-heading">
            <h2 id="focus-areas-heading" className="text-xl font-bold">Your focus areas</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {focusAreas.map(({ metric, coaching }) => (
                <article key={metric.id} className="surface p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{metric.label}</h3>
                    <span className="text-sm font-bold tabular-nums text-warning">{metric.score}/100</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Why it matters: </span>{coaching.why}
                  </p>
                  <blockquote className="mt-4 border-l-2 border-primary pl-4 text-sm italic leading-relaxed">
                    “{coaching.quote}”
                  </blockquote>
                  <p className="mt-4 text-sm leading-relaxed">
                    <span className="font-semibold">Try this: </span>{coaching.exercise}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="surface p-6">
            <h2 className="text-lg font-bold">Metric breakdown</h2>
            <div className="mt-5 flex flex-col gap-5">
              {session.analysis.metrics.map((m) => (
                <MetricBar key={m.id} label={m.label} score={m.score} detail={m.detail} />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
              <div>
                <p className="font-display text-xl font-bold tabular-nums">
                  {session.analysis.wordsPerMinute}
                </p>
                <p className="text-xs text-muted-foreground">words / min</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold tabular-nums">
                  {session.analysis.fillerCount}
                </p>
                <p className="text-xs text-muted-foreground">filler words</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold tabular-nums">
                  {session.analysis.wordCount}
                </p>
                <p className="text-xs text-muted-foreground">total words</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="surface p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <CheckCircle2 className="size-5 text-success" /> What worked
              </h2>
              <ul className="mt-4 flex flex-col gap-4">
                {session.analysis.strengths.map((s) => (
                  <li key={s.title}>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.example}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Lightbulb className="size-5 text-warning" /> What to improve
              </h2>
              <ul className="mt-4 flex flex-col gap-4">
                {session.analysis.improvements.map((i) => (
                  <li key={i.title}>
                    <p className="text-sm font-semibold">{i.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{i.example}</p>
                    <p className="mt-1 text-sm font-medium text-primary">Try: {i.fix}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* --- Advanced Pro Analytics Section --- */}
        <div className="surface mt-6 p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="size-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Crown className="size-5 fill-amber-500" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Advanced Speech Analytics</h2>
                  <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-extrabold uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deep acoustic pacing distributions, filler density breakdown &amp; vocabulary uniqueness.
                </p>
              </div>
            </div>

            {!isPro && (
              <Button
                variant="hero"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Crown className="size-3.5 fill-primary-foreground" /> Unlock Pro Analytics
              </Button>
            )}
          </div>

          {isPro ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {/* Filler words list */}
              <div className="rounded-2xl bg-secondary/70 p-5 border border-border/60">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filler Frequency
                  </p>
                  <PieChart className="size-4 text-primary" />
                </div>
                {session.analysis.fillerWords.length > 0 ? (
                  <div className="mt-4 space-y-2.5">
                    {session.analysis.fillerWords.map((fw) => (
                      <div key={fw.word} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs font-semibold bg-background/80 px-2 py-1 rounded-lg">
                          “{fw.word}”
                        </span>
                        <span className="font-bold tabular-nums text-muted-foreground">
                          {fw.count} {fw.count === 1 ? "time" : "times"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-success font-medium">Zero filler words detected! Outstanding control.</p>
                )}
              </div>

              {/* Pacing cadence */}
              <div className="rounded-2xl bg-secondary/70 p-5 border border-border/60">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pacing Stability
                  </p>
                  <Activity className="size-4 text-primary" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-xs text-muted-foreground">Target speech rate</span>
                    <span className="font-semibold text-xs">130 – 160 wpm</span>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-xs text-muted-foreground">Your rate</span>
                    <span className={cn(
                      "font-bold tabular-nums",
                      session.analysis.wordsPerMinute >= 130 && session.analysis.wordsPerMinute <= 160
                        ? "text-success"
                        : "text-warning"
                    )}>
                      {session.analysis.wordsPerMinute} wpm
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (session.analysis.wordsPerMinute / 180) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    {session.analysis.wordsPerMinute > 160
                      ? "Pacing is slightly fast. Try inserting 1-second strategic pauses."
                      : session.analysis.wordsPerMinute < 120
                        ? "Pacing is measured. Aim to energize transitions."
                        : "Optimal conversational tempo for audience retention."}
                  </p>
                </div>
              </div>

              {/* Vocabulary density */}
              <div className="rounded-2xl bg-secondary/70 p-5 border border-border/60">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Vocabulary Range
                  </p>
                  <Sparkles className="size-4 text-amber-500" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-xs text-muted-foreground">Unique word ratio</span>
                    <span className="font-bold tabular-nums text-foreground">
                      {Math.round((new Set(session.transcript.toLowerCase().split(/\s+/)).size / Math.max(1, session.analysis.wordCount)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-xs text-muted-foreground">Total word count</span>
                    <span className="font-bold tabular-nums text-foreground">{session.analysis.wordCount} words</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-2">
                    Advanced linguistic scoring detects repetition and flags opportunities for higher-impact verbs.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border/80 bg-secondary/40 p-6 sm:p-8 text-center flex flex-col items-center justify-center">
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Lock className="size-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Advanced Analytics are Locked
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md">
                Pro members receive in-depth syllable-level pacing stability, filler frequency charts, vocabulary diversity ratios, and vocal confidence heatmaps.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold gap-1.5"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Crown className="size-3.5 fill-amber-500" /> Upgrade to Pro to view
              </Button>
            </div>
          )}
        </div>

        <div className="surface mt-6 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="size-5 text-primary" /> Your practice plan
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {session.analysis.exercises.map((e) => (
              <div key={e.title} className="rounded-2xl bg-secondary p-4">
                <p className="text-sm font-semibold">{e.title}</p>
                <p className="mt-0.5 text-xs font-medium text-primary">{e.minutes} min</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{e.how}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="xl">
            <Link to="/practice">
              <RefreshCw className="size-4" /> Retry this scenario
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link to="/history">View history</Link>
          </Button>
        </div>

        <div className="surface mt-8 p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Your transcript
          </h2>
          <p
            className={cn(
              "mt-3 text-sm leading-relaxed",
              scoreTone(session.analysis.overall) === "success" && "text-foreground",
            )}
          >
            {session.transcript}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
