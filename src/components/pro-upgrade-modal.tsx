import * as React from "react";
import { AlertCircle, Check, Crown, Loader2, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStore } from "@/hooks/use-store";
import { FREE_WEEKLY_LIMIT, store } from "@/lib/speakcoach";

const PRO_BENEFITS = [
  {
    title: "Unlimited practice sessions",
    desc: `Free tier is limited to ${FREE_WEEKLY_LIMIT} sessions/week. Pro has zero limits.`,
    icon: Zap,
  },
  {
    title: "Specialized high-stakes scenarios",
    desc: "Executive defense, salary negotiation, crisis town halls & procurement pitch scenarios.",
    icon: Crown,
  },
  {
    title: "Advanced Deep-Dive Analytics",
    desc: "Filler word distribution radar, pacing cadence graphs, sentiment & vocabulary diversity metrics.",
    icon: Sparkles,
  },
  {
    title: "Granular speech breakdown",
    desc: "Word-by-word pause detection and tailored syllable clarity feedback.",
    icon: Check,
  },
];

export function ProUpgradeModal({
  open,
  onOpenChange,
  triggerReason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerReason?: "quota_reached" | "scenario_locked" | "advanced_analytics" | null;
}) {
  const { profile } = useStore();
  const isPro = profile.plan === "pro";
  const [loading, setLoading] = React.useState(false);
  const [showSetup, setShowSetup] = React.useState(false);
  const [paymentLinkInput, setPaymentLinkInput] = React.useState(profile.dodoPaymentLink || "");

  async function handleUpgrade(overrideLink?: string) {
    const linkToUse = overrideLink || paymentLinkInput || profile.dodoPaymentLink;

    // If a direct Dodo payment link is known, redirect immediately
    if (linkToUse && linkToUse.trim().startsWith("http")) {
      toast.info("Redirecting to Dodo Payments checkout...");
      window.location.href = linkToUse.trim();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name || undefined,
          returnUrl: `${window.location.origin}/checkout/success`,
          paymentLink: linkToUse || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok && data.checkoutUrl) {
        toast.info("Redirecting to Dodo Payments checkout...");
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.missingConfig) {
        setShowSetup(true);
        toast.error("Dodo Payments is not configured yet. Please provide your Dodo payment link or API key.");
        return;
      }

      toast.error(data.error || "Failed to start checkout. Please try again.");
    } catch (err: any) {
      console.error("Checkout error:", err);
      setShowSetup(true);
      toast.error("Could not connect to payment gateway. Please verify Dodo Payments setup.");
    } finally {
      setLoading(false);
    }
  }

  function handleSaveAndPay() {
    if (!paymentLinkInput.trim() || !paymentLinkInput.trim().startsWith("http")) {
      toast.error("Please enter a valid Dodo checkout link (e.g. https://test.checkout.dodopayments.com/buy/...)");
      return;
    }
    store.setProfile({ dodoPaymentLink: paymentLinkInput.trim() });
    void handleUpgrade(paymentLinkInput.trim());
  }

  function handleDevBypass() {
    store.setProfile({ plan: "pro" });
    toast.success("Welcome to SpeakCoach Pro! (Unlocked in manual dev mode)");
    onOpenChange(false);
  }

  const headline =
    triggerReason === "quota_reached"
      ? `You've reached your free limit of ${FREE_WEEKLY_LIMIT} sessions this week`
      : triggerReason === "scenario_locked"
        ? "Unlock Specialized Pro Scenarios"
        : triggerReason === "advanced_analytics"
          ? "Unlock Advanced Pro Analytics"
          : "Upgrade to SpeakCoach Pro";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-border shadow-2xl rounded-3xl bg-card">
        {/* Header gradient banner */}
        <div className="relative bg-brand p-6 sm:p-8 text-primary-foreground">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-foreground/80">
            <Crown className="size-4 text-warning fill-brand-yellow" />
            SpeakCoach Pro
          </div>
          <DialogHeader className="mt-2 text-left">
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary-foreground">
              {headline}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/90 text-sm sm:text-base mt-1.5">
              Take your spoken communication to executive level with unlimited AI coaching and deeper analytics.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Feature comparison list */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid gap-4">
            {PRO_BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-3.5">
                <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <b.icon className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{b.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing pill */}
          <div className="rounded-2xl bg-secondary/80 p-4 flex items-center justify-between border border-border/60">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monthly Plan</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold tabular-nums">$12</span>
                <span className="text-xs text-muted-foreground">/ month · cancel anytime</span>
              </div>
            </div>
            <span className="rounded-full bg-primary/15 text-primary text-xs font-bold px-3 py-1">
              7-day risk-free
            </span>
          </div>

          {/* Dodo Payments Connection Panel (shows if API key is missing or user wants direct link) */}
          {showSetup && !isPro && (
            <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4 space-y-3 animate-rise">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-warning">Dodo Payments Checkout</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    To ask users for real payment, paste your <strong>Dodo Product Payment Link</strong> below (from Dodo Dashboard → Products → Share Link) or set <code className="text-[11px] bg-muted px-1 py-0.5 rounded">DODO_PAYMENTS_API_KEY</code> in Vercel.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://test.checkout.dodopayments.com/buy/pdt_..."
                  value={paymentLinkInput}
                  onChange={(e) => setPaymentLinkInput(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <Button
                  size="sm"
                  variant="hero"
                  className="h-auto text-xs px-3 font-semibold"
                  onClick={handleSaveAndPay}
                >
                  Pay with Dodo
                </Button>
              </div>
              <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                <span>Testing without payment?</span>
                <button
                  type="button"
                  onClick={handleDevBypass}
                  className="underline hover:text-foreground transition-colors font-medium"
                >
                  (Dev Only) Skip payment &amp; unlock Pro
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isPro ? (
              <Button
                variant="hero"
                size="xl"
                disabled={loading}
                className="w-full flex-1 gap-2 text-base font-bold shadow-glow"
                onClick={handleUpgrade}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Connecting to Dodo Payments...
                  </>
                ) : (
                  <>
                    <Zap className="size-4 fill-primary-foreground" /> Upgrade to Pro now
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full flex-1"
                onClick={handleDowngrade}
              >
                Switch to Free Plan
              </Button>
            )}
            <Button
              variant="ghost"
              size="lg"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
