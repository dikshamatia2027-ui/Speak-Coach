import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
      gradient.addColorStop(0, "#ff5277");
      gradient.addColorStop(0.5, "#ff9e43");
      gradient.addColorStop(1, "#8c9eff");
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
  const targetSeconds = scenario?.seconds ?? 60;
  const progressPercent = Math.min(100, (elapsed / targetSeconds) * 100);

  return (
    <AppShell>
      <ProUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        triggerReason={modalTriggerReason}
      />

      <div className="max-w-xl mx-auto space-y-5 animate-rise">
        {/* Practice Studio Top Navigation Bar (Screen 3 Header) */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            aria-label="Back to dashboard"
            className="flex size-10 items-center justify-center rounded-2xl bg-white border border-[#ede8e1] text-foreground/80 hover:text-foreground hover:bg-[#f4f2ee] transition-colors shadow-xs"
          >
            <ChevronDown className="size-5" />
          </Link>

          <div className="text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              {goalById(scenario?.goal ?? "confidence")?.label}
            </span>
            <h2 className="font-serif text-base font-bold text-foreground">Practice Studio</h2>
          </div>

          <button
            onClick={() => setShowScenarioDrawer((prev) => !prev)}
            aria-label="Scenario selector drawer"
            className="flex size-10 items-center justify-center rounded-2xl bg-white border border-[#ede8e1] text-foreground/80 hover:text-foreground hover:bg-[#f4f2ee] transition-colors shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="size-4.5" />
          </button>
        </div>

        {/* Analysing Loading Screen */}
        {phase === "analysing" ? (
          <div className="surface p-12 text-center rounded-[2.5rem] my-8 animate-rise">
            <div className="flex size-20 items-center justify-center rounded-full bg-[#fdebf1] text-[#ff5277] mx-auto shadow-md shadow-[#ff5277]/20">
              <RotateCcw className="size-8 animate-spin" />
            </div>
            <h2 className="font-serif text-2xl font-bold mt-6">Analysing your delivery…</h2>
            <p className="text-sm text-muted-foreground mt-2">{analysingStep}</p>
          </div>
        ) : (
          <>
            {/* Large Rounded Artwork / Player Container (Screen 3 Figma) */}
            <div className="relative rounded-[2.25rem] bg-gradient-to-br from-[#fef3e7] via-[#fdebf1] to-[#e8f7f2] border border-[#ede8e1] p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-soft overflow-hidden min-h-[280px]">
              {/* Status Chip */}
              <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 px-3 py-1 text-[11px] font-bold shadow-xs">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isLive ? "bg-red-500 animate-pulse" : isPaused ? "bg-amber-500" : "bg-emerald-500",
                  )}
                />
                <span className="text-foreground/90 uppercase tracking-wider">
                  {phase === "countdown"
                    ? "Starting…"
                    : isLive
                      ? "Recording"
                      : isPaused
                        ? "Paused"
                        : "Ready to speak"}
                </span>
              </div>

              {/* Pro Badge if applicable */}
              {scenario?.tier === "pro" && (
                <div className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-[#ff9e43] text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
                  <Crown className="size-3 fill-white" /> PRO
                </div>
              )}

              {/* Ambient Center Graphic / Live Waveform */}
              <div className="w-full flex flex-col items-center justify-center py-4">
                {phase === "countdown" ? (
                  <div className="relative flex size-28 items-center justify-center">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#ff5277]/30" />
                    <div className="flex size-24 items-center justify-center rounded-full bg-white text-[#ff5277] font-serif text-5xl font-bold shadow-lift">
                      {countdown}
                    </div>
                  </div>
                ) : inSession ? (
                  <div className="w-full max-w-sm">
                    <Waveform active={isLive} analyser={analyserRef} />
                  </div>
                ) : (
                  <div className="relative flex size-28 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-white/40 blur-md" />
                    <div className="relative flex size-24 items-center justify-center rounded-full bg-white shadow-lift text-[#ff5277]">
                      <Mic className="size-10 stroke-[2]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Error message if microphone blocked */}
              {error && (
                <div className="mt-3 rounded-xl bg-red-100 border border-red-200 text-red-700 p-2.5 text-xs font-medium max-w-xs">
                  {error}
                </div>
              )}
            </div>

            {/* Track Info (Prompt title & Details) */}
            <div className="flex items-start justify-between gap-4 pt-1">
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
                  {scenario?.prompt || "Executive Boardroom Intro"}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {scenario?.context || "Speak naturally. We measure filler words, pacing and clarity."}
                </p>
              </div>

              <button
                onClick={() => setIsBookmarked((prev) => !prev)}
                aria-label="Favorite scenario"
                className="flex size-10 items-center justify-center rounded-2xl bg-white border border-[#ede8e1] text-foreground/80 hover:text-[#ff5277] transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                <Heart
                  className={cn(
                    "size-5 transition-colors",
                    isBookmarked ? "fill-[#ff5277] text-[#ff5277]" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>

            {/* Scrubber / Progress Bar (Screen 3 Player) */}
            <div className="space-y-1.5 pt-2">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#ede8e1]">
                <div
                  className="h-full rounded-full bg-[#ff5277] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground tabular-nums">
                <span>{formatTime(elapsed)}</span>
                <span>{formatTime(targetSeconds)}</span>
              </div>
            </div>

            {/* Playback & Recording 5-Button Control Bar (Exact Figma Screen 3) */}
            <div className="flex items-center justify-center gap-5 sm:gap-7 py-3">
              {/* 1. Shuffle */}
              <button
                onClick={handleShuffleScenario}
                disabled={inSession}
                title="Shuffle scenario"
                className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-[#ede8e1]/60 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Shuffle className="size-5" />
              </button>

              {/* 2. Previous */}
              <button
                onClick={handlePrevScenario}
                disabled={inSession}
                title="Previous scenario"
                className="flex size-11 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-[#ede8e1]/60 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <SkipBack className="size-6 fill-current" />
              </button>

              {/* 3. Center Giant Pink Circular Record / Stop Button */}
              {inSession ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePause}
                    aria-label={isLive ? "Pause recording" : "Resume recording"}
                    className="flex size-12 items-center justify-center rounded-full bg-white border border-[#ede8e1] text-foreground shadow-md hover:bg-[#f4f2ee] transition-all cursor-pointer"
                  >
                    {isLive ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
                  </button>
                  <button
                    onClick={() => void finish()}
                    aria-label="Complete and analyze"
                    className="flex size-20 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Square className="size-7 fill-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void startCountdown()}
                  disabled={phase === "countdown"}
                  aria-label="Start recording"
                  className="flex size-20 sm:size-22 items-center justify-center rounded-full bg-[#ff5277] text-white shadow-xl shadow-[#ff5277]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                >
                  <Mic className="size-9 text-white group-hover:scale-110 transition-transform stroke-[2.2]" />
                </button>
              )}

              {/* 4. Next */}
              <button
                onClick={handleNextScenario}
                disabled={inSession}
                title="Next scenario"
                className="flex size-11 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-[#ede8e1]/60 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <SkipForward className="size-6 fill-current" />
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
                className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-[#ede8e1]/60 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Repeat className="size-5" />
              </button>
            </div>

            {/* Quick Scenario Selector Drawer */}
            {showScenarioDrawer && (
              <div className="surface p-5 rounded-3xl space-y-3 animate-fade border border-[#ede8e1]">
                <div className="flex items-center justify-between pb-2 border-b border-[#ede8e1]">
                  <h3 className="font-serif font-bold text-base">Select Speaking Scenario</h3>
                  <span className="text-xs font-semibold text-muted-foreground">
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
                          "w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                          isCurrent
                            ? "border-[#ff5277] bg-[#fdebf1] text-foreground"
                            : "border-[#ede8e1] bg-white hover:bg-[#f4f2ee]",
                          isLocked && "opacity-75",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold truncate">{sc.prompt}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {sc.seconds}s target • {goalById(sc.goal)?.label}
                          </p>
                        </div>
                        {isLocked ? (
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#ff9e43]">
                            <Lock className="size-3" /> PRO
                          </span>
                        ) : isCurrent ? (
                          <span className="shrink-0 size-2 rounded-full bg-[#ff5277]" />
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
