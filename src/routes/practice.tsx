import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, Square, ArrowLeft, RotateCcw, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  analyzeResponse,
  goalById,
  scenariosForGoal,
  store,
  type Scenario,
} from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice session — SpeakCoach" },
      {
        name: "description",
        content:
          "Pick a realistic speaking scenario, record your answer out loud, and get an instant coaching report.",
      },
      { property: "og:title", content: "Practice session — SpeakCoach" },
      {
        property: "og:description",
        content: "Speak, get analysed, retry — one scenario at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Practice,
});

type Phase = "pick" | "ready" | "countdown" | "recording" | "paused" | "analysing";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Animated waveform bars on a canvas. Amplitudes are simulated for the MVP —
 * TODO(api): drive these from a real AnalyserNode once microphone capture is
 * wired up.
 */
function Waveform({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const BAR_COUNT = 48;
    const levels = new Array<number>(BAR_COUNT).fill(0.08);
    let raf = 0;
    let t = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.045;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const gap = width / BAR_COUNT;
      const barWidth = Math.max(2 * dpr, gap * 0.45);
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.95)");
      gradient.addColorStop(0.55, "rgba(139, 92, 246, 0.95)");
      gradient.addColorStop(1, "rgba(217, 70, 239, 0.9)");
      ctx.fillStyle = gradient;

      for (let i = 0; i < BAR_COUNT; i++) {
        const target = activeRef.current
          ? 0.18 +
            0.55 *
              Math.abs(
                Math.sin(t * 1.6 + i * 0.55) * 0.6 +
                  Math.sin(t * 3.1 + i * 1.3) * 0.3 +
                  Math.sin(t * 0.9 + i * 0.21) * 0.35,
              ) *
              (0.55 + 0.45 * Math.sin(i * 0.7 + t * 0.4) ** 2)
          : 0.07;
        // Ease toward the target so bars feel fluid, not jumpy.
        const current = levels[i] ?? 0.08;
        const nextLevel = current + (target - current) * (activeRef.current ? 0.25 : 0.08);
        levels[i] = nextLevel;
        const h = Math.max(3 * dpr, nextLevel * height);
        const x = i * gap + (gap - barWidth) / 2;
        const y = (height - h) / 2;
        const r = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, r);
        ctx.fill();
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-20 w-full sm:h-24"
      aria-hidden="true"
    />
  );
}

