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
    <div className="bg-background relative min-h-screen">
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

        <div key={step} className="surface animate-rise mt-6 p-6 sm:p-8">
          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">First, what should we call you?</h1>
              <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
                Your coaching reports and feedback will be addressed to you.
              </p>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canNext && setStep(1)}
                placeholder="e.g. Diksha"
                className="mt-6 h-11 rounded-lg px-3.5 text-sm sm:text-base"
              />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">What are you practising for?</h1>
              <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
                Select your primary goal to personalise recommended scenarios.
              </p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={cn(
                      "rounded-xl border p-3.5 text-left transition-all hover:border-border",
                      goal === g.id
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "border-border/70 bg-card hover:bg-secondary/40",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-lg">{g.emoji}</span>
                      {goal === g.id && <Check className="size-4 text-primary" />}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-foreground sm:text-base">{g.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{g.blurb}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">How does speaking feel today?</h1>
              <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
                We calibrate difficulty benchmarks and the tone of your feedback.
              </p>
              <div className="mt-5 space-y-2.5">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                      level === l.id
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "border-border/70 bg-card hover:bg-secondary/40",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-foreground sm:text-base">{l.label}</span>
                      <span className="block text-sm text-muted-foreground">{l.body}</span>
                    </span>
                    {level === l.id && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-border/60 pt-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Target sessions per week</p>
                <div className="mt-3 flex gap-2">
                  {[2, 3, 5, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setWeeklyTarget(n)}
                      className={cn(
                        "h-10 flex-1 rounded-lg border text-sm font-semibold transition-colors",
                        weeklyTarget === n
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/70 bg-card text-muted-foreground hover:border-border hover:text-foreground",
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
