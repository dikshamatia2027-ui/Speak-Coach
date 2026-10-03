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
      <h2 id="progress-heading" className="text-xl font-bold">Progress</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        <div className="surface p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">This week</p>
            <p className="text-sm tabular-nums text-muted-foreground">{done} / {profile.weeklyTarget} sessions</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="bg-brand h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-5 grid grid-cols-7 gap-1.5 text-center">
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className={cn("size-7 rounded-lg border transition-colors",
                  d.count > 0 ? "bg-brand border-transparent" : "border-border bg-card",
                  d.isFuture && "opacity-50", d.isToday && d.count === 0 && "border-primary")} />
                <span className={cn("text-[11px] text-muted-foreground", d.isToday && "font-semibold text-foreground")}>{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
            <Flame className="size-5 text-warning" />
            <p className="text-sm"><span className="font-semibold tabular-nums">{current}-day streak</span>
              <span className="text-muted-foreground"> · best {best}</span></p>
          </div>
        </div>

        <div className="surface p-6">
          <p className="flex items-center gap-2 text-sm font-semibold"><Trophy className="size-4 text-primary" /> Personal bests</p>
          {pb.overall ? (
            <Link to="/results/$sessionId" params={{ sessionId: pb.overall.id }} className="mt-4 flex items-baseline gap-2 hover:opacity-80">
              <span className="font-display text-4xl font-bold tabular-nums text-brand">{pb.overall.analysis.overall}</span>
              <span className="text-xs text-muted-foreground">overall · view report</span>
            </Link>
          ) : <p className="mt-4 text-sm text-muted-foreground">Record a session to set your first best.</p>}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {pb.metrics.map((m) => (
              <div key={m.id} className="flex items-baseline justify-between gap-2 text-sm">
                <dt className="truncate text-muted-foreground">{m.label}</dt>
                <dd className="font-semibold tabular-nums">{m.score || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="surface p-6">
          <div className="flex items-baseline justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold"><Award className="size-4 text-primary" /> Milestones</p>
            <p className="text-sm tabular-nums text-muted-foreground">{achieved} / {ms.length}</p>
          </div>
          <ul className="mt-4 flex flex-col gap-3.5">
            {next.map((m) => (
              <li key={m.id}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{m.title}</span>
                  <span className="tabular-nums text-xs text-muted-foreground">{m.current}/{m.target}</span>
                </div>
                <p className="text-xs text-muted-foreground">{m.detail}</p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${(m.current / m.target) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {achieved > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
              {ms.filter((m) => m.done).map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  <Check className="size-3" /> {m.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
