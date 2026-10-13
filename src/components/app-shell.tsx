import { Link, useRouterState } from "@tanstack/react-router";
import { Crown, Mic, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vocabulary", label: "Vocabulary" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Profile" },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group transition-opacity hover:opacity-90", className)}>
      <span className="bg-brand flex size-8 items-center justify-center rounded-lg shadow-sm">
        <Mic className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <span className="font-display text-base leading-none font-bold tracking-tight text-foreground">
        Speak<span className="text-primary">Coach</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = profile.plan === "pro";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            {isPro ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-yellow/10 border border-brand-yellow/25 px-2 py-0.5 text-[11px] font-bold text-warning ">
                <Crown className="size-3 fill-brand-yellow text-warning" /> PRO
              </span>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="hidden md:inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                title="Upgrade to Pro"
              >
                <Zap className="size-3 text-warning fill-brand-yellow" /> Free Plan · Upgrade
              </button>
            )}
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                  path === item.to
                    ? "bg-secondary text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            {!isPro && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex border-brand-yellow/30 text-warning  hover:bg-brand-yellow/10 font-semibold gap-1 text-xs h-8 px-3"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Crown className="size-3.5 fill-brand-yellow" /> Upgrade
              </Button>
            )}
            <Button asChild variant="hero" size="sm" className="h-8 px-3.5 text-xs font-semibold shadow-xs">
              <Link to="/practice">
                <Mic className="size-3.5" /> Practice
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <ProUpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 sm:pb-16 flex-1">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-md">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 py-3 text-center text-xs font-medium transition-colors",
                path === item.to ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
