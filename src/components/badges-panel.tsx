import { Trophy, CheckCircle2, Lock } from "lucide-react";
import { BADGES, earnedBadges } from "@/lib/gamification";
import type { Session } from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export function BadgesPanel({ sessions }: { sessions: Session[] }) {
  const earned = earnedBadges(sessions);
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <div className="surface p-5 sm:p-6 rounded-3xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Trophy className="size-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-foreground">Speaking Achievements</h3>
            <p className="text-xs text-muted-foreground">Unlock badges as you improve consistency & quality</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground">
          {earned.length} / {BADGES.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BADGES.map((badge) => {
          const isUnlocked = earnedIds.has(badge.id);

          return (
            <div
              key={badge.id}
              className={cn(
                "rounded-2xl border p-3.5 flex flex-col justify-between transition-all",
                isUnlocked
                  ? "bg-card border-primary/30 shadow-xs hover:border-primary/60"
                  : "bg-secondary/40 border-border/60 opacity-60 grayscale-[0.6]"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{badge.emoji}</span>
                  {isUnlocked ? (
                    <CheckCircle2 className="size-4 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <Lock className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-foreground truncate">{badge.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
