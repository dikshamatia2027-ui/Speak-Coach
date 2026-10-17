import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";
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
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  async function handleOpenPortal() {
    try {
      const res = await fetch("/api/customer-portal");
      const data = await res.json();
      if (data.portalUrl) {
        window.open(data.portalUrl, "_blank", "noopener,noreferrer");
      } else {
        window.open("https://customer.dodopayments.com", "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open("https://customer.dodopayments.com", "_blank", "noopener,noreferrer");
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="border-b border-border/60 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Profile &amp; Preferences</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage your practice cadence, coaching strictness, and plan subscription.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* User details & weekly target */}
          <div className="surface p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Speaker Profile</h2>
              <label className="mt-4 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Name</label>
              <Input
                value={profile.name}
                placeholder="e.g. Alex Chen"
                onChange={(e) => store.setProfile({ name: e.target.value })}
                className="mt-1.5 h-10 rounded-lg px-3 text-sm"
              />
              <label className="mt-4 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weekly Target (Sessions)</label>
              <div className="mt-1.5 flex gap-1.5">
                {[2, 3, 5, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => store.setProfile({ weeklyTarget: n })}
                    className={cn(
                      "h-9 flex-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer",
                      profile.weeklyTarget === n
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {n} / wk
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              Total sessions recorded: <span className="font-semibold text-foreground">{sessions.length}</span> · Average speech score: <span className="font-semibold text-foreground">{averageScore(sessions)} pts</span>
            </p>
          </div>

          {/* Goal selection */}
          <div className="surface p-5">
            <h2 className="text-sm font-bold text-foreground">Primary Focus Goal</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Drives your scenario recommendations in the practice tab.</p>
            <div className="mt-3 space-y-1.5">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => store.setProfile({ goal: g.id })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer",
                    profile.goal === g.id
                      ? "border-primary bg-primary/5 text-foreground font-semibold"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <span className="text-xs flex items-center gap-2">
                    <span>{g.emoji}</span>
                    <span>{g.label}</span>
                  </span>
                  {profile.goal === g.id && <Check className="size-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Coaching preferences */}
          <div className="surface p-5">
            <h2 className="text-sm font-bold text-foreground">Coaching Engine Preferences</h2>
            <div className="mt-3 flex items-center justify-between gap-4 py-2 border-b border-border/50">
              <div>
                <span className="block text-xs font-semibold text-foreground">Practice reminders</span>
                <span className="block text-[11px] text-muted-foreground">
                  Nudge when falling behind weekly commitment.
                </span>
              </div>
              <Switch
                checked={profile.reminders}
                onCheckedChange={(v) => store.setProfile({ reminders: v })}
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 py-2">
              <div>
                <span className="block text-xs font-semibold text-foreground">Strict filler detection</span>
                <span className="block text-[11px] text-muted-foreground">
                  Include softer conversational words like "so", "well", and "right".
                </span>
              </div>
              <Switch
                checked={profile.strictFillers}
                onCheckedChange={(v) => store.setProfile({ strictFillers: v })}
              />
            </div>
          </div>

          {/* Plan management */}
          <div className="surface p-5">
            <h2 className="text-sm font-bold text-foreground">Subscription &amp; Quota</h2>
            <div className="mt-3 rounded-lg bg-secondary/60 p-3.5 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Status</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold capitalize text-foreground">{profile.plan} Membership</span>
                    {profile.plan === "pro" ? (
                      <span className="rounded-md bg-brand-yellow/15 text-warning  px-1.5 py-0.5 text-[10px] font-extrabold">
                        PRO UNLIMITED
                      </span>
                    ) : (
                      <span className="rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-[10px] font-semibold border border-border">
                        3 sessions / wk
                      </span>
                    )}
                  </div>
                </div>
                {profile.plan === "pro" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium gap-1"
                      onClick={handleOpenPortal}
                    >
                      Billing Portal <ExternalLink className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        store.setProfile({ plan: "free" });
                        toast.info("Switched to Free plan");
                      }}
                    >
                      Downgrade
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="hero"
                    size="sm"
                    className="h-8 text-xs font-bold"
                    onClick={() => setUpgradeOpen(true)}
                  >
                    Go Pro ($12/mo)
                  </Button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                {profile.plan === "pro"
                  ? "Unlimited sessions, specialized executive scenarios, and acoustic analytics enabled via Dodo Payments."
                  : "3 sessions/week included. Upgrade with Dodo Payments for unlimited practice and executive scenarios."}
              </p>

              {/* Optional Dodo Payment Link Configuration */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <label className="text-[11px] font-semibold text-foreground block">
                  Dodo Hosted Payment Link
                </label>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Product payment link from Dodo Dashboard (Products → Share Link) to direct customers straight to checkout.
                </p>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="https://test.checkout.dodopayments.com/buy/pdt_..."
                    value={profile.dodoPaymentLink || ""}
                    onChange={(e) => store.setProfile({ dodoPaymentLink: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
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

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </AppShell>
  );
}
