import { Link, useRouterState } from "@tanstack/react-router";
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
      <span className="flex size-8 items-center justify-center rounded-xl bg-[#ff5277] text-white shadow-md shadow-[#ff5277]/25">
        <Mic className="size-4 text-white" strokeWidth={2.5} />
      </span>
      <span className="font-serif text-lg leading-none font-bold tracking-tight text-foreground">
        Speak<span className="text-[#ff5277]">Coach</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isPro = profile.plan === "pro";

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
    <div className="min-h-screen bg-[#fbf9f6] text-foreground flex flex-col selection:bg-[#ff5277]/20 antialiased">
      {/* Top Header matching Figma reference (Menu on left, Avatar on right) */}
      <header className="sticky top-0 z-40 border-b border-[#ede8e1]/80 bg-[#fbf9f6]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="flex size-9 items-center justify-center rounded-xl bg-white border border-[#ede8e1] text-foreground/80 hover:text-foreground hover:bg-[#f4f2ee] transition-colors cursor-pointer shadow-xs"
            >
              <Menu className="size-4.5" />
            </button>
            <Logo />
          </div>

          <div className="flex items-center gap-2.5">
            {isPro ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3e7] border border-[#ff9e43]/30 px-2.5 py-1 text-[11px] font-bold text-[#ff9e43]">
                <Crown className="size-3 fill-[#ff9e43]" /> PRO
              </span>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#fdebf1] border border-[#ff5277]/25 px-2.5 py-1 text-[11px] font-semibold text-[#ff5277] hover:bg-[#ff5277]/15 transition-colors cursor-pointer"
                title="Upgrade to Pro"
              >
                <Zap className="size-3 fill-[#ff5277]" /> Upgrade to Pro
              </button>
            )}

            {/* Circular Profile Avatar (Right Header Icon from Figma) */}
            <Link
              to="/settings"
              aria-label="User profile settings"
              className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff5277] to-[#ff9e43] p-0.5 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <div className="flex size-full items-center justify-center rounded-full bg-white text-[#ff5277] font-serif font-bold text-xs">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </Link>
          </div>
        </div>

        {/* Mobile dropdown menu triggered by Hamburger */}
        {showMobileMenu && (
          <div className="border-t border-[#ede8e1] bg-white px-4 py-3 shadow-lg sm:hidden animate-fade">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    path === item.to
                      ? "bg-[#fdebf1] text-[#ff5277] font-semibold"
                      : "text-muted-foreground hover:bg-[#f4f2ee] hover:text-foreground",
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
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff5277] px-3 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
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
      <main className="mx-auto w-full max-w-2xl lg:max-w-4xl px-4 pt-5 pb-32 sm:px-6 sm:pb-36 flex-1">
        {children}
      </main>

      {/* Floating White Pill Bottom Dock (Exact signature navigation from Figma) */}
      <nav aria-label="Bottom Navigation" className="fixed bottom-5 inset-x-0 mx-auto w-fit z-50 px-3">
        <div className="flex items-center gap-4 sm:gap-7 rounded-full bg-white/95 backdrop-blur-xl border border-[#ede8e1] shadow-dock px-5 py-2.5 sm:px-7 sm:py-3 transition-all">
          {NAV_ITEMS.map((item) => {
            const isActive = path === item.to;
            const Icon = item.icon;

            if (item.hero) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  className="group relative flex size-12 items-center justify-center rounded-full bg-[#ff5277] text-white shadow-lg shadow-[#ff5277]/35 transition-all hover:scale-110 active:scale-95"
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
                    ? "text-[#ff5277]"
                    : "text-[#6b667a] hover:text-[#1c1a24] hover:bg-[#f4f2ee]/60",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform group-hover:scale-110",
                    isActive && "stroke-[2.5]",
                  )}
                />
                {isActive && (
                  <span className="absolute -bottom-1 size-1 rounded-full bg-[#ff5277]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
