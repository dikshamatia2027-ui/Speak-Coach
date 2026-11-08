import { Flame, Sparkles } from "lucide-react";
import { totalXP, xpLevel } from "@/lib/gamification";
import type { Session } from "@/lib/speakcoach";

export function XpBar({ sessions }: { sessions: Session[] }) {
  const xp = totalXP(sessions);
  const info = xpLevel(xp);

  return (
    <div className="surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-gradient-to-tr from-primary to-blue-500 text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md shadow-primary/25 shrink-0">
          Lvl {info.level}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground">{info.title}</h4>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning px-2 py-0.5 rounded-full bg-warning/10 border border-warning/20">
              <Sparkles className="size-3 fill-warning" /> {xp} Total XP
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {info.currentXp} / {info.nextLevelXp} XP to Level {info.level + 1}
          </p>
        </div>
      </div>

      <div className="w-full sm:max-w-xs space-y-1.5">
        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Level Progress</span>
          <span>{info.progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${info.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
