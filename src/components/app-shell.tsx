import { Link, useRouterState } from "@tanstack/react-router";
import { LoginPanel } from "@/components/login-panel";
import { useAuth } from "@/lib/auth";
import {
  BookOpen,
  Clock,
  Crown,
  Home,
  Menu,
  Mic,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/dashboard" className={cn("flex items-center gap-2 group transition-opacity hover:opacity-90", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
        <Mic className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <span className="font-serif text-lg leading-none font-bold tracking-tight text-foreground">
        Speak<span className="text-primary">Coach</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useStore();
  const { user, loading: authLoading } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isPro = profile.plan === "pro";
  const signedIn = !authLoading && !!user;

  const displayName = profile.name?.trim() || "Sarina";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const NAV_ITEMS = [
    { to: "/dashboard", label: "Home", icon: Home },
    { to: "/practice", label: "Practice", icon: Mic, hero: true },
    { to: "/vocabulary", label: "Vocab", icon: Sparkles },
    { to: "/history", label: "History", icon: Clock },
    { to: "/settings", label: "Profile", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/15 antialiased">
      {/* Top Header matching Figma reference (Menu on left, Avatar on right) */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {signedIn && (
            <button
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="flex size-9 items-center justify-center rounded-xl bg-card border border-border text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shadow-xs"
            >
              <Menu className="size-4.5" />
            </button>
            )}
            <Logo />
          </div>

          {signedIn && (
          <div className="flex items-center gap-2.5">
            {isPro ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/30 px-2.5 py-1 text-xs font-bold text-warning">
                <Crown className="size-3 fill-warning" /> PRO
              </span>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-accent border border-primary/25 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                title="Upgrade to Pro"
              >
                <Zap className="size-3 fill-primary" /> Upgrade to Pro
              </button>
            )}

            {/* Circular Profile Avatar (Right Header Icon from Figma) */}
            <Link
              to="/settings"
              aria-label="User profile settings"
              className="relative flex size-10 items-center justify-center rounded-full border-2 border-primary/70 bg-accent p-0.5 text-primary shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <div className="flex size-full items-center justify-center rounded-full bg-card text-primary font-serif font-bold text-sm">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </Link>
          </div>
          )}
        </div>

        {/* Mobile dropdown menu triggered by Hamburger */}
        {signedIn && showMobileMenu && (
          <div className="border-t border-border bg-card px-4 py-3 shadow-lg sm:hidden animate-fade">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    path === item.to
                      ? "bg-accent text-primary font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              {!isPro && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowUpgradeModal(true);
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow-sm cursor-pointer"
                >
                  <Crown className="size-3.5 fill-white" /> Unlock Pro Unlimited
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <ProUpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      {/* Main Content Area */}
      <main className={cn("mx-auto w-full max-w-2xl lg:max-w-4xl px-4 pt-5 sm:px-6 flex-1", signedIn ? "pb-40 sm:pb-44" : "pb-12")}>
        {authLoading ? (
          <p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>
        ) : user ? (
          children
        ) : (
          <LoginPanel />
        )}
      </main>

      {/* Floating White Pill Bottom Dock (Exact signature navigation from Figma) */}
      {signedIn && (
      <nav aria-label="Bottom Navigation" className="fixed inset-x-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-3">
        <div className="flex items-center gap-4 sm:gap-7 rounded-full bg-card/95 backdrop-blur-xl border border-border shadow-dock px-5 py-2.5 sm:px-7 sm:py-3 transition-all">
          {NAV_ITEMS.map((item) => {
            const isActive = path === item.to;
            const Icon = item.icon;

            if (item.hero) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  className="group relative flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-110 active:scale-95"
                >
                  <Icon className="size-5.5 text-white" strokeWidth={2.5} />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  "relative flex flex-col items-center justify-center size-10 rounded-full transition-all group",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform group-hover:scale-110",
                    isActive && "stroke-[2.5]",
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 size-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}
