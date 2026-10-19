import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mic } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { GOALS, averageScore, goalById, scoreTone, sortedSessions, timeAgo } from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Practice history — SpeakCoach" },
      {
        name: "description",
        content:
          "Browse every speaking session you have recorded, filter by goal, and reopen any report to compare attempts.",
      },
      { property: "og:title", content: "Practice history — SpeakCoach" },
      {
        property: "og:description",
        content: "Every attempt, scored and searchable by goal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: History,
});

function History() {
  const { sessions } = useStore();
  const [filter, setFilter] = useState<string>("all");
  const all = sortedSessions(sessions);
  const list = filter === "all" ? all : all.filter((s) => s.goal === filter);

  return (
    <AppShell>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Practice history</h1>            <p className="mt-1 text-base text-muted-foreground">
              Review past speaking recordings, check metric trajectories, and reopen coaching reports.
            </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-border/80 bg-secondary/50 px-3 py-1.5 text-sm font-medium text-muted-foreground">
            {all.length} session{all.length === 1 ? "" : "s"} · Avg {averageScore(all)}
          </span>
        </div>
      </div>

      <div className="mt-6 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {[{ id: "all", label: "All goals" }, ...GOALS.map((g) => ({ id: g.id, label: g.label }))].map(
          (f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border/70 bg-card text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ),
        )}
      </div>

      <div className="mt-4 grid gap-3">
        {list.length === 0 && (
          <div className="surface p-10 text-center">
            <p className="text-base font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Record a session for this goal and it will appear here.
            </p>
            <Button asChild variant="hero" size="sm" className="mt-5">
              <Link to="/practice">
                <Mic className="size-4" /> Practice now
              </Link>
            </Button>
          </div>
        )}
        {list.map((s) => (
          <Link
            key={s.id}
            to="/results/$sessionId"
            params={{ sessionId: s.id }}
            className="surface group flex items-center gap-4 p-4 transition-all hover:border-border hover:shadow-soft sm:p-4.5"
          >
            <span
              className={cn(
                "font-display flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold",
                scoreTone(s.analysis.overall) === "success" && "border border-success/30 bg-success/10 text-success",
                scoreTone(s.analysis.overall) === "warning" && "border border-warning/30 bg-warning/15 text-warning",
                scoreTone(s.analysis.overall) === "destructive" &&
                  "border border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {s.analysis.overall}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold group-hover:text-primary transition-colors">{s.prompt}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-xs font-medium text-foreground">
                  {goalById(s.goal)?.label}
                </span>
                <span>•</span>
                <span>{timeAgo(s.createdAt)}</span>
                <span>•</span>
                <span>{s.analysis.wordsPerMinute} wpm</span>
                <span>•</span>
                <span>{s.analysis.fillerCount} fillers</span>
                {s.attempt > 1 && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-primary">Attempt {s.attempt}</span>
                  </>
                )}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
