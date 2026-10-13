import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  Mic,
  RefreshCw,
  Sparkles,
  Timer,
  Waves,
} from "lucide-react";
import heroImage from "@/assets/hero-waves.jpg";
import { Logo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { GOALS } from "@/lib/speakcoach";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpeakCoach — Practice speaking, get AI feedback" },
      {
        name: "description",
        content:
          "SpeakCoach turns speaking practice into measurable progress. Record real scenarios, get scored on pace, fillers, clarity and confidence, then retry.",
      },
      { property: "og:title", content: "SpeakCoach — Practice speaking, get AI feedback" },
      {
        property: "og:description",
        content: "Record a real scenario, get an instant coaching report, retry and compare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Sparkles,
    title: "Pick your goal",
    body: "Interview, presentation, meeting, pitch or everyday confidence. You get scenarios that match.",
  },
  {
    icon: Mic,
    title: "Speak your answer",
    body: "One button, one prompt, no clutter. Talk the way you would in the real room.",
  },
  {
    icon: BarChart3,
    title: "Read the report",
    body: "Six scored metrics with the exact lines that helped and hurt, plus drills to fix them.",
  },
  {
    icon: RefreshCw,
    title: "Retry and compare",
    body: "Run it again and watch every metric move against your last attempt.",
  },
];

const METRICS = [
  "Pace",
  "Filler words",
  "Clarity",
  "Pronunciation",
  "Vocabulary",
  "Delivery & confidence",
];

function Landing() {
  return (
    <div className="bg-soft min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/onboarding">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-halo pointer-events-none absolute inset-x-0 -top-40 h-[560px]" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft">
                <Waves className="size-3.5 text-primary" />
                AI public speaking trainer
              </span>
              <h1 className="mt-6 text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-6xl">
                Speak it out loud.
                <br />
                <span className="text-brand">Get coached in seconds.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                SpeakCoach gives you a realistic scenario, listens to your spoken answer, and
                returns a specific, scored report — then you retry until it lands.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="xl">
                  <Link to="/onboarding">
                    Start practising <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link to="/dashboard">See a sample report</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4 text-success" /> No script needed
                </span>
                <span className="inline-flex items-center gap-2">
                  <Timer className="size-4 text-success" /> 5 minutes a day
                </span>
              </div>
            </div>

            <div className="animate-rise relative [animation-delay:120ms]">
              <div className="surface overflow-hidden p-2 shadow-soft">
                <img
                  src={heroImage}
                  alt="Abstract visualisation of a spoken voice waveform"
                  width={1440}
                  height={1088}
                  className="w-full rounded-xl object-cover"
                />
              </div>
              <div className="surface absolute -bottom-5 -left-2 hidden w-52 p-3.5 shadow-lift sm:block">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Latest attempt</p>
                <p className="font-display mt-0.5 text-2xl font-bold">
                  84<span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
                <p className="mt-0.5 text-xs font-medium text-success">+11 vs. previous</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How a session works</h2>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-base">
          Four steps, about five minutes, and clear metrics you can measure and improve.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="surface p-5 transition-all hover:border-border hover:shadow-lift">
              <span className="bg-primary/10 flex size-9 items-center justify-center rounded-lg text-primary">
                <s.icon className="size-4.5" />
              </span>
              <p className="mt-4 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                STEP {i + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics + goals */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="surface p-8">
            <h2 className="text-2xl font-bold">Six things we listen for</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every attempt is scored on the same axes, so progress is comparable.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {METRICS.map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm font-medium"
                >
                  <Check className="size-4 shrink-0 text-primary" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface p-8">
            <h2 className="text-2xl font-bold">Built around your goal</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Scenarios are written for the room you are actually walking into.
            </p>
            <ul className="mt-6 space-y-3">
              {GOALS.map((g) => (
                <li key={g.id} className="flex items-start gap-3">
                  <span className="text-xl leading-none">{g.emoji}</span>
                  <span>
                    <span className="text-sm font-semibold">{g.label}</span>
                    <span className="block text-sm text-muted-foreground">{g.blurb}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Free vs Pro Pricing Section */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Transparent pricing</span>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Simple plans built for progress</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Start free to build your baseline, or go Pro to unlock unlimited practice and executive-level acoustic analytics.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          {/* Free Tier */}
          <div className="surface flex flex-col justify-between p-6 sm:p-7 border border-border/80">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Free Plan</h3>
                <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Starter
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold sm:text-4xl">$0</span>
                <span className="text-xs text-muted-foreground">/ month forever</span>
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">
                Ideal for casual speakers testing AI speech feedback.
              </p>

              <ul className="mt-6 space-y-3 border-t border-border/60 pt-5 text-xs sm:text-sm">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-success" />
                  <span><strong>3 practice sessions</strong> per week</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-success" />
                  <span>Foundational speaking scenarios</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-success" />
                  <span>Instant transcription &amp; 6-metric scorecard</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-success" />
                  <span>Basic pace &amp; filler tracking</span>
                </li>
              </ul>
            </div>

            <Button asChild variant="outline" size="lg" className="mt-7 w-full">
              <Link to="/onboarding">Get started for free</Link>
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="surface relative flex flex-col justify-between border-2 border-primary/80 bg-card p-6 shadow-lift sm:p-7">
            <div className="absolute -top-3 right-5 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground uppercase shadow-sm">
              Recommended
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">SpeakCoach Pro</h3>
                </div>
                <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  PRO
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold sm:text-4xl">$12</span>
                <span className="text-xs text-muted-foreground">/ month · cancel anytime</span>
              </div>
              <p className="mt-2.5 text-xs text-muted-foreground">
                For ambitious professionals, managers, and frequent presenters.
              </p>

              <ul className="mt-6 space-y-3 border-t border-border/60 pt-5 text-xs sm:text-sm">
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 font-bold text-primary" />
                  <span><strong>Unlimited practice</strong> with no weekly limit</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 font-bold text-primary" />
                  <span><strong>High-stakes scenarios</strong> (Boardroom, Negotiation, Pitches)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 font-bold text-primary" />
                  <span><strong>Advanced Speech Analytics</strong> (Pacing stability, fillers, variety)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 font-bold text-primary" />
                  <span>Attempt diff comparisons &amp; priority coaching</span>
                </li>
              </ul>
            </div>

            <Button asChild variant="hero" size="lg" className="mt-7 w-full shadow-soft">
              <Link to="/onboarding">
                Upgrade to Pro <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-card via-card to-secondary/30 p-8 text-center shadow-soft sm:p-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Your next talk deserves a rehearsal.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
            Pick a goal, speak for sixty seconds, and see exactly what to change.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg" variant="hero">
              <Link to="/onboarding">
                Start your first session <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <p>Practice out loud. Improve on purpose.</p>
        </div>
      </footer>
    </div>
  );
}
