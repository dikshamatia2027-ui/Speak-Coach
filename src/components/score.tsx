import { cn } from "@/lib/utils";

const toneClass = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

function tone(score: number) {
  return score >= 80 ? "success" : score >= 60 ? "warning" : "destructive";
}

export function ScoreRing({
  score,
  size = 148,
  label = "Overall score",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = Math.max(6, Math.round(size / 14));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--brand-orange)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="url(#ringGrad)"
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-foreground">{score}</span>
        <span className="mt-0.5 text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

export function MetricBar({
  label,
  score,
  detail,
  delta,
}: {
  label: string;
  score: number;
  detail?: string;
  delta?: number;
}) {
  return (
    <div className="animate-fade">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{label}</span>
        <span className="flex items-baseline gap-2">
          {typeof delta === "number" && delta !== 0 && (
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                delta > 0 ? "text-success" : "text-destructive",
              )}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          )}
          <span className={cn("text-sm font-bold tabular-nums", toneClass[tone(score)])}>
            {score}
          </span>
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="bg-brand h-full rounded-full"
          style={{ width: `${score}%`, transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </div>
      {detail && <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <p className="text-xs text-muted-foreground">Record at least two sessions to unlock your historical trajectory.</p>;
  }
  const w = 220;
  const h = 50;
  const min = Math.min(...values) - 4;
  const max = Math.max(...values) + 4;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / Math.max(1, max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="color-mix(in oklab, var(--primary) 25%, transparent)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill="url(#sparkFill)" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
