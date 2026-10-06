import { Link, useRouterState } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vocabulary", label: "Vocabulary" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Profile" },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="bg-brand flex size-9 items-center justify-center rounded-xl shadow-glow">
        <Mic className="size-4 text-primary-foreground" strokeWidth={2.5} />
      </span>
      <span className="font-display text-[1.05rem] leading-none font-bold tracking-tight">
        Speak<span className="text-brand">Coach</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="bg-soft min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  path === item.to
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button asChild variant="hero" size="sm">
            <Link to="/practice">Practice</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 sm:pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-md">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 py-3.5 text-center text-xs font-semibold transition-colors",
                path === item.to ? "text-primary" : "text-muted-foreground",
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
