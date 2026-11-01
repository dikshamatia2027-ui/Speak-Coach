import { Link, useRouterState } from "@tanstack/react-router";
import { LoginPanel } from "@/components/login-panel";
import { useAuth } from "@/lib/auth";
import {
  BarChart3,
  BookOpen,
  Crown,
  Home,
  Mic,
  Settings,
  UserRound,
  Zap,
  Sparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/dashboard" className={cn("flex items-center gap-2 group transition-opacity hover:opacity-90", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
        <Mic className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <span className="font-serif text-lg leading-none font-bold tracking-tight text-foreground">
        Speak<span className="text-primary">Coach</span>
      </span>
    </Link>
  );
}

const DESKTOP_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/practice", label: "Speak Practice", icon: Mic },
  { to: "/vocabulary", label: "Vocabulary", icon: Sparkles },
  { to: "/reading", label: "Reading", icon: BookOpen },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/settings", label: "Profile", icon: UserRound },
] as const;

const MOBILE_BOTTOM_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/vocabulary", label: "Vocabulary", icon: Sparkles },
  { to: "/practice", label: "Speak", icon: Mic, center: true },
  { to: "/reading", label: "Reading", icon: BookOpen },
  { to: "/progress", label: "Progress", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useStore();
  const { user, loading: authLoading } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const isPro = profile.plan === "pro";
  const signedIn = !authLoading && !!user;

  const displayName = profile.name?.trim() || "Sarina";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/15 antialiased">
      <ProUpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      {signedIn ? (
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:w-[280px] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 border-r border-border bg-card">
            <div className="flex h-16 items-center px-6">
              <Logo />
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const isActive = path === item.to || (item.to === "/progress" && path === "/history");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-border">
              {!isPro && (
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full justify-center gap-2"
                  size="sm"
                >
                  <Zap className="size-3.5" /> Upgrade to Pro
                </Button>
              )}
              {isPro && (
                <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
                  <Crown className="size-4 text-warning" />
                  <span className="font-medium">Pro Plan</span>
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 lg:pl-[280px] flex flex-col">
            {/* Top Header */}
            <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 lg:hidden">
                  <Logo />
                </div>
                <div className="hidden lg:block">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Welcome back, <span className="text-foreground font-semibold">{displayName}</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2.5">
                  {isPro ? (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/30 px-2.5 py-1 text-xs font-bold text-warning">
                      <Crown className="size-3 fill-warning" /> PRO
                    </span>
                  ) : (
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      variant="outline"
                      size="sm"
                      className="hidden sm:inline-flex items-center gap-1"
                    >
                      <Zap className="size-3.5" /> Upgrade
                    </Button>
                  )}
                  <Link
                    to="/settings"
                    aria-label="User profile settings"
                    className="relative flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className="flex size-full items-center justify-center rounded-full bg-accent text-primary font-semibold text-sm">
                      {initials}
                    </div>
                  </Link>
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8 flex-1 pb-32 sm:pb-36 lg:pb-10">
              {authLoading ? (
                <p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>
              ) : (
                children
              )}
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
              <Logo />
            </div>
          </header>
          <main className="mx-auto w-full max-w-2xl px-4 pt-5 sm:px-6 flex-1 pb-12">
            {authLoading ? (
              <p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              <LoginPanel />
            )}
          </main>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {signedIn && (
        <nav
          aria-label="Bottom Navigation"
          className="lg:hidden fixed inset-x-0 bottom-0 z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-md px-3 pb-3">
            <div className="relative flex items-center justify-between rounded-full bg-card/95 backdrop-blur-xl border border-border shadow-dock px-2 py-2">
              {MOBILE_BOTTOM_NAV.map((item: any) => {
                const isActive = path === item.to || (item.to === "/progress" && path === "/history");
                const Icon = item.icon;

                if (item.center) {
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-label={item.label}
                      className="absolute left-1/2 -translate-x-1/2 -top-6 flex items-center justify-center"
                    >
                      <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform hover:scale-105 active:scale-95">
                        <Icon className="size-6 text-white" strokeWidth={2.5} />
                      </span>
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
                      "relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
                    <span className="text-[10px] font-medium leading-none">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
