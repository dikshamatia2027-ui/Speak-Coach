import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, Square, ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  analyzeResponse,
  getScenario,
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

type Phase = "pick" | "ready" | "recording" | "analysing";

function Practice() {
  const { profile } = store.get();
  const goalScenarios = useMemo(
    () => scenariosForGoal(profile.goal ?? "confidence"),
    [profile.goal],
  );
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function startRecording() {
    setPhase("recording");
    setElapsed(0);
    setLiveText("");
    // TODO(api): swap for real speech-to-text streaming. For the MVP we
    // reveal the sample transcript progressively to simulate live captions.
    const words = scenario!.sampleTranscript.split(" ");
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        const shown = Math.min(words.length, Math.floor((next / scenario!.seconds) * words.length));
        setLiveText(words.slice(0, shown).join(" "));
        if (next >= scenario!.seconds) finish(next);
        return next;
      });
    }, 1000);
  }

  function finish(finalElapsed?: number) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("analysing");
    const duration = Math.max(finalElapsed ?? elapsed, 8);
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

  function stopEarly() {
    finish();
  }

  const remaining = scenario ? Math.max(0, scenario.seconds - elapsed) : 0;

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
            <Button variant="hero" size="xl" className="mt-8" onClick={startRecording}>
              <Mic className="size-5" /> Start recording
            </Button>
          </div>
        </div>
      )}

      {phase === "recording" && scenario && (
        <div className="animate-rise mx-auto max-w-xl text-center">
          <p className="text-sm font-medium text-muted-foreground">{scenario.prompt}</p>
          <div className="mt-8 flex flex-col items-center">
            <button
              onClick={stopEarly}
              aria-label="Stop recording"
              className="bg-brand shadow-glow relative flex size-28 items-center justify-center rounded-full transition-transform hover:scale-105"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <Square className="size-8 fill-primary-foreground text-primary-foreground" />
            </button>
            <p className="font-display mt-6 text-5xl font-bold tabular-nums">
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
            </p>
            <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
              Listening… tap to finish early
            </p>
          </div>
          <div className="surface mt-8 min-h-28 p-5 text-left">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Live transcript
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              {liveText || <span className="text-muted-foreground">Start speaking…</span>}
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

      {phase === "pick" && goalScenarios.length === 0 && (
        <p className={cn("mt-8 text-sm text-muted-foreground")}>No scenarios for this goal yet.</p>
      )}
    </AppShell>
  );
}
