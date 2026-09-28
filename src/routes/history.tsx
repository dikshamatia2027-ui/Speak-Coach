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
      <h1 className="text-3xl font-bold sm:text-4xl">Practice history</h1>
      <p className="mt-2 text-muted-foreground">
        {all.length} session{all.length === 1 ? "" : "s"} · average score {averageScore(all)}
      </p>

      <div className="mt-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {[{ id: "all", label: "All" }, ...GOALS.map((g) => ({ id: g.id, label: g.label }))].map(
          (f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
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
            <p className="font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Record a session for this goal and it will appear here.
            </p>
            <Button asChild variant="hero" className="mt-5">
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
                {goalById(s.goal)?.label} · {timeAgo(s.createdAt)} · {s.analysis.wordsPerMinute} wpm
                · {s.analysis.fillerCount} fillers
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
