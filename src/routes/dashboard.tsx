import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Crown,
  Flame,
  MessageSquare,
  Mic,
  Presentation,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProgressPanel } from "@/components/progress";
import { ScoreRing, Sparkline } from "@/components/score";
import { Button } from "@/components/ui/button";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";
import { useStore } from "@/hooks/use-store";
import {
  averageScore,
  currentWeekSessions,
  FREE_WEEKLY_LIMIT,
  goalById,
  scenariosForGoal,
  scoreTone,
  sortedSessions,
  streak,
  timeAgo,
  trend,
  store,
  type GoalId,
  type MetricId,
} from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your speaking dashboard — SpeakCoach" },
      {
        name: "description",
        content:
          "Track your average speaking score, improvement trend, current goal and recent practice sessions, then jump straight into your next one.",
      },
      { property: "og:title", content: "Your speaking dashboard — SpeakCoach" },
      {
        property: "og:description",
        content: "Average score, trend and recent sessions in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

/** Goal cards derived from the real domain goals — every card maps to valid practice content. */
const GOAL_CARDS: Array<{ id: GoalId; label: string; desc: string; icon: typeof Sparkles }> = [
  { id: "confidence", label: "Confidence", desc: "Sound relaxed and clear", icon: Sparkles },
  { id: "interview", label: "Interview", desc: "Answer with structure", icon: MessageSquare },
  { id: "presentation", label: "Presentation", desc: "Open strong, land the message", icon: Presentation },
  { id: "meeting", label: "Meeting", desc: "Speak up when it counts", icon: Users },
  { id: "sales", label: "Pitch & sales", desc: "Persuade without a script", icon: TrendingUp },
];

const METRIC_LABELS: Record<MetricId, string> = {
  pace: "Pace",
  fillers: "Filler words",
  clarity: "Clarity",
  pronunciation: "Pronunciation",
  vocabulary: "Vocabulary",
  delivery: "Delivery & confidence",
  relevance: "Relevance",
};

/** Deterministic, general drill advice per metric — shown alongside the user's real average score. */
const FOCUS_DRILLS: Record<MetricId, string> = {
  pace: "Re-record at a steady 130–160 wpm — pause at commas instead of rushing the ending.",
  fillers: "Replace each filler with a closed-mouth pause: one beat of silence, then continue.",
  clarity: "One idea per sentence. Cut every “and” that joins two complete thoughts.",
  pronunciation: "Read one paragraph slowly, finishing every word ending — then repeat at natural pace.",
  vocabulary: "Swap one vague word (“really”, “thing”, “very”) for a precise noun or concrete verb.",
  delivery: "Land your final sentence at steady volume — hold it, don't trail off.",
  relevance: "Start by answering the question in one sentence, then support it with one example.",
};

function Dashboard() {
  const { profile, sessions } = useStore();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = profile.plan === "pro";
  const thisWeekSessions = currentWeekSessions(sessions);
  const sessionsThisWeek = thisWeekSessions.length;
  const isLimitReached = !isPro && sessionsThisWeek >= FREE_WEEKLY_LIMIT;

  const recent = sortedSessions(sessions).slice(0, 5);
  const avg = averageScore(sessions);
  const delta = trend(sessions);
  const activeGoal = goalById(profile.goal) ?? goalById("confidence")!;
  const series = [...sessions]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-8)
    .map((s) => s.analysis.overall);

  /** Recommended scenario: the least-practised one for the active goal (free users see free-tier only). */
  const recommended = useMemo(() => {
    const pool = scenariosForGoal(activeGoal.id).filter((s) => isPro || s.tier !== "pro");
    if (!pool.length) return null;
    const ranked = pool
      .map((scenario) => {
        const attempts = sessions.filter((x) => x.scenarioId === scenario.id);
        return {
          scenario,
          attempts: attempts.length,
          last: attempts.reduce((max, x) => Math.max(max, x.createdAt), 0),
        };
      })
      .sort((a, b) => a.attempts - b.attempts || a.last - b.last);
    return ranked[0]!;
  }, [activeGoal.id, isPro, sessions]);

  /** Weakest metric: lowest average score across every real (AI-analysed) session. */
  const weakest = useMemo(() => {
    if (!sessions.length) return null;
    const ids: MetricId[] = ["pace", "fillers", "clarity", "pronunciation", "vocabulary", "delivery", "relevance"];
    const averages = ids
      .map((id) => {
        // Older sessions have no relevance score: only average the sessions that actually have the metric.
        const scores = sessions.flatMap((s) => {
          const m = s.analysis.metrics.find((x) => x.id === id);
          return m ? [m.score] : [];
        });
        return { id, count: scores.length, avg: Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)) };
      })
      .filter((a) => a.count > 0);
    return averages.sort((a, b) => a.avg - b.avg)[0] ?? null;
  }, [sessions]);

  function handleSelectGoal(goalId: GoalId) {
    store.setProfile({ goal: goalId });
    void navigate({ to: "/practice" });
  }

  const userName = profile.name?.trim() || "Sarina!";

  return (
    <AppShell>
      <ProUpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      <div className="space-y-6 sm:space-y-7 animate-rise">
        {/* Welcome Greeting Block (Exact Figma Middle Screen) */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Daily Warm-Up
          </span>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Welcome back, <span className="text-primary">{userName}</span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            How do you want to practice today?
          </p>
        </div>

        {/* Practice goal selector: compact professional cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
          {GOAL_CARDS.map((cat) => {
            const Icon = cat.icon;
            const isSelected = profile.goal === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectGoal(cat.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group flex flex-col items-start rounded-xl border p-3.5 text-left transition-all sm:p-4 cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-colors",
                    isSelected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="mt-2.5 text-sm font-semibold tracking-tight text-foreground">
                  {cat.label}
                </span>
                <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Free tier usage alert if limit reached or close */}
        {!isPro && (
          <div
            className={cn(
              "rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-all",
              isLimitReached
                ? "border-warning/40 bg-warning/5 text-foreground"
                : "border-border bg-card text-foreground shadow-xs",
            )}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={cn(
                  "size-8 rounded-xl flex items-center justify-center shrink-0",
                  isLimitReached ? "bg-warning text-warning-foreground" : "bg-warning/10 text-warning",
                )}
              >
                <Zap className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-xs sm:text-sm">
                  {isLimitReached
                    ? `Weekly Limit Reached (${sessionsThisWeek}/${FREE_WEEKLY_LIMIT} sessions used)`
                    : `Free Plan: ${sessionsThisWeek} of ${FREE_WEEKLY_LIMIT} weekly sessions used`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isLimitReached
                    ? "Resets next Monday. Upgrade to Pro for unlimited sessions and executive scenarios."
                    : `${Math.max(0, FREE_WEEKLY_LIMIT - sessionsThisWeek)} session${FREE_WEEKLY_LIMIT - sessionsThisWeek === 1 ? "" : "s"} remaining this week.`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isLimitReached ? "default" : "outline"}
              className={cn(
                "shrink-0 h-8 text-xs font-bold gap-1 self-start sm:self-auto rounded-xl",
                isLimitReached
                  ? "bg-warning text-warning-foreground hover:bg-warning/90"
                  : "border-warning/40 text-warning hover:bg-warning/10",
              )}
              onClick={() => setShowUpgradeModal(true)}
            >
              <Crown className="size-3 fill-current" /> {isLimitReached ? "Unlock Unlimited" : "Upgrade"}
            </Button>
          </div>
        )}

        {/* "Today's Task" — real, data-driven recommendations */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Today's Task
            </h2>
            <Link
              to="/practice"
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
            >
              See all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Card 1: recommended scenario for the active goal */}
            <div className="surface p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-0.5 text-xs font-bold text-primary uppercase tracking-wider">
                    <Sparkles className="size-3 text-primary" /> Recommended next
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {activeGoal.emoji} {activeGoal.label}
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground mt-3 group-hover:text-primary transition-colors">
                  {recommended?.scenario.prompt ?? "Record your first answer"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {recommended?.scenario.context ??
                    "Pick any scenario on the practice page and speak for sixty seconds to unlock your scorecard."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {recommended
                    ? `${recommended.scenario.seconds}s · ${recommended.attempts === 0 ? "first attempt" : `${recommended.attempts} attempt${recommended.attempts === 1 ? "" : "s"} so far`}`
                    : "About 2 minutes"}
                </span>
                <button
                  onClick={() => {
                    store.setProfile({ goal: activeGoal.id });
                    void navigate({ to: "/practice" });
                  }}
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:translate-x-0.5 transition-transform cursor-pointer"
                >
                  Start drill <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: weakest real metric (or first-session invitation) */}
            <div className="surface p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between group">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Target className="size-3" /> Focus area
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground mt-3 transition-colors">
                  {weakest ? METRIC_LABELS[weakest.id] : "Your first scorecard"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {weakest
                    ? `Averaging ${weakest.avg}/100 across ${sessions.length} session${sessions.length === 1 ? "" : "s"}. ${FOCUS_DRILLS[weakest.id]}`
                    : "Record a 60-second answer and this card becomes your personalised focus area, based on your lowest-scoring metric."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {weakest ? `Your average: ${weakest.avg}/100` : "Takes about 2 minutes"}
                </span>
                <button
                  onClick={() => void navigate({ to: "/practice" })}
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:translate-x-0.5 transition-transform cursor-pointer"
                >
                  {weakest ? "Practise now" : "Start first session"} <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Performance Metrics Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Average score card */}
          <div className="surface flex flex-col items-center justify-center p-6 text-center rounded-3xl">
            <ScoreRing score={avg} size={148} label="Average Score" />
            <div className="mt-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">
                Evaluated across {sessions.length} total attempt{sessions.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Improvement trajectory */}
          <div className="surface p-6 lg:col-span-2 flex flex-col justify-between rounded-3xl">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">Performance Trajectory</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Overall delivery score across your recent attempts
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600",
                  )}
                >
                  <TrendingUp className="size-3.5" />
                  {delta > 0 ? "+" : ""}
                  {delta} pts
                </span>
              </div>
              <div className="mt-4">
                <Sparkline values={series} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 pt-4 border-t border-border">
              <div className="flex items-center gap-3 rounded-xl bg-secondary/60 border border-border px-3.5 py-2.5">
                <div className="size-8 rounded-lg bg-accent text-primary flex items-center justify-center shrink-0">
                  <Target className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Current Focus
                  </span>
                  <span className="text-sm font-semibold truncate block">
                    {activeGoal.emoji} {activeGoal.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-secondary/60 border border-border px-3.5 py-2.5">
                <div className="size-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
                  <Flame className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Practice Habit
                  </span>
                  <span className="text-sm font-semibold block">
                    {streak(sessions)} day streak · target {profile.weeklyTarget}/wk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ProgressPanel sessions={sessions} profile={profile} />

        {/* Recent Sessions List */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Recent Attempts
              </h2>
              <p className="text-xs text-muted-foreground">
                Review your recorded voice analyses and AI feedback reports
              </p>
            </div>
            <Link
              to="/history"
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
            >
              History <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-2.5">
            {recent.length === 0 && (
              <div className="surface p-8 text-center border-dashed rounded-3xl">
                <div className="size-11 rounded-full bg-accent text-primary flex items-center justify-center mx-auto mb-2.5">
                  <Mic className="size-5" />
                </div>
                <p className="font-serif font-bold text-base">No practice sessions recorded yet</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  Select any speaking scenario and record a 60-second answer to generate your first score.
                </p>
                <Button
                  asChild
                  className="mt-4 h-9 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm"
                >
                  <Link to="/practice">Start your first session</Link>
                </Button>
              </div>
            )}
            {recent.map((s) => (
              <Link
                key={s.id}
                to="/results/$sessionId"
                params={{ sessionId: s.id }}
                className="surface flex items-center gap-4 p-4 transition-all hover:border-primary/40 hover:shadow-soft rounded-xl group"
              >
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold tabular-nums border",
                    scoreTone(s.analysis.overall) === "success" && "bg-emerald-50 text-emerald-600 border-emerald-200",
                    scoreTone(s.analysis.overall) === "warning" && "bg-amber-50 text-amber-600 border-amber-200",
                    scoreTone(s.analysis.overall) === "destructive" && "bg-red-50 text-red-600 border-red-200",
                  )}
                >
                  {s.analysis.overall}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {s.prompt}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{goalById(s.goal)?.label}</span>
                    <span>•</span>
                    <span>{timeAgo(s.createdAt)}</span>
                    <span>•</span>
                    <span>{s.durationSec}s</span>
                    {s.attempt > 1 && <span>• Attempt #{s.attempt}</span>}
                  </span>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
