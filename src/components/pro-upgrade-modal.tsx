import * as React from "react";
import { getAccessToken } from "@/lib/supabase";
import { AlertCircle, Bell, Check, Clock, Crown, Loader2, Sparkles, X, Zap } from "lucide-react";
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

          {/* Coming Soon banner */}
          <div className="rounded-2xl border border-warning/30 bg-brand-yellow/5 p-4 flex items-start gap-3">
            <div className="size-8 rounded-lg bg-brand-yellow/15 text-warning flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Paid plans launching soon 🚀</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                We're putting the final touches on payments. Lock in your spot — pricing stays the same once we go live.
              </p>
            </div>
          </div>

          {/* Pricing pill */}
          <div className="rounded-2xl bg-secondary/80 p-4 border border-border/60 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Upcoming pricing</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 rounded-xl bg-background border border-border/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pro Monthly</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-extrabold tabular-nums">₹299</span>
                    <span className="text-[11px] text-muted-foreground">/ month</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">or ₹1,499 for 6 months</p>
                </div>
                <div className="flex-1 rounded-xl bg-background border border-border/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Big Day Pack</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-extrabold tabular-nums">₹99</span>
                    <span className="text-[11px] text-muted-foreground">one-time</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">10 sessions · no renewal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              variant="hero"
              size="xl"
              className="w-full flex-1 gap-2 text-base font-bold shadow-glow"
              onClick={() => {
                toast.success("You're on the list! We'll notify you the moment payments go live.", { duration: 4000 });
                onOpenChange(false);
              }}
            >
              <Bell className="size-4 fill-primary-foreground" /> Notify me when live
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Continue for free
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
