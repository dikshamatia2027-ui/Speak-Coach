import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar,
  Clock,
  Flame,
  Mic,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ScoreRing, Sparkline } from "@/components/score";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import {
  averageScore,
  currentWeekSessions,
  FREE_WEEKLY_LIMIT,
  sortedSessions,
  streak,
  timeAgo,
  trend,
} from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SpeakCoach" },
      {
        name: "description",
        content: "Track your speaking progress and practice with AI feedback.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, sessions } = useStore();
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const isPro = profile.plan === "pro";

  const allSorted = sortedSessions(sessions);
  const recent = allSorted.slice(0, 4);
  const avg = averageScore(sessions);
  const userStreak = streak(sessions);
  const thisWeekSessions = currentWeekSessions(sessions);
  const sessionsThisWeek = thisWeekSessions.length;
  const weeklyGoal = isPro ? 7 : FREE_WEEKLY_LIMIT;
  const goalProgress = Math.min(100, Math.round((sessionsThisWeek / weeklyGoal) * 100));

  const delta = trend(sessions);
  const series = [...sessions]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-8)
    .map((s) => s.analysis.overall);

  const practiceTimeMins = useMemo(() => {
    if (!sessions.length) return 45;
    const total = sessions.reduce((acc) => acc + 8, 0); // estimate ~8 min per session
    return total > 120 ? 120 : total;
  }, [sessions]);

  const wordsLearned = useMemo(() => {
    if (!sessions.length) return 128;
    return Math.min(999, sessions.length * 12 + 80);
  }, [sessions]);

  const displayName = profile.name?.trim() || "there";

  // Speaking skills averages
  const skillAverages = useMemo(() => {
    if (!sessions.length) {
      return [
        { label: "Clarity", value: 78 },
        { label: "Pace", value: 74 },
        { label: "Pronunciation", value: 76 },
        { label: "Vocabulary", value: 72 },
        { label: "Delivery", value: 80 },
      ];
    }
    const metrics = ["clarity", "pace", "pronunciation", "vocabulary", "delivery"] as const;
    return metrics.map((m) => {
      const scores = sessions
        .flatMap((s) => s.analysis.metrics.filter((x) => x.id === m).map((x) => x.score))
        .filter((v): v is number => typeof v === "number");
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;
      const labelMap: Record<string, string> = {
        clarity: "Clarity",
        pace: "Pace",
        pronunciation: "Pronunciation",
        vocabulary: "Vocabulary",
        delivery: "Delivery",
      };
      return { label: labelMap[m], value: avgScore };
    });
  }, [sessions]);

  const overallSkillScore = useMemo(() => {
    if (avg) return avg;
    const sum = skillAverages.reduce((a, b) => a + b.value, 0);
    return Math.round(sum / skillAverages.length);
  }, [avg, skillAverages]);

  return (
    <AppShell>
      <div className="space-y-6 animate-rise">
        {/* Welcome Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Continue your journey to speak with confidence
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm">
              <Flame className="size-4 text-orange-500" />
              <span className="font-semibold">{userStreak}</span>
              <span className="text-muted-foreground">day streak</span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            to="/practice"
            className="group relative overflow-hidden rounded-2xl border border-border bg-[#EEF4FC] p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Practice Speaking</h3>
                <p className="mt-1 text-sm text-muted-foreground">AI-powered speaking practice</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mic className="size-5" />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-primary group-hover:underline">Start Practice →</div>
          </Link>

          <Link
            to="/vocabulary"
            className="group relative overflow-hidden rounded-2xl border border-border bg-[#F3F0FC] p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Build Vocabulary</h3>
                <p className="mt-1 text-sm text-muted-foreground">Learn and practice new words</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                <Sparkles className="size-5" />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-violet-600 group-hover:underline">Explore Vocabulary →</div>
          </Link>

          <Link
            to="/reading"
            className="group relative overflow-hidden rounded-2xl border border-border bg-[#FAF5EE] p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Reading Coach</h3>
                <p className="mt-1 text-sm text-muted-foreground">Improve reading skills</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                <BookOpen className="size-5" />
              </div>
            </div>
            <div className="mt-4 text-sm font-medium text-amber-600 group-hover:underline">Start Reading →</div>
          </Link>
        </div>

        {/* Progress and Skills Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Learning Progress */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Learning Progress</h2>
              <div className="inline-flex items-center rounded-lg border border-border bg-secondary p-1 text-xs">
                {(["week", "month", "year"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-md px-2.5 py-1 capitalize transition-colors",
                      period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{practiceTimeMins}m</p>
                <p className="text-xs text-muted-foreground">Practice Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{sessionsThisWeek}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avg || 0}</p>
                <p className="text-xs text-muted-foreground">Avg. Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{wordsLearned}</p>
                <p className="text-xs text-muted-foreground">Words Learned</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Performance Trend</span>
                {delta !== 0 && (
                  <span className={cn("flex items-center gap-1", delta > 0 ? "text-emerald-600" : "text-amber-600")}>
                    <TrendingUp className="size-3.5" />
                    {delta > 0 ? "+" : ""}
                    {delta} pts
                  </span>
                )}
              </div>
              <div className="mt-3 h-16">
                <Sparkline values={series.length ? series : [65, 68, 72, 70, 75, 78, 76, 80]} />
              </div>
            </div>
          </div>

          {/* Speaking Skills */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Speaking Skills</h2>
            <div className="mt-6 flex flex-col items-center sm:flex-row sm:items-center sm:gap-6">
              <div className="flex flex-col items-center">
                <ScoreRing score={overallSkillScore} size={110} label="Overall score" />
                <p className="mt-2 text-sm font-medium text-foreground">Overall Score</p>
              </div>
              <div className="mt-6 flex-1 w-full space-y-3 sm:mt-0">
                {skillAverages.map((skill) => (
                  <div key={skill.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{skill.label}</span>
                      <span className="text-muted-foreground">{skill.value}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${skill.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Practice */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Practice</h2>
              <Link to="/history" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recent.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">No practice sessions yet</p>
                  <Button asChild size="sm" className="mt-3">
                    <Link to="/practice">
                      <Mic className="size-4" /> Start your first practice
                    </Link>
                  </Button>
                </div>
              ) : (
                recent.map((session) => (
                  <Link
                    key={session.id}
                    to="/results/$sessionId"
                    params={{ sessionId: session.id }}
                    className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-accent text-primary">
                        <Mic className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{session.prompt}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(session.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{session.analysis.overall}</div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Weekly Goal</h2>
              <Target className="size-5 text-muted-foreground" />
            </div>
            <div className="mt-6 flex flex-col items-center">
              <div className="relative flex size-32 items-center justify-center">
                <svg className="size-32 -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-secondary" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - goalProgress / 100)}`}
                    className="text-primary transition-all"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-foreground">{sessionsThisWeek}/{weeklyGoal}</span>
                  <span className="text-xs text-muted-foreground">sessions</span>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {goalProgress >= 100
                  ? "Great job! You've reached your weekly goal!"
                  : `${weeklyGoal - sessionsThisWeek} more session${weeklyGoal - sessionsThisWeek === 1 ? "" : "s"} to reach your goal`}
              </p>
              <Button asChild className="mt-4">
                <Link to="/practice">
                  <Calendar className="size-4" /> Practice Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
