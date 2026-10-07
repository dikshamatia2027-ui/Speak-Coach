import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/hooks/use-store";
import { GOALS, averageScore, store } from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Profile & settings — SpeakCoach" },
      {
        name: "description",
        content:
          "Update your name, speaking goal, weekly practice target and coaching preferences in SpeakCoach.",
      },
      { property: "og:title", content: "Profile & settings — SpeakCoach" },
      {
        property: "og:description",
        content: "Your goal, weekly target and coaching preferences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { profile, sessions } = useStore();

  return (
    <AppShell>
      <h1 className="text-3xl font-bold sm:text-4xl">Profile & settings</h1>
      <p className="mt-2 text-muted-foreground">
        {sessions.length} sessions recorded · average score {averageScore(sessions)}
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="surface p-6">
          <h2 className="text-lg font-semibold">Your details</h2>
          <label className="mt-5 block text-sm font-medium">Name</label>
          <Input
            value={profile.name}
            placeholder="Your name"
            onChange={(e) => store.setProfile({ name: e.target.value })}
            className="mt-2 h-12 rounded-2xl px-4"
          />
          <p className="mt-6 text-sm font-medium">Sessions per week</p>
          <div className="mt-2 flex gap-2">
            {[2, 3, 5, 7].map((n) => (
              <button
                key={n}
                onClick={() => store.setProfile({ weeklyTarget: n })}
                className={cn(
                  "h-11 flex-1 rounded-2xl border text-sm font-semibold transition-colors",
                  profile.weeklyTarget === n
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="text-lg font-semibold">Practice goal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Drives the scenarios you get.</p>
          <div className="mt-4 space-y-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => store.setProfile({ goal: g.id })}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                  profile.goal === g.id ? "border-primary bg-accent" : "border-border bg-card",
                )}
              >
                <span className="text-sm font-medium">
                  {g.emoji} {g.label}
                </span>
                {profile.goal === g.id && <Check className="size-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="text-lg font-semibold">Coaching preferences</h2>
          <div className="mt-5 flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Practice reminders</span>
              <span className="block text-xs text-muted-foreground">
                Nudge me when I fall behind my weekly target.
              </span>
            </span>
            <Switch
              checked={profile.reminders}
              onCheckedChange={(v) => store.setProfile({ reminders: v })}
            />
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">Strict filler detection</span>
              <span className="block text-xs text-muted-foreground">
                Count softer fillers like "so" and "right".
              </span>
            </span>
            <Switch
              checked={profile.strictFillers}
              onCheckedChange={(v) => store.setProfile({ strictFillers: v })}
            />
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="text-lg font-semibold">Subscription &amp; Plan</h2>
          <div className="mt-4 rounded-2xl bg-secondary/80 p-4 border border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold capitalize">{profile.plan} Plan</span>
                  {profile.plan === "pro" ? (
                    <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-extrabold">
                      PRO UNLOCKED
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium">
                      3 sessions / week
                    </span>
                  )}
                </div>
              </div>
              {profile.plan === "pro" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    store.setProfile({ plan: "free" });
                    toast.info("Switched to Free plan");
                  }}
                >
                  Downgrade to Free
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => {
                    store.setProfile({ plan: "pro" });
                    toast.success("Upgraded to SpeakCoach Pro!");
                  }}
                >
                  Upgrade to Pro ($12/mo)
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {profile.plan === "pro"
                ? "You have unlimited weekly practice sessions, full access to specialized executive scenarios, and deep-dive speech analytics."
                : "Free plan includes 3 sessions per week and foundational metrics. Upgrade to Pro for unlimited sessions and specialized scenarios."}
            </p>
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sessions are saved on this device for now. Sign-in and cloud sync can be switched on
            later without losing this flow.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                store.clearHistory();
                toast.success("Practice history cleared");
              }}
            >
              Clear history
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                store.reset();
                toast.success("Everything reset to sample data");
              }}
            >
              Reset app data
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
