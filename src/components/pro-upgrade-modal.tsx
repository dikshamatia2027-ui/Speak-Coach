import * as React from "react";
import { getAccessToken } from "@/lib/supabase";
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

  async function handleUpgrade() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error("Please sign in first.");
        return;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.name || undefined,
          returnUrl: `${window.location.origin}/checkout/success`,
        }),
      });

      const data = await res.json();
      if (data.ok && data.checkoutUrl) {
        toast.info("Redirecting to checkout...");
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data.missingConfig) {
        toast.error("Payments are not switched on yet. Please check back soon.");
        return;
      }
      toast.error(data.error || "Failed to start checkout. Please try again.");
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Could not reach the payment page. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManagePlan() {
    try {
      const res = await fetch("/api/customer-portal");
      const data = await res.json();
      window.open(data.portalUrl || "https://customer.dodopayments.com", "_blank", "noopener,noreferrer");
    } catch {
      window.open("https://customer.dodopayments.com", "_blank", "noopener,noreferrer");
    }
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
          <div className="rounded-2xl bg-secondary/80 p-4 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monthly Plan</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-extrabold tabular-nums">₹299</span>
                  <span className="text-xs text-muted-foreground">/ month · or ₹1,499 / 6 mo</span>
                </div>
              </div>
              <span className="rounded-full bg-primary/15 text-primary text-xs font-bold px-3 py-1">
                Risk-free · Cancel anytime
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2">
              Preparing for a single interview or GD round? Get the <strong>₹99 Big Day Pack</strong> (10 sessions) at checkout.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isPro ? (
              <Button
                variant="hero"
                size="xl"
                disabled={loading}
                className="w-full flex-1 gap-2 text-base font-bold shadow-glow"
                onClick={() => void handleUpgrade()}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Opening checkout...
                  </>
                ) : (
                  <>
                    <Zap className="size-4 fill-primary-foreground" /> Upgrade to Pro (₹299/mo)
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full flex-1"
                onClick={() => void handleManagePlan()}
              >
                Manage subscription
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
