import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Crown, Flame, Mic, Target, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
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
  scoreTone,
  sortedSessions,
  streak,
  timeAgo,
  trend,
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

function Dashboard() {
  const { profile, sessions } = useStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = profile.plan === "pro";
  const thisWeekSessions = currentWeekSessions(sessions);
  const sessionsThisWeek = thisWeekSessions.length;
  const isLimitReached = !isPro && sessionsThisWeek >= FREE_WEEKLY_LIMIT;

  const recent = sortedSessions(sessions).slice(0, 5);
  const avg = averageScore(sessions);
  const delta = trend(sessions);
  const goal = goalById(profile.goal) ?? goalById("confidence")!;
  const series = [...sessions]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-8)
    .map((s) => s.analysis.overall);

  return (
    <AppShell>
      <ProUpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      <div className="animate-rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {profile.name ? `Welcome back, ${profile.name}` : "Welcome back"}
          </p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Ready to speak?</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isPro && (
            <Button
              variant="outline"
              size="lg"
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold gap-1.5"
              onClick={() => setShowUpgradeModal(true)}
            >
              <Crown className="size-4 fill-amber-500" /> Go Pro
            </Button>
          )}
          <Button asChild variant="hero" size="xl">
            <Link to="/practice">
              <Mic className="size-4" /> Practice now
            </Link>
          </Button>
        </div>
      </div>

      {/* Free tier usage alert if limit reached or getting close */}
      {!isPro && (
        <div
          className={cn(
            "mt-6 rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
            isLimitReached
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-border/80 bg-card shadow-soft",
          )}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                isLimitReached ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary",
              )}
            >
              <Zap className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {isLimitReached
                  ? `Free Weekly Limit Reached (${sessionsThisWeek}/${FREE_WEEKLY_LIMIT} sessions completed)`
                  : `Free Plan: ${sessionsThisWeek} of ${FREE_WEEKLY_LIMIT} weekly sessions used`}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLimitReached
                  ? "Upgrade to Pro to practice without restrictions, access specialized executive scenarios, and view advanced analytics."
                  : `You have ${Math.max(0, FREE_WEEKLY_LIMIT - sessionsThisWeek)} practice session${FREE_WEEKLY_LIMIT - sessionsThisWeek === 1 ? "" : "s"} left this week.`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isLimitReached ? "hero" : "outline"}
            className="shrink-0 gap-1.5 font-bold"
            onClick={() => setShowUpgradeModal(true)}
          >
            <Crown className="size-3.5 fill-current" /> {isLimitReached ? "Unlock Unlimited with Pro" : "Upgrade to Pro"}
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="surface flex flex-col items-center justify-center gap-3 p-8">
          <ScoreRing score={avg} label="Average score" />
          <p className="text-sm text-muted-foreground">
            Across {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="surface p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Improvement trend</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recent attempts compared with your earlier ones
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold",
                delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              <TrendingUp className="size-4" />
              {delta > 0 ? "+" : ""}
              {delta} pts
            </span>
          </div>
          <div className="mt-4">
            <Sparkline values={series} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
              <Target className="size-5 text-primary" />
              <span>
                <span className="block text-xs text-muted-foreground">Current goal</span>
                <span className="text-sm font-semibold">
                  {goal.emoji} {goal.label}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
              <Flame className="size-5 text-warning" />
              <span>
                <span className="block text-xs text-muted-foreground">Practice streak</span>
                <span className="text-sm font-semibold">
                  {streak(sessions)} day{streak(sessions) === 1 ? "" : "s"} · target{" "}
                  {profile.weeklyTarget}/week
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProgressPanel sessions={sessions} profile={profile} />

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">Recent sessions</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/history">
            View all <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        {recent.length === 0 && (
          <div className="surface p-10 text-center">
            <p className="font-semibold">No sessions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your first recording takes about a minute.
            </p>
            <Button asChild variant="hero" className="mt-5">
              <Link to="/practice">Start now</Link>
            </Button>
          </div>
        )}
        {recent.map((s) => (
          <Link
            key={s.id}
            to="/results/$sessionId"
            params={{ sessionId: s.id }}
            className="surface flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span
              className={cn(
                "font-display flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold",
                scoreTone(s.analysis.overall) === "success" && "bg-success/10 text-success",
                scoreTone(s.analysis.overall) === "warning" && "bg-warning/15 text-warning",
                scoreTone(s.analysis.overall) === "destructive" &&
                  "bg-destructive/10 text-destructive",
              )}
            >
              {s.analysis.overall}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{s.prompt}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {goalById(s.goal)?.label} · {timeAgo(s.createdAt)} · {s.durationSec}s
                {s.attempt > 1 ? ` · attempt ${s.attempt}` : ""}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
