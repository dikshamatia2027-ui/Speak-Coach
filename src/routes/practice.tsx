import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { saveSessionRemote } from "@/lib/auth";
import { getAccessToken } from "@/lib/supabase";
import {
  ArrowLeft,
  ChevronDown,
  Crown,
  Heart,
  Lock,
  Mic,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Square,
  Volume2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ProUpgradeModal } from "@/components/pro-upgrade-modal";
import {
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
      { title: "Practice studio — SpeakCoach" },
      {
        name: "description",
        content:
          "Pick a realistic speaking scenario, record your answer out loud, and get an instant coaching report.",
      },
      { property: "og:title", content: "Practice studio — SpeakCoach" },
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

type Phase = "ready" | "countdown" | "recording" | "paused" | "analysing";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Animated waveform bars driven by the live microphone AnalyserNode using semantic palette */
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

    const BAR_COUNT = 40;
    const levels = new Array<number>(BAR_COUNT).fill(0.08);
    let raf = 0;
    let buf: Uint8Array<ArrayBuffer> | null = null;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const gap = width / BAR_COUNT;
      const barWidth = Math.max(2.5 * dpr, gap * 0.45);
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#2563eb");
      gradient.addColorStop(0.5, "#3b82f6");
      gradient.addColorStop(1, "#60a5fa");
      ctx.fillStyle = gradient;

      const node = analyser.current;
      if (node && activeRef.current) {
        if (!buf || buf.length !== node.frequencyBinCount) buf = new Uint8Array(node.frequencyBinCount);
        node.getByteFrequencyData(buf);
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        const dist = Math.abs(i - (BAR_COUNT - 1) / 2) / (BAR_COUNT / 2);
        const bin = buf ? (buf[Math.floor(dist * buf.length * 0.6)] ?? 0) / 255 : 0;
        const target = activeRef.current && node ? 0.1 + bin * 0.85 : 0.08;
        const current = levels[i] ?? 0.08;
        const nextLevel = current + (target - current) * (activeRef.current ? 0.35 : 0.08);
        levels[i] = nextLevel;
        const h = Math.max(4 * dpr, nextLevel * height);
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

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = goalScenarios[scenarioIndex] ?? goalScenarios[0];

  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [analysingStep, setAnalysingStep] = useState("Transcribing your answer…");
  const [showScenarioDrawer, setShowScenarioDrawer] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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

  function handleSelectScenario(index: number) {
    const sc = goalScenarios[index];
    if (!sc) return;
    if (!isPro && sc.tier === "pro") {
      setModalTriggerReason("scenario_locked");
      setShowUpgradeModal(true);
      return;
    }
    setScenarioIndex(index);
    setShowScenarioDrawer(false);
    setPhase("ready");
    setElapsed(0);
    elapsedRef.current = 0;
  }

  function handleNextScenario() {
    if (goalScenarios.length === 0) return;
    const nextIdx = (scenarioIndex + 1) % goalScenarios.length;
    handleSelectScenario(nextIdx);
  }

  function handlePrevScenario() {
    if (goalScenarios.length === 0) return;
    const prevIdx = (scenarioIndex - 1 + goalScenarios.length) % goalScenarios.length;
    handleSelectScenario(prevIdx);
  }

  function handleShuffleScenario() {
    if (goalScenarios.length <= 1) return;
    let rand = Math.floor(Math.random() * goalScenarios.length);
    if (rand === scenarioIndex) rand = (rand + 1) % goalScenarios.length;
    handleSelectScenario(rand);
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
      if (elapsedRef.current >= Math.max((scenario?.seconds ?? 60) * 3, 180)) void finish();
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
    if (!rec || !scenario) return;
    const sc = scenario;
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
      const token = await getAccessToken();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      void saveSessionRemote(session);
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
  const targetSeconds = scenario?.seconds ?? 60;
  const progressPercent = Math.min(100, (elapsed / targetSeconds) * 100);

  return (
    <AppShell>
      <ProUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        triggerReason={modalTriggerReason}
      />

      <div className="max-w-2xl lg:max-w-3xl mx-auto space-y-4 animate-rise">
        {/* Practice Studio Top Navigation Bar (Screen 3 Header) */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            aria-label="Back to dashboard"
            className="flex size-10 items-center justify-center rounded-xl bg-card border border-border text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors shadow-xs"
          >
            <ChevronDown className="size-5" />
          </Link>

          <div className="text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
              {goalById(scenario?.goal ?? "confidence")?.label}
            </span>
            <h2 className="font-serif text-lg font-bold text-foreground">Practice Studio</h2>
          </div>

          <button
            onClick={() => setShowScenarioDrawer((prev) => !prev)}
            aria-label="Scenario selector drawer"
            className="flex size-10 items-center justify-center rounded-xl bg-card border border-border text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="size-4.5" />
          </button>
        </div>

        {/* Analysing Loading Screen */}
        {phase === "analysing" ? (
          <div className="surface p-10 text-center animate-rise sm:p-14">
            <div className="flex size-20 items-center justify-center rounded-full bg-accent text-primary mx-auto shadow-md shadow-primary/10">
              <RotateCcw className="size-8 animate-spin" />
            </div>
            <h2 className="font-serif text-2xl font-bold mt-6">Analysing your delivery…</h2>
            <p className="text-base text-muted-foreground mt-2">{analysingStep}</p>
          </div>
        ) : (
          <>
            {/* Recording Panel — white surface card with an aligned header row (status · PRO) and a centered stage */}
            <div className="surface overflow-hidden">
              {/* Panel header: status chip and PRO badge share one aligned row */}
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5 sm:px-5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/90">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      isLive ? "bg-destructive animate-pulse" : isPaused ? "bg-warning" : "bg-success",
                    )}
                  />
                  {phase === "countdown"
                    ? "Starting…"
                    : isLive
                      ? "Recording"
                      : isPaused
                        ? "Paused"
                        : "Ready to speak"}
                </div>
                {scenario?.tier === "pro" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-warning-foreground shadow-xs">
                    <Crown className="size-3 fill-warning-foreground" /> PRO
                  </span>
                ) : (
                  <span aria-hidden="true" className="w-1" />
                )}
              </div>

              {/* Stage: countdown, live waveform, or microphone — consistently centered */}
              <div className="flex min-h-[230px] flex-col items-center justify-center gap-4 px-5 py-6 text-center sm:min-h-[260px] sm:px-8">
                {phase === "countdown" ? (
                  <div className="relative flex size-24 items-center justify-center sm:size-28">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/25" />
                    <div className="flex size-20 items-center justify-center rounded-full bg-card text-primary font-serif text-5xl font-bold shadow-lift sm:size-24">
                      {countdown}
                    </div>
                  </div>
                ) : inSession ? (
                  <div className="w-full max-w-md">
                    <Waveform active={isLive} analyser={analyserRef} />
                  </div>
                ) : (
                  <div className="relative flex size-24 items-center justify-center sm:size-28">
                    <span className="absolute inset-0 rounded-full bg-card/60 blur-md" />
                    <div className="relative flex size-20 items-center justify-center rounded-full bg-card shadow-lift text-primary sm:size-24">
                      <Mic className="size-9 stroke-[2] sm:size-10" />
                    </div>
                  </div>
                )}

                {/* Microphone/analysis error — kept inside the stage so the layout never shifts out of view */}
                {error && (
                  <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Track Info (Prompt title & Details) */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
                  {scenario?.prompt || "Executive Boardroom Intro"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {scenario?.context || "Speak naturally. We measure filler words, pacing and clarity."}
                </p>
              </div>

              <button
                onClick={() => setIsBookmarked((prev) => !prev)}
                aria-label="Favorite scenario"
                className="flex size-10 items-center justify-center rounded-xl bg-card border border-border text-foreground/80 hover:text-primary transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <Heart
                  className={cn(
                    "size-5 transition-colors",
                    isBookmarked ? "fill-primary text-primary" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>

            {/* Scrubber / Progress Bar */}
            <div className="space-y-1.5">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground tabular-nums">
                <span>{formatTime(elapsed)}</span>
                <span>{formatTime(targetSeconds)}</span>
              </div>
            </div>

            {/* Recording & scenario control bar — compact on mobile, full on desktop */}
            <div className="flex items-center justify-center gap-3 py-1 sm:gap-7 sm:py-3">
              {/* 1. Shuffle */}
              <button
                onClick={handleShuffleScenario}
                disabled={inSession}
                title="Shuffle scenario"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer sm:size-11",
                  inSession && "max-sm:hidden",
                )}
              >
                <Shuffle className="size-5" />
              </button>

              {/* 2. Previous */}
              <button
                onClick={handlePrevScenario}
                disabled={inSession}
                title="Previous scenario"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer sm:size-11",
                  inSession && "max-sm:hidden",
                )}
              >
                <SkipBack className="size-5 fill-current sm:size-6" />
              </button>

              {/* 3. Center Record / Stop Button */}
              {inSession ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePause}
                    aria-label={isLive ? "Pause recording" : "Resume recording"}
                    className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-secondary transition-all cursor-pointer"
                  >
                    {isLive ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
                  </button>
                  <button
                    onClick={() => void finish()}
                    aria-label="Complete and analyze"
                    className="flex size-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-xl shadow-destructive/30 hover:scale-105 active:scale-95 transition-all cursor-pointer sm:size-20"
                  >
                    <Square className="size-5 fill-destructive-foreground sm:size-7" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void startCountdown()}
                  disabled={phase === "countdown"}
                  aria-label="Start recording"
                  className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group sm:size-20 lg:size-22"
                >
                  <Mic className="size-7 text-primary-foreground group-hover:scale-110 transition-transform stroke-[2.2] sm:size-9" />
                </button>
              )}

              {/* 4. Next */}
              <button
                onClick={handleNextScenario}
                disabled={inSession}
                title="Next scenario"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer sm:size-11",
                  inSession && "max-sm:hidden",
                )}
              >
                <SkipForward className="size-5 fill-current sm:size-6" />
              </button>

              {/* 5. Repeat / Reset */}
              <button
                onClick={() => {
                  setElapsed(0);
                  elapsedRef.current = 0;
                  setPhase("ready");
                }}
                disabled={inSession}
                title="Reset timer"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer sm:size-11",
                  inSession && "max-sm:hidden",
                )}
              >
                <Repeat className="size-5" />
              </button>
            </div>

            {/* Quick Scenario Selector Drawer */}
            {showScenarioDrawer && (
              <div className="surface p-5 rounded-2xl space-y-3 animate-fade border border-border">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-serif font-bold text-base">Select Speaking Scenario</h3>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {goalScenarios.length} available
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {goalScenarios.map((sc, idx) => {
                    const isCurrent = idx === scenarioIndex;
                    const isLocked = !isPro && sc.tier === "pro";

                    return (
                      <button
                        key={sc.id}
                        onClick={() => handleSelectScenario(idx)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                          isCurrent
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-card hover:bg-secondary/60",
                          isLocked && "opacity-75",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{sc.prompt}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sc.seconds}s target • {goalById(sc.goal)?.label}
                          </p>
                        </div>
                        {isLocked ? (
                          <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-warning">
                            <Lock className="size-3" /> PRO
                          </span>
                        ) : isCurrent ? (
                          <span className="shrink-0 size-2 rounded-full bg-primary" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