function Practice() {
  const { profile } = store.get();
  const goalScenarios = useMemo(
    () => scenariosForGoal(profile.goal ?? "confidence"),
    [profile.goal],
  );
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [liveText, setLiveText] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const navigate = useNavigate();

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  function startCountdown() {
    setPhase("countdown");
    setCountdown(3);
    setElapsed(0);
    elapsedRef.current = 0;
    setLiveText("");
    let n = 3;
    timerRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        beginRecording();
      } else {
        setCountdown(n);
      }
    }, 900);
  }

  function beginRecording() {
    setPhase("recording");
    // TODO(api): swap for real speech-to-text streaming. For the MVP we
    // reveal the sample transcript progressively to simulate live captions.
    const words = scenario!.sampleTranscript.split(" ");
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      const next = elapsedRef.current;
      setElapsed(next);
      const shown = Math.min(
        words.length,
        Math.floor((next / scenario!.seconds) * words.length),
      );
      setLiveText(words.slice(0, shown).join(" "));
      if (next >= scenario!.seconds) finish(next);
    }, 1000);
  }

  function togglePause() {
    if (phase === "recording") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setPhase("paused");
    } else if (phase === "paused") {
      setPhase("recording");
      const words = scenario!.sampleTranscript.split(" ");
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        const next = elapsedRef.current;
        setElapsed(next);
        const shown = Math.min(
          words.length,
          Math.floor((next / scenario!.seconds) * words.length),
        );
        setLiveText(words.slice(0, shown).join(" "));
        if (next >= scenario!.seconds) finish(next);
      }, 1000);
    }
  }

  function finish(finalElapsed?: number) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("analysing");
    const duration = Math.max(finalElapsed ?? elapsedRef.current, 8);
    const sc = scenario!;
    // Mock analysis derived from the transcript. TODO(api): real AI call.
    const transcript = sc.sampleTranscript;
    const analysis = analyzeResponse(transcript, duration);
    const prior = store.get().sessions.filter((s) => s.scenarioId === sc.id).length;
    const session = {
      id: `s-${Date.now()}`,
      scenarioId: sc.id,
      goal: sc.goal,
      prompt: sc.prompt,
      transcript,
      durationSec: duration,
      createdAt: Date.now(),
      analysis,
      attempt: prior + 1,
    };
    store.addSession(session);
    setTimeout(() => {
      void navigate({ to: "/results/$sessionId", params: { sessionId: session.id } });
    }, 1400);
  }

  const isLive = phase === "recording";
  const isPaused = phase === "paused";
  const inSession = isLive || isPaused;

  return (
    <AppShell>
      {phase === "pick" && (
        <div className="animate-rise">
          <h1 className="text-3xl font-bold sm:text-4xl">Choose your scenario</h1>
          <p className="mt-2 text-muted-foreground">
            Based on your goal: {goalById(profile.goal ?? "confidence")?.label}. Each takes about a
            minute.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {goalScenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setScenario(sc);
                  setPhase("ready");
                }}
                className="surface group p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <p className="text-lg font-semibold group-hover:text-primary">{sc.prompt}</p>
                <p className="mt-2 text-sm text-muted-foreground">{sc.context}</p>
                <p className="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
                  {sc.seconds}s target
                </p>
              </button>
            ))}
          </div>
          {goalScenarios.length === 0 && (
            <p className="mt-8 text-sm text-muted-foreground">No scenarios for this goal yet.</p>
          )}
        </div>
      )}

      {phase === "ready" && scenario && (
        <div className="animate-rise mx-auto max-w-xl text-center">
          <button
            onClick={() => setPhase("pick")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All scenarios
          </button>
          <div className="surface p-8">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {goalById(scenario.goal)?.label}
            </p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{scenario.prompt}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{scenario.context}</p>
            <p className="mt-6 text-sm">
              Speak for about <strong>{scenario.seconds} seconds</strong>. Talk naturally — the
              coach handles the rest.
            </p>
            <Button variant="hero" size="xl" className="mt-8" onClick={startCountdown}>
              <Mic className="size-5" /> Start recording
            </Button>
          </div>
        </div>
      )}

      {phase === "countdown" && scenario && (
        <div className="animate-rise mx-auto flex max-w-xl flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">{scenario.prompt}</p>
          <div className="relative mt-12 flex size-36 items-center justify-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/25" />
            <span className="bg-soft absolute inset-0 rounded-full border border-border" />
            <span className="font-display text-brand text-7xl font-bold tabular-nums">
              {countdown}
            </span>
          </div>
          <p className="mt-10 text-sm font-medium text-muted-foreground">
            Get ready — take a breath
          </p>
        </div>
      )}

      {inSession && scenario && (
        <div className="animate-rise mx-auto max-w-xl text-center">
          <p className="text-sm font-medium text-muted-foreground">{scenario.prompt}</p>

          {/* Status chip */}
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide uppercase shadow-soft">
            <span
              className={cn(
                "size-2 rounded-full",
                isLive ? "animate-pulse bg-destructive" : "bg-warning",
              )}
            />
            {isLive ? "Recording" : "Paused"}
          </div>

          {/* Big mic */}
          <div className="mt-8 flex flex-col items-center">
            <div className="relative flex size-32 items-center justify-center sm:size-36">
              {isLive && (
                <>
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
                  <span
                    className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/20"
                    style={{ animationDelay: "0.8s" }}
                  />
                </>
              )}
              <div
                className={cn(
                  "bg-brand shadow-glow relative flex size-28 items-center justify-center rounded-full transition-all duration-300 sm:size-32",
                  isPaused && "scale-95 opacity-80 shadow-soft",
                )}
              >
                <Mic className="size-11 text-primary-foreground sm:size-12" />
              </div>
            </div>

            {/* Timer */}
            <p className="font-display mt-7 text-6xl font-bold tabular-nums tracking-tight">
              {formatTime(elapsed)}
            </p>
            <p className="mt-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {isLive
                ? `Listening… target ${formatTime(scenario.seconds)}`
                : "Paused — resume when ready"}
            </p>
          </div>

          {/* Waveform */}
          <div className="surface mt-8 px-4 py-3">
            <Waveform active={isLive} />
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={togglePause}
              aria-label={isLive ? "Pause recording" : "Resume recording"}
              className="surface flex size-14 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              {isLive ? (
                <Pause className="size-6 fill-foreground text-foreground" />
              ) : (
                <Play className="size-6 fill-foreground text-foreground" />
              )}
            </button>
            <button
              onClick={() => finish()}
              aria-label="Stop and analyse"
              className="bg-brand shadow-glow flex h-14 items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <Square className="size-4 fill-primary-foreground" />
              Stop &amp; analyse
            </button>
          </div>

          {/* Live transcript */}
          <div className="surface mt-8 min-h-28 p-5 text-left">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Live transcript
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {liveText || (
                <span className="text-muted-foreground">
                  {isLive ? "Start speaking…" : "Transcript paused"}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {phase === "analysing" && (
        <div className="animate-rise mx-auto flex max-w-sm flex-col items-center py-24 text-center">
          <span className="bg-brand shadow-glow flex size-16 items-center justify-center rounded-full">
            <RotateCcw className="size-6 animate-spin text-primary-foreground" />
          </span>
          <h1 className="mt-6 text-2xl font-bold">Analysing your delivery…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scoring pace, filler words, clarity and confidence.
          </p>
        </div>
      )}
    </AppShell>
  );
}
