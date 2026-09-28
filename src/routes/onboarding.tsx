import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOALS, store, type GoalId, type Profile } from "@/lib/speakcoach";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your practice plan — SpeakCoach" },
      {
        name: "description",
        content:
          "Choose a speaking goal, tell us your comfort level and set a weekly practice target to personalise your SpeakCoach sessions.",
      },
      { property: "og:title", content: "Set up your practice plan — SpeakCoach" },
      {
        property: "og:description",
        content: "Three quick questions and your personalised speaking plan is ready.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const LEVELS: { id: Profile["level"]; label: string; body: string }[] = [
  { id: "new", label: "It makes me nervous", body: "We start short and build up." },
  { id: "some", label: "I manage, but it's uneven", body: "We focus on consistency." },
  { id: "confident", label: "I'm comfortable already", body: "We push on nuance and impact." },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [level, setLevel] = useState<Profile["level"]>("some");
  const [weeklyTarget, setWeeklyTarget] = useState(3);

  const canNext = step === 0 ? name.trim().length > 0 : step === 1 ? goal !== null : true;

  function finish() {
    store.setProfile({ name: name.trim(), goal, level, weeklyTarget, onboarded: true });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="bg-soft relative min-h-screen">
      <div className="bg-halo pointer-events-none absolute inset-x-0 -top-40 h-[480px]" />
      <div className="relative mx-auto flex max-w-2xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <Logo />

        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-brand" : "bg-secondary",
              )}
            />
          ))}
        </div>

        <div key={step} className="surface animate-rise mt-6 p-6 sm:p-9">
          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold sm:text-3xl">First, what should we call you?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your reports are written to you, personally.
              </p>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canNext && setStep(1)}
                placeholder="e.g. Diksha"
                className="mt-6 h-14 rounded-2xl px-5 text-base"
              />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold sm:text-3xl">What are you practising for?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This picks your scenarios. You can change it any time.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft",
                      goal === g.id
                        ? "border-primary bg-accent shadow-soft"
                        : "border-border bg-card",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-xl">{g.emoji}</span>
                      {goal === g.id && <Check className="size-4 text-primary" />}
                    </span>
                    <span className="mt-3 block text-sm font-semibold">{g.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{g.blurb}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold sm:text-3xl">How does speaking feel today?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We tune the difficulty and tone of your feedback.
              </p>
              <div className="mt-6 space-y-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all",
                      level === l.id ? "border-primary bg-accent" : "border-border bg-card",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{l.label}</span>
                      <span className="block text-xs text-muted-foreground">{l.body}</span>
                    </span>
                    {level === l.id && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-sm font-semibold">Sessions per week</p>
                <div className="mt-3 flex gap-2">
                  {[2, 3, 5, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setWeeklyTarget(n)}
                      className={cn(
                        "h-12 flex-1 rounded-2xl border text-sm font-semibold transition-colors",
                        weeklyTarget === n
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? navigate({ to: "/" }) : setStep(step - 1))}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button
            variant="hero"
            size="lg"
            disabled={!canNext}
            onClick={() => (step === 2 ? finish() : setStep(step + 1))}
          >
            {step === 2 ? "Go to dashboard" : "Continue"} <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
