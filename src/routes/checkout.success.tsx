import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Crown, Mic, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/checkout/success")({
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  const { profile } = useStore();
  const { refreshPlan } = useAuth();
  const isPro = profile.plan === "pro";
  const [gaveUp, setGaveUp] = React.useState(false);

  // Pro is switched on by the payment webhook on the server. Here we only wait for it to arrive.
  React.useEffect(() => {
    let tries = 0;
    const id = setInterval(async () => {
      tries += 1;
      const plan = await refreshPlan();
      if (plan === "pro") clearInterval(id);
      else if (tries >= 20) {
        clearInterval(id);
        setGaveUp(true);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [refreshPlan]);

  if (!isPro) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-16 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {gaveUp ? "We're still confirming your payment" : "Confirming your payment…"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {gaveUp
              ? "This is taking longer than usual. If you were charged, Pro will switch on automatically within a few minutes. You can close this page."
              : "This usually takes a few seconds. Please keep this page open."}
          </p>
          <Button asChild variant="outline" size="lg" className="mt-6">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-6 sm:py-12 text-center animate-rise">
        {/* Celebration Badge */}
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-soft">
          <Crown className="size-7" />
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Payment Successful via Dodo Payments
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Welcome to SpeakCoach Pro!
        </h1>

        <p className="mt-2 text-sm text-muted-foreground sm:text-base max-w-md mx-auto">
          Your subscription is now active. All weekly session limits and specialized scenarios have been unlocked for your account.
        </p>

        {/* Unlocked Features Summary */}
        <div className="mt-8 surface p-6 text-left border border-border/80 shadow-soft">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Unlocked on your account
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4" />
              </span>
              <span><strong>Unlimited sessions</strong> — practice as many times as you like</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4" />
              </span>
              <span><strong>High-Stakes Scenarios</strong> — Executive defenses, negotiations &amp; pitches</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4" />
              </span>
              <span><strong>Advanced Analytics</strong> — Filler distribution, pacing stability &amp; cadence</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/practice">
              <Mic className="size-4" /> Start Practicing Now
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/dashboard">
              Go to Dashboard <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
