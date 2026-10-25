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
import { Check, Copy, FileText } from "lucide-react";
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

function HighlightedTranscript({ text, words }: { text: string; words: string[] }) {
  if (words.length === 0) return <>{text}</>;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`\\b(${escaped.join("|")})\\b`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-warning/25 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function TranscriptCard({ transcript, fillers, words, wpm }: { transcript: string; fillers: string[]; words: number; wpm: number }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: nothing to do
    }
  }
  return (
    <section className="surface mt-6 p-5" aria-labelledby="transcript-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="transcript-heading" className="flex items-center gap-1.5 text-lg font-bold text-foreground">
            <FileText className="size-4 text-primary" aria-hidden="true" /> What you said
          </h2>
          <p className="text-sm text-muted-foreground">
            {words} words · {wpm} words per minute
            {fillers.length > 0 ? " · filler words are highlighted" : ""}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-xs" onClick={() => void copy()}>
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground sm:text-base">
        “<HighlightedTranscript text={transcript} words={fillers} />”
      </p>
    </section>
  );
}

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

      <div className="animate-rise max-w-4xl mx-auto">
        <button
          onClick={() => void navigate({ to: "/dashboard" })}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" /> Back to Dashboard
        </button>

        {/* Hero score overview */}
        <div className="surface flex flex-col items-center gap-6 p-6 sm:p-8 sm:flex-row sm:gap-8">
          <ScoreRing score={session.analysis.overall} size={150} />
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-bold uppercase tracking-wider text-primary text-xs">
                {goalById(session.goal)?.label}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{timeAgo(session.createdAt)}</span>
              {session.attempt > 1 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">Attempt #{session.attempt}</span>
                </>
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{session.prompt}</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {session.analysis.summary}
            </p>
            {delta !== 0 && (
              <div className="mt-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                    delta > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {delta > 0 ? "+" : ""}{delta} pts vs previous attempt
                </span>
              </div>
            )}
          </div>
        </div>

        <TranscriptCard
          transcript={session.transcript}
          fillers={session.analysis.fillerWords.map((f) => f.word)}
          words={session.analysis.wordCount}
          wpm={session.analysis.wordsPerMinute}
        />

        {focusAreas.length > 0 && (
          <section className="mt-6" aria-labelledby="focus-areas-heading">
            <div className="mb-3">
              <h2 id="focus-areas-heading" className="text-lg font-bold text-foreground">Priority Focus Areas</h2>
              <p className="text-sm text-muted-foreground">Specific excerpts from your speech that impacted your score</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {focusAreas.map(({ metric, coaching }) => (
                <article key={metric.id} className="surface p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
                      <h3 className="font-semibold text-base text-foreground">{metric.label}</h3>
                      <span className="text-sm font-bold tabular-nums text-warning">{metric.score}/100</span>
                    </div>
                    <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Observation: </span>{coaching.why}
                    </p>
                    <blockquote className="mt-2.5 rounded-md bg-secondary/50 border-l-2 border-primary p-2.5 text-sm italic text-foreground/90 leading-relaxed">
                      “{coaching.quote}”
                    </blockquote>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <p className="text-sm leading-relaxed text-foreground">
                      <span className="font-semibold text-primary">Drill: </span>{coaching.exercise}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Metric breakdown */}
          <div className="surface p-5">
            <h2 className="text-lg font-bold text-foreground">Scored Metric Breakdown</h2>
            <div className="mt-4 flex flex-col gap-4">
              {session.analysis.metrics.map((m) => (
                <MetricBar key={m.id} label={m.label} score={m.score} detail={m.detail} />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <div className="rounded-lg bg-secondary/50 p-2.5">
                <p className="font-display text-lg font-bold tabular-nums text-foreground">
                  {session.analysis.wordsPerMinute}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Words / min</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2.5">
                <p className="font-display text-lg font-bold tabular-nums text-foreground">
                  {session.analysis.fillerCount}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fillers</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2.5">
                <p className="font-display text-lg font-bold tabular-nums text-foreground">
                  {session.analysis.wordCount}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total words</p>
              </div>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="flex flex-col gap-4">
            <div className="surface p-5">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground">
                <CheckCircle2 className="size-4 text-success" /> Strengths Identified
              </h2>
              <ul className="mt-3 space-y-3">
                {session.analysis.strengths.map((s) => (
                  <li key={s.title} className="text-sm">
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <p className="mt-0.5 text-muted-foreground leading-relaxed">{s.example}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface p-5">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground">
                <Lightbulb className="size-4 text-warning" /> Growth Opportunities
              </h2>
              <ul className="mt-3 space-y-3">
                {session.analysis.improvements.map((i) => (
                  <li key={i.title} className="text-sm">
                    <p className="font-semibold text-foreground">{i.title}</p>
                    <p className="mt-0.5 text-muted-foreground leading-relaxed">{i.example}</p>
                    <p className="mt-1 text-primary font-medium">Suggestion: {i.fix}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* --- Advanced Pro Analytics Section --- */}
        <div className="surface mt-5 p-5 sm:p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="size-9 rounded-lg bg-brand-yellow/10 text-warning  flex items-center justify-center shrink-0">
                <Crown className="size-4.5 fill-brand-yellow" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">Advanced Acoustic Analytics</h2>
                  <span className="rounded-md bg-brand-yellow/15 text-warning  px-1.5 py-0.5 text-xs font-extrabold uppercase">
                    PRO
                  </span>
                </div>
                  <p className="text-sm text-muted-foreground">
                  Deep acoustic pacing distributions, filler density breakdown &amp; vocabulary uniqueness.
                </p>
              </div>
            </div>

            {!isPro && (
              <Button
                variant="hero"
                size="sm"
                className="shrink-0 h-8 text-xs font-semibold gap-1.5"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Crown className="size-3 fill-primary-foreground" /> Unlock Pro Analytics
              </Button>
            )}
          </div>

          {isPro ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {/* Filler words list */}
              <div className="rounded-lg bg-secondary/50 p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filler Frequency
                  </p>                  <PieChart className="size-3.5 text-primary" />
                </div>
                {session.analysis.fillerWords.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {session.analysis.fillerWords.map((fw) => (
                      <div key={fw.word} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-xs font-semibold bg-background px-1.5 py-0.5 rounded border border-border">
                          “{fw.word}”
                        </span>
                        <span className="font-semibold tabular-nums text-muted-foreground">
                          {fw.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-success font-medium">Zero filler words detected! Outstanding control.</p>
                )}
              </div>

              {/* Pacing cadence */}
              <div className="rounded-lg bg-secondary/50 p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pacing Stability
                  </p>
                  <Activity className="size-3.5 text-primary" />
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Target rate</span>
                    <span className="font-semibold">130 – 160 wpm</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Recorded rate</span>
                    <span className={cn(
                      "font-bold tabular-nums",
                      session.analysis.wordsPerMinute >= 130 && session.analysis.wordsPerMinute <= 160
                        ? "text-success"
                        : "text-warning"
                    )}>
                      {session.analysis.wordsPerMinute} wpm
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (session.analysis.wordsPerMinute / 180) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Vocabulary density */}
              <div className="rounded-lg bg-secondary/50 p-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Vocabulary Range
                  </p>
                  <Sparkles className="size-3.5 text-warning" />
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Lexical variety</span>
                    <span className="font-bold tabular-nums text-foreground">
                      {Math.round((new Set(session.transcript.toLowerCase().split(/\s+/)).size / Math.max(1, session.analysis.wordCount)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-muted-foreground">Word count</span>
                    <span className="font-bold tabular-nums text-foreground">{session.analysis.wordCount} words</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-secondary/30 p-5 text-center flex flex-col items-center justify-center">
              <div className="size-8 rounded-lg bg-brand-yellow/10 text-warning  flex items-center justify-center mb-2">
                <Lock className="size-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                Advanced Speech Metrics Locked
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground max-w-sm">
                Pro members receive in-depth syllable-level pacing stability, filler frequency charts, and vocabulary richness diagnostics.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-7 text-xs border-brand-yellow/30 text-warning  hover:bg-brand-yellow/10 font-bold gap-1"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Crown className="size-3 fill-brand-yellow" /> Upgrade to Pro to view
              </Button>
            </div>
          )}
        </div>

        {/* Practice Plan */}
        <div className="surface mt-5 p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Sparkles className="size-4 text-primary" /> Recommended Practice Drills
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {session.analysis.exercises.map((e) => (
              <div key={e.title} className="rounded-lg bg-secondary/50 border border-border/40 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{e.title}</p>
                    <span className="text-xs font-semibold text-primary">{e.minutes} min</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.how}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button asChild variant="hero" size="sm" className="h-9 px-5 gap-1.5 font-semibold">
            <Link to="/practice">
              <RefreshCw className="size-3.5" /> Re-attempt This Scenario
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 px-4 text-xs font-semibold">
            <Link to="/history">Browse All Sessions</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
