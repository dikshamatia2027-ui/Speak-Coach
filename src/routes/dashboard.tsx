import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Crown,
  Flame,
  MessageSquare,
  Mic,
  Play,
  Radio,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
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
  store,
  type GoalId,
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

const MOOD_CATEGORIES: Array<{
  id: GoalId;
  label: string;
  icon: typeof Sparkles;
  bgColor: string;
  shadowColor: string;
}> = [
  {
    id: "confidence",
    label: "Confident",
    icon: Sparkles,
    bgColor: "bg-[#ff5277]",
    shadowColor: "shadow-[#ff5277]/30",
  },
  {
    id: "interview",
    label: "Interview",
    icon: MessageSquare,
    bgColor: "bg-[#8c9eff]",
    shadowColor: "shadow-[#8c9eff]/30",
  },
  {
    id: "pitch",
    label: "Pitch",
    icon: Flame,
    bgColor: "bg-[#ff9e43]",
    shadowColor: "shadow-[#ff9e43]/30",
  },
  {
    id: "meeting",
    label: "Meeting",
    icon: Target,
    bgColor: "bg-[#4cd0ba]",
    shadowColor: "shadow-[#4cd0ba]/30",
  },
];

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
            Welcome back, <span className="text-[#ff5277]">{userName}</span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            How do you want to practice today?
          </p>
        </div>

        {/* 4 Colorful Squircles / Category Buttons in a Row (Figma Screen 2) */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {MOOD_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = profile.goal === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectGoal(cat.id)}
                className={cn(
                  "group relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-white shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer aspect-square",
                  cat.bgColor,
                  cat.shadowColor,
                  isSelected && "ring-4 ring-offset-2 ring-[#ff5277]/40 ring-offset-[#fbf9f6]",
                )}
              >
                <div className="flex size-9 sm:size-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs transition-transform group-hover:scale-110">
                  <Icon className="size-5 sm:size-6 text-white stroke-[2.5]" />
                </div>
                <span className="mt-2 text-[11px] sm:text-xs font-bold tracking-tight text-white/95">
                  {cat.label}
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
                ? "border-[#ff5277]/30 bg-[#fdebf1] text-[#1c1a24]"
                : "border-[#ede8e1] bg-white text-[#1c1a24] shadow-xs",
            )}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={cn(
                  "size-8 rounded-xl flex items-center justify-center shrink-0",
                  isLimitReached ? "bg-[#ff5277] text-white" : "bg-[#fdebf1] text-[#ff5277]",
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
                  ? "bg-[#ff5277] text-white hover:bg-[#ff5277]/90"
                  : "border-[#ff5277]/30 text-[#ff5277] hover:bg-[#fdebf1]",
              )}
              onClick={() => setShowUpgradeModal(true)}
            >
              <Crown className="size-3 fill-current" /> {isLimitReached ? "Unlock Unlimited" : "Upgrade"}
            </Button>
          </div>
        )}

        {/* "Today's Task" Section (Exact Figma Middle Screen) */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Today's Task
            </h2>
            <Link
              to="/practice"
              className="text-xs font-semibold text-[#ff5277] hover:underline flex items-center gap-1"
            >
              See all <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {/* Card 1: Soft Pink Tinted Card */}
            <div className="card-pink p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#ff5277]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#ff5277] uppercase tracking-wider">
                    <Radio className="size-3 text-[#ff5277] animate-pulse" /> Live Drill
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-white text-[#ff5277] shadow-xs">
                    <Users className="size-4.5" />
                  </div>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground mt-3 group-hover:text-[#ff5277] transition-colors">
                  Executive Speech Drill
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#1c1a24]/75 leading-relaxed">
                  Practice high-stakes delivery, eliminate filler words, and master pitch presence.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#ff5277]/15 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  60s duration • Confidence focus
                </span>
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#ff5277] group-hover:translate-x-0.5 transition-transform"
                >
                  Join Now <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Soft Peach Tinted Card */}
            <div className="card-peach p-5 sm:p-6 transition-all hover:shadow-md flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-[#ff9e43]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#ff9e43] uppercase tracking-wider">
                    06:00 PM • 3 min drill
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-white text-[#ff9e43] shadow-xs">
                    <Flame className="size-4.5" />
                  </div>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground mt-3 group-hover:text-[#ff9e43] transition-colors">
                  Meditation &amp; Pacing
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#1c1a24]/75 leading-relaxed">
                  Breathe deep and calibrate your vocal pacing to an optimal 130–150 words per minute.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#ff9e43]/15 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Cadence &amp; pause training
                </span>
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#ff9e43] group-hover:translate-x-0.5 transition-transform"
                >
                  Start Drill <ArrowRight className="size-3.5" />
                </Link>
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2 pt-4 border-t border-[#ede8e1]">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f4f2ee]/70 border border-[#ede8e1] px-3.5 py-2.5">
                <div className="size-8 rounded-xl bg-[#fdebf1] text-[#ff5277] flex items-center justify-center shrink-0">
                  <Target className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Current Focus
                  </span>
                  <span className="text-xs sm:text-sm font-semibold truncate block">
                    {activeGoal.emoji} {activeGoal.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#f4f2ee]/70 border border-[#ede8e1] px-3.5 py-2.5">
                <div className="size-8 rounded-xl bg-[#fef3e7] text-[#ff9e43] flex items-center justify-center shrink-0">
                  <Flame className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Practice Habit
                  </span>
                  <span className="text-xs sm:text-sm font-semibold block">
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
              className="text-xs font-semibold text-[#ff5277] hover:underline flex items-center gap-1"
            >
              History <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="grid gap-2.5">
            {recent.length === 0 && (
              <div className="surface p-8 text-center border-dashed rounded-3xl">
                <div className="size-11 rounded-full bg-[#fdebf1] text-[#ff5277] flex items-center justify-center mx-auto mb-2.5">
                  <Mic className="size-5" />
                </div>
                <p className="font-serif font-bold text-base">No practice sessions recorded yet</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  Select any speaking scenario and record a 60-second answer to generate your first score.
                </p>
                <Button
                  asChild
                  className="mt-4 h-9 px-5 rounded-full bg-[#ff5277] text-white text-xs font-semibold hover:bg-[#ff5277]/90 shadow-sm"
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
                className="surface flex items-center gap-4 p-4 transition-all hover:border-[#ff5277]/40 hover:shadow-soft rounded-2xl group"
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
                  <span className="block truncate text-sm font-semibold text-foreground group-hover:text-[#ff5277] transition-colors">
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
                <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-[#ff5277] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
