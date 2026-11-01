import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — SpeakCoach" },
      {
        name: "description",
        content: "Track your speaking progress and improvement over time.",
      },
    ],
  }),
  component: Progress,
});

function Progress() {
  return (
    <AppShell>
      <div className="space-y-6 animate-rise">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Progress
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Track your learning journey and improvements.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <BarChart3 className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Your progress</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View your detailed practice history to track improvements over time.
          </p>
          <Button asChild className="mt-4">
            <Link to="/history">View Practice History</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
