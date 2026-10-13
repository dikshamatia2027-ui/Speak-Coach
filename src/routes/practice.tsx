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
      const colors = getComputedStyle(canvas);
      gradient.addColorStop(0, colors.getPropertyValue("--primary").trim());
      gradient.addColorStop(0.55, colors.getPropertyValue("--brand-orange").trim());
      gradient.addColorStop(1, colors.getPropertyValue("--brand-yellow").trim());
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
                  className="border-brand-yellow/40 text-warning  hover:bg-brand-yellow/10 text-xs font-bold gap-1"
                  onClick={() => {
                    setModalTriggerReason(isWeeklyLimitReached ? "quota_reached" : null);
                    setShowUpgradeModal(true);
                  }}
                >
                  <Crown className="size-3 fill-brand-yellow" /> Unlock Unlimited
                </Button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30 px-4 py-2 text-xs font-bold text-warning ">
                <Crown className="size-4 fill-brand-yellow" /> Pro Member · Unlimited Practice
              </div>
            )}
          </div>

          {/* Warning banner if free limit reached */}
          {isWeeklyLimitReached && (
            <div className="mt-5 rounded-xl border border-brand-yellow/35 bg-brand-yellow/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="flex items-start gap-3">
                <Zap className="size-4 text-warning  shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-foreground">
                    Weekly free sessions cap reached ({FREE_WEEKLY_LIMIT}/{FREE_WEEKLY_LIMIT})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your allocation resets next Monday. Unlock unlimited recordings and specialized executive scenarios with Pro.
                  </p>
                </div>
              </div>
              <Button
                variant="hero"
                size="sm"
                className="shrink-0 h-8 text-xs font-semibold gap-1.5 self-start sm:self-auto"
                onClick={() => {
                  setModalTriggerReason("quota_reached");
                  setShowUpgradeModal(true);
                }}
              >
                <Crown className="size-3 fill-primary-foreground" /> Upgrade to Pro
              </Button>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {goalScenarios.map((sc) => {
              const isLocked = !isPro && sc.tier === "pro";
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={cn(
                    "surface group relative p-5 text-left transition-all hover:border-primary/50 hover:shadow-xs cursor-pointer flex flex-col justify-between",
                    isLocked && "border-dashed bg-secondary/30",
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold group-hover:text-primary leading-snug text-foreground">
                        {sc.prompt}
                      </p>
                      {sc.tier === "pro" && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-brand-yellow/10 border border-brand-yellow/25 px-2 py-0.5 text-[10px] font-bold text-warning ">
                          {isLocked ? <Lock className="size-2.5" /> : <Crown className="size-2.5 fill-brand-yellow" />}
                          PRO {sc.badge ? `· ${sc.badge}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{sc.context}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-[11px] font-semibold tracking-wider text-primary uppercase">
                      {sc.seconds}s target duration
                    </span>
                    {isLocked ? (
                      <span className="text-xs font-semibold text-warning  flex items-center gap-1">
                        <Lock className="size-3" /> Pro scenario
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        Select →
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
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" /> Back to scenario selection
          </button>
          <div className="surface p-6 sm:p-8">
            <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              {goalById(scenario.goal)?.label}
            </span>
            <h1 className="mt-3 text-xl font-bold sm:text-2xl text-foreground">{scenario.prompt}</h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{scenario.context}</p>
            <div className="mt-6 rounded-lg bg-secondary/60 border border-border/40 p-3 text-xs text-muted-foreground">
              Speak for approximately <strong>{scenario.seconds} seconds</strong>. Speak naturally as if in person—the AI engine will measure pacing, fillers, and clarity.
            </div>
            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                {error}
              </p>
            )}
            <Button variant="hero" size="lg" className="mt-6 h-11 px-8 gap-2 font-semibold shadow-xs" onClick={() => void startCountdown()}>
              <Mic className="size-4" /> Start recording
            </Button>
          </div>
        </div>
      )}

      {phase === "countdown" && scenario && (
        <div className="animate-rise mx-auto flex max-w-xl flex-col items-center py-16 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{scenario.prompt}</p>
          <div className="relative mt-8 flex size-32 items-center justify-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/20" />
            <span className="absolute inset-0 rounded-full border border-border bg-card" />
            <span className="font-display text-primary text-6xl font-bold tabular-nums relative">
              {countdown}
            </span>
          </div>
          <p className="mt-6 text-sm font-medium text-foreground">
            Take a breath and prepare to speak
          </p>
        </div>
      )}

      {inSession && scenario && (
        <div className="animate-rise mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{scenario.prompt}</p>

          {/* Status chip */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-semibold shadow-xs">
            <span
              className={cn(
                "size-2 rounded-full",
                isLive ? "animate-pulse bg-destructive" : "bg-warning",
              )}
            />
            <span className="text-[11px] uppercase tracking-wider">
              {isLive ? "Live Recording" : "Paused"}
            </span>
          </div>

          {/* Timer & Mic area */}
          <div className="mt-6 flex flex-col items-center">
            <div className="relative flex size-28 items-center justify-center">
              {isLive && (
                <>
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/25" />
                  <span
                    className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/15"
                    style={{ animationDelay: "0.8s" }}
                  />
                </>
              )}
              <div
                className={cn(
                  "bg-brand shadow-md relative flex size-24 items-center justify-center rounded-full transition-all duration-300",
                  isPaused && "scale-95 opacity-80 shadow-xs",
                )}
              >
                <Mic className="size-9 text-primary-foreground" />
              </div>
            </div>

            {/* Timer */}
            <p className="font-display mt-5 text-5xl font-bold tabular-nums tracking-tight text-foreground">
              {formatTime(elapsed)}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {isLive
                ? `Recommended duration: ${formatTime(scenario.seconds)}`
                : "Paused — resume speaking when ready"}
            </p>
          </div>

          {/* Waveform */}
          <div className="surface mt-6 p-4">
            <Waveform active={isLive} analyser={analyserRef} />
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={togglePause}
              aria-label={isLive ? "Pause recording" : "Resume recording"}
              className="surface flex size-12 items-center justify-center rounded-xl transition-all hover:bg-secondary cursor-pointer"
            >
              {isLive ? (
                <Pause className="size-5 fill-foreground text-foreground" />
              ) : (
                <Play className="size-5 fill-foreground text-foreground" />
              )}
            </button>
            <button
              onClick={() => void finish()}
              aria-label="Finish and generate feedback"
              className="bg-brand shadow-xs flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 cursor-pointer"
            >
              <Square className="size-3.5 fill-primary-foreground" />
              Complete &amp; Analyse
            </button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Transcripts are parsed on completion for speech rate, filler detection, and clarity scoring.
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
