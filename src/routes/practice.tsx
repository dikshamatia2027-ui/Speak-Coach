import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, Square, ArrowLeft, RotateCcw, Pause, Play, Crown, Lock, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";
import {
  checkPracticeAccess,
  currentWeekSessions,
  FREE_WEEKLY_LIMIT,
  goalById,
  scenariosForGoal,
  store,
  type Analysis,
  type Scenario,
} from "@/lib/speakcoach";
import { startRecording, type Recorder } from "@/lib/record-wav";
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

/** Animated waveform bars driven by the live microphone AnalyserNode. */
function Waveform({
  active,
  analyser,
}: {
  active: boolean;
  analyser: React.RefObject<AnalyserNode | null>;
}) {
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
    let buf: Uint8Array<ArrayBuffer> | null = null;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const gap = width / BAR_COUNT;
      const barWidth = Math.max(2 * dpr, gap * 0.45);
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.95)");
      gradient.addColorStop(0.55, "rgba(139, 92, 246, 0.95)");
      gradient.addColorStop(1, "rgba(217, 70, 239, 0.9)");
      ctx.fillStyle = gradient;

      const node = analyser.current;
      if (node && activeRef.current) {
        if (!buf || buf.length !== node.frequencyBinCount) buf = new Uint8Array(node.frequencyBinCount);
        node.getByteFrequencyData(buf);
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        // Mirror around the centre so voice energy (low bins) sits in the middle.
        const dist = Math.abs(i - (BAR_COUNT - 1) / 2) / (BAR_COUNT / 2);
        const bin = buf ? (buf[Math.floor(dist * buf.length * 0.6)] ?? 0) / 255 : 0;
        const target = activeRef.current && node ? 0.07 + bin * 0.9 : 0.07;
        const current = levels[i] ?? 0.08;
        const nextLevel = current + (target - current) * (activeRef.current ? 0.35 : 0.08);
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
  const { profile, sessions } = store.get();
  const isPro = profile.plan === "pro";
  const thisWeekSessions = useMemo(() => currentWeekSessions(sessions), [sessions]);
  const sessionsThisWeek = thisWeekSessions.length;
  const isWeeklyLimitReached = !isPro && sessionsThisWeek >= FREE_WEEKLY_LIMIT;

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalTriggerReason, setModalTriggerReason] = useState<
    "quota_reached" | "scenario_locked" | "advanced_analytics" | null
  >(null);

  const goalScenarios = useMemo(
    () => scenariosForGoal(profile.goal ?? "confidence"),
    [profile.goal],
  );
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [analysingStep, setAnalysingStep] = useState("Transcribing your answer…");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const recorderRef = useRef<Recorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.cancel();
      abortRef.current?.abort();
    },
    [],
  );

  function handleSelectScenario(sc: Scenario) {
    if (!isPro && sc.tier === "pro") {
      setModalTriggerReason("scenario_locked");
      setShowUpgradeModal(true);
      return;
    }
    if (!isPro && isWeeklyLimitReached) {
      setModalTriggerReason("quota_reached");
      setShowUpgradeModal(true);
      return;
    }
    setScenario(sc);
    setPhase("ready");
  }

  async function startCountdown() {
    if (!isPro && isWeeklyLimitReached) {
      setModalTriggerReason("quota_reached");
      setShowUpgradeModal(true);
      return;
    }
    if (!isPro && scenario?.tier === "pro") {
      setModalTriggerReason("scenario_locked");
      setShowUpgradeModal(true);
      return;
    }

    setError(null);
    // Ask for the mic first so the permission prompt doesn't interrupt the countdown.
    try {
      const rec = await startRecording();
      rec.setPaused(true);
      recorderRef.current = rec;
      analyserRef.current = rec.analyser;
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser settings and try again."
          : "We couldn't start your microphone. Check it's connected and try again.",
      );
      return;
    }
    setPhase("countdown");
    setCountdown(3);
    setElapsed(0);
    elapsedRef.current = 0;
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

  function tick() {
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      // Hard cap well under the transcription size limit.
      if (elapsedRef.current >= Math.max(scenario!.seconds * 3, 180)) void finish();
    }, 1000);
  }

  function beginRecording() {
    setPhase("recording");
    recorderRef.current?.setPaused(false);
    tick();
  }

  function togglePause() {
    if (phase === "recording") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      recorderRef.current?.setPaused(true);
      setPhase("paused");
    } else if (phase === "paused") {
      recorderRef.current?.setPaused(false);
      setPhase("recording");
      tick();
    }
  }

  async function finish() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = recorderRef.current;
    recorderRef.current = null;
    analyserRef.current = null;
    if (!rec) return;
    const sc = scenario!;
    const duration = Math.max(elapsedRef.current, 1);
    setPhase("analysing");
    setAnalysingStep("Transcribing your answer…");
    const stepTimer = setTimeout(() => setAnalysingStep("Scoring your delivery…"), 4000);
    try {
      const audio = await rec.stop();
      const form = new FormData();
      form.append("audio", audio);
      form.append("durationSec", String(duration));
      form.append("prompt", sc.prompt);
      form.append("goal", sc.goal);
      abortRef.current = new AbortController();
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
        signal: abortRef.current.signal,
      });
      const body = (await res.json().catch(() => ({}))) as {
        transcript?: string;
        analysis?: Analysis;
        error?: string;
      };
      if (!res.ok || !body.analysis || !body.transcript) {
        throw new Error(body.error ?? "Analysis failed. Please try again.");
      }
      const prior = store.get().sessions.filter((s) => s.scenarioId === sc.id).length;
      const session = {
        id: `s-${Date.now()}`,
        scenarioId: sc.id,
        goal: sc.goal,
        prompt: sc.prompt,
        transcript: body.transcript,
        durationSec: duration,
        createdAt: Date.now(),
        analysis: body.analysis,
        attempt: prior + 1,
        source: "ai" as const,
      };
      store.addSession(session);
      void navigate({ to: "/results/$sessionId", params: { sessionId: session.id } });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
      setPhase("ready");
    } finally {
      clearTimeout(stepTimer);
    }
  }

  const isLive = phase === "recording";
  const isPaused = phase === "paused";
  const inSession = isLive || isPaused;

  return (
    <AppShell>
      {/* Upgrade dialog */}
      <ProUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        triggerReason={modalTriggerReason}
      />

      {phase === "pick" && (
        <div className="animate-rise">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">Choose your scenario</h1>
              <p className="mt-2 text-muted-foreground">
                Based on your goal: {goalById(profile.goal ?? "confidence")?.label}. Each takes about a
                minute.
              </p>
            </div>
            
            {/* Free tier weekly status badge */}
            {!isPro ? (
              <div className="rounded-2xl border border-border/80 bg-card p-3 sm:px-4 flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Free Plan Limit
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    <span className={cn(isWeeklyLimitReached ? "text-destructive" : "text-primary")}>
                      {sessionsThisWeek} / {FREE_WEEKLY_LIMIT}
                    </span>{" "}
                    sessions this week
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-bold gap-1"
                  onClick={() => {
                    setModalTriggerReason(isWeeklyLimitReached ? "quota_reached" : null);
                    setShowUpgradeModal(true);
                  }}
                >
                  <Crown className="size-3 fill-amber-500" /> Unlock Unlimited
                </Button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Crown className="size-4 fill-amber-500" /> Pro Member · Unlimited Practice
              </div>
            )}
          </div>

          {/* Warning banner if free limit reached */}
          {isWeeklyLimitReached && (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Zap className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    You've reached your free weekly limit ({FREE_WEEKLY_LIMIT}/{FREE_WEEKLY_LIMIT} sessions)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your quota resets every Monday. Upgrade to SpeakCoach Pro for unlimited practice attempts, specialized executive scenarios, and advanced analytics.
                  </p>
                </div>
              </div>
              <Button
                variant="hero"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => {
                  setModalTriggerReason("quota_reached");
                  setShowUpgradeModal(true);
                }}
              >
                <Crown className="size-3.5 fill-primary-foreground" /> Upgrade to Pro
              </Button>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {goalScenarios.map((sc) => {
              const isLocked = !isPro && sc.tier === "pro";
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={cn(
                    "surface group relative p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift cursor-pointer",
                    isLocked && "border-dashed border-primary/30 bg-card/60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-semibold group-hover:text-primary leading-snug">
                      {sc.prompt}
                    </p>
                    {sc.tier === "pro" && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {isLocked ? <Lock className="size-3" /> : <Crown className="size-3 fill-amber-500" />}
                        PRO {sc.badge ? `· ${sc.badge}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{sc.context}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                      {sc.seconds}s target
                    </p>
                    {isLocked && (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Lock className="size-3" /> Unlock with Pro
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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
            {error && (
              <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button variant="hero" size="xl" className="mt-8" onClick={() => void startCountdown()}>
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
            <Waveform active={isLive} analyser={analyserRef} />
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
              onClick={() => void finish()}
              aria-label="Stop and analyse"
              className="bg-brand shadow-glow flex h-14 items-center gap-2.5 rounded-full px-7 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <Square className="size-4 fill-primary-foreground" />
              Stop &amp; analyse
            </button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Your transcript and report appear as soon as you stop.
          </p>
        </div>
      )}

      {phase === "analysing" && (
        <div className="animate-rise mx-auto flex max-w-sm flex-col items-center py-24 text-center">
          <span className="bg-brand shadow-glow flex size-16 items-center justify-center rounded-full">
            <RotateCcw className="size-6 animate-spin text-primary-foreground" />
          </span>
          <h1 className="mt-6 text-2xl font-bold">Analysing your delivery…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {analysingStep}
          </p>
        </div>
      )}
    </AppShell>
  );
}
