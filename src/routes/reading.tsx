import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/reading")({
  head: () => ({
    meta: [
      { title: "Reading Coach — SpeakCoach" },
      {
        name: "description",
        content: "Improve your reading and comprehension skills with SpeakCoach.",
      },
    ],
  }),
  component: Reading,
});

function Reading() {
  return (
    <AppShell>
      <div className="space-y-6 animate-rise">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Reading Coach
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Practice reading aloud and build comprehension skills.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <BookOpen className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Coming soon</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reading Coach features are being prepared. Practice speaking and vocabulary in the meantime.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
