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

      {/* Top Banner / Welcome header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Public Speaking Workspace</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {profile.name ? `Welcome back, ${profile.name}` : "Speaking Dashboard"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track your delivery pace, tone clarity, and prepare for your next talk.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {!isPro && (
            <Button
              variant="outline"
              size="sm"
              className="border-brand-yellow/30 text-warning  hover:bg-brand-yellow/10 font-medium gap-1.5 h-9"
              onClick={() => setShowUpgradeModal(true)}
            >
              <Crown className="size-3.5 fill-brand-yellow" /> Go Pro
            </Button>
          )}
          <Button asChild variant="hero" size="sm" className="h-9 px-4 gap-1.5 font-semibold">
            <Link to="/practice">
              <Mic className="size-3.5" /> Start Practice Session
            </Link>
          </Button>
        </div>
      </div>

      {/* Free tier usage alert if limit reached or getting close */}
      {!isPro && (
        <div
          className={cn(
            "mt-5 rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-all",
            isLimitReached
              ? "border-brand-yellow/40 bg-brand-yellow/5 text-warning "
              : "border-border bg-card text-foreground shadow-xs",
          )}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center shrink-0",
                isLimitReached ? "bg-brand-yellow/15 text-warning " : "bg-primary/10 text-primary",
              )}
            >
              <Zap className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm">
                {isLimitReached
                  ? `Weekly Limit Reached (${sessionsThisWeek}/${FREE_WEEKLY_LIMIT} free sessions completed)`
                  : `Free Plan: ${sessionsThisWeek} of ${FREE_WEEKLY_LIMIT} weekly sessions used`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLimitReached
                  ? "Resets next Monday. Upgrade to Pro for unlimited sessions and specialized executive scenarios."
                  : `${Math.max(0, FREE_WEEKLY_LIMIT - sessionsThisWeek)} session${FREE_WEEKLY_LIMIT - sessionsThisWeek === 1 ? "" : "s"} remaining this week.`}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={isLimitReached ? "hero" : "outline"}
            className="shrink-0 h-8 text-xs font-semibold gap-1 self-start sm:self-auto"
            onClick={() => setShowUpgradeModal(true)}
          >
            <Crown className="size-3 fill-current" /> {isLimitReached ? "Unlock Unlimited" : "Upgrade"}
          </Button>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Average score card */}
        <div className="surface flex flex-col items-center justify-center p-6 text-center">
          <ScoreRing score={avg} size={148} label="Average Score" />
          <div className="mt-3 text-center">
            <span className="text-xs font-medium text-muted-foreground">
              Evaluated across {sessions.length} total attempt{sessions.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Improvement trend & goals */}
        <div className="surface p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Performance Trajectory</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Overall score trends over your last 8 sessions
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold",
                  delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                )}
              >
                <TrendingUp className="size-3.5" />
                {delta > 0 ? "+" : ""}
                {delta} pts
              </span>
            </div>
            <div className="mt-3">
              <Sparkline values={series} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 pt-4 border-t border-border">
            <div className="flex items-center gap-3 rounded-lg bg-secondary/60 border border-border/40 px-3.5 py-2.5">
              <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Target className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Focus</span>
                <span className="text-sm font-semibold truncate block">
                  {goal.emoji} {goal.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-secondary/60 border border-border/40 px-3.5 py-2.5">
              <div className="size-8 rounded-md bg-warning/15 text-warning flex items-center justify-center shrink-0">
                <Flame className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Practice Habit</span>
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
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Recent Sessions</h2>
            <p className="text-xs text-muted-foreground">Review your recorded transcripts and AI coaching feedback</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground">
            <Link to="/history">
              View all history <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-2.5">
          {recent.length === 0 && (
            <div className="surface p-8 text-center border-dashed">
              <div className="size-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                <Mic className="size-5" />
              </div>
              <p className="font-semibold text-sm">No practice sessions recorded yet</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Select any speaking scenario and record a 60-second answer to generate your first score.
              </p>
              <Button asChild variant="hero" size="sm" className="mt-4 h-8 text-xs font-medium">
                <Link to="/practice">Start your first session</Link>
              </Button>
            </div>
          )}
          {recent.map((s) => (
            <Link
              key={s.id}
              to="/results/$sessionId"
              params={{ sessionId: s.id }}
              className="surface flex items-center gap-4 p-4 transition-all hover:border-primary/40 hover:shadow-xs group"
            >
              <span
                className={cn(
                  "font-display flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold tabular-nums border",
                  scoreTone(s.analysis.overall) === "success" && "bg-success/10 text-success border-success/20",
                  scoreTone(s.analysis.overall) === "warning" && "bg-warning/15 text-warning border-warning/20",
                  scoreTone(s.analysis.overall) === "destructive" && "bg-destructive/10 text-destructive border-destructive/20",
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
              <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
