import { Link } from "@tanstack/react-router";
import { Award, Check, Flame, Trophy } from "lucide-react";
import {
  longestStreak, milestones, personalBests, streak, weekDays, type Profile, type Session,
} from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export function ProgressPanel({ sessions, profile }: { sessions: Session[]; profile: Profile }) {
  const week = weekDays(sessions);
  const done = week.reduce((n, d) => n + d.count, 0);
  const pct = Math.min(100, Math.round((done / profile.weeklyTarget) * 100));
  const current = streak(sessions);
  const best = longestStreak(sessions);
  const pb = personalBests(sessions);
  const ms = milestones(sessions);
  const achieved = ms.filter((m) => m.done).length;
  const next = ms.filter((m) => !m.done).sort((a, b) => b.current / b.target - a.current / a.target).slice(0, 3);

  return (
    <section className="mt-8" aria-labelledby="progress-heading">
      <div className="mb-4">
        <h2 id="progress-heading" className="text-lg font-bold tracking-tight text-foreground">Weekly Milestones &amp; Consistency</h2>
        <p className="text-xs text-muted-foreground">Keep momentum across consecutive days to lock in vocal habits</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekly target & calendar */}
        <div className="surface p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Weekly Goal</span>
              <span className="font-semibold tabular-nums text-foreground">{done} / {profile.weeklyTarget} sessions</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="bg-brand h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {week.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={cn(
                    "size-7 rounded-md border flex items-center justify-center text-[10px] font-bold transition-colors",
                    d.count > 0 ? "bg-primary text-primary-foreground border-transparent shadow-xs" : "border-border/80 bg-secondary/40 text-muted-foreground",
                    d.isFuture && "opacity-40",
                    d.isToday && d.count === 0 && "border-primary text-primary font-extrabold"
                  )}>
                    {d.count > 0 ? d.count : ""}
                  </span>
                  <span className={cn("text-[10px] text-muted-foreground", d.isToday && "font-bold text-foreground")}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
            <Flame className="size-4 text-warning" />
            <p className="text-xs">
              <span className="font-bold tabular-nums text-foreground">{current}-day active streak</span>
              <span className="text-muted-foreground"> · all-time best: {best}d</span>
            </p>
          </div>
        </div>

        {/* Personal bests */}
        <div className="surface p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[11px] text-foreground">
                <Trophy className="size-3.5 text-amber-500" /> High Score
              </span>
              {pb.overall && (
                <span className="text-xs text-muted-foreground">Best single attempt</span>
              )}
            </div>
            {pb.overall ? (
              <Link to="/results/$sessionId" params={{ sessionId: pb.overall.id }} className="mt-2.5 flex items-baseline gap-2 hover:opacity-85 transition-opacity group">
                <span className="font-display text-3xl font-extrabold tabular-nums text-foreground group-hover:text-primary transition-colors">{pb.overall.analysis.overall}</span>
                <span className="text-xs text-muted-foreground">/ 100 pts · inspect details →</span>
              </Link>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Complete one practice session to record your baseline personal best.</p>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3">
            {pb.metrics.map((m) => (
              <div key={m.id} className="flex items-baseline justify-between gap-1 text-xs">
                <dt className="truncate text-muted-foreground text-[11px]">{m.label}</dt>
                <dd className="font-bold tabular-nums text-foreground">{m.score || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Milestones */}
        <div className="surface p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[11px] text-foreground">
                <Award className="size-3.5 text-primary" /> Core Milestones
              </span>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">{achieved} / {ms.length}</span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {next.map((m) => (
                <li key={m.id}>
                  <div className="flex items-baseline justify-between gap-1 text-xs">
                    <span className="font-medium text-foreground">{m.title}</span>
                    <span className="tabular-nums text-[11px] text-muted-foreground">{m.current}/{m.target}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary/80 transition-all duration-500" style={{ width: `${(m.current / m.target) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {achieved > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 border-t border-border pt-3">
              {ms.filter((m) => m.done).map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 rounded-md bg-secondary/80 border border-border/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
                  <Check className="size-2.5 text-success" /> {m.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
