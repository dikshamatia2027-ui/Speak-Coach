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
              <div className="surface overflow-hidden p-2 shadow-lift">
                <img
                  src={heroImage}
                  alt="Abstract visualisation of a spoken voice waveform"
                  width={1440}
                  height={1088}
                  className="w-full rounded-[1.4rem] object-cover"
                />
              </div>
              <div className="surface absolute -bottom-6 -left-2 hidden w-56 p-4 shadow-lift sm:block">
                <p className="text-xs font-semibold text-muted-foreground">Latest attempt</p>
                <p className="font-display mt-1 text-3xl font-bold">
                  84<span className="text-base text-muted-foreground">/100</span>
                </p>
                <p className="mt-1 text-xs text-success">+11 vs. previous</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-bold sm:text-3xl">How a session works</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Four steps, about five minutes, and a number you can actually move.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="surface p-6 transition-shadow hover:shadow-lift">
              <span className="bg-accent flex size-11 items-center justify-center rounded-2xl">
                <s.icon className="size-5 text-accent-foreground" />
              </span>
              <p className="mt-5 text-xs font-bold tracking-widest text-muted-foreground">
                STEP {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
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
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Simple, transparent plans</h2>
          <p className="mt-3 text-muted-foreground">
            Start for free to test the waters, or go Pro to unlock unlimited practice and executive-level analytics.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="surface p-8 flex flex-col justify-between border-2 border-border/80 relative">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Free Plan</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Get Started
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold">$0</span>
                <span className="text-sm text-muted-foreground">/ month forever</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Perfect for casual speakers and trying out AI speech scoring.
              </p>

              <ul className="mt-6 space-y-3.5 border-t border-border pt-6 text-sm">
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-success shrink-0" />
                  <span><strong>3 practice sessions</strong> per week</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-success shrink-0" />
                  <span>Foundational speaking scenarios</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-success shrink-0" />
                  <span>Instant AI transcription &amp; basic score report</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-success shrink-0" />
                  <span>Pace &amp; filler count tracking</span>
                </li>
              </ul>
            </div>

            <Button asChild variant="outline" size="xl" className="mt-8 w-full">
              <Link to="/onboarding">Get started for free</Link>
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="surface p-8 flex flex-col justify-between border-2 border-primary relative shadow-lift bg-card">
            <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">SpeakCoach Pro</h3>
                </div>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  PRO
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold">$12</span>
                <span className="text-sm text-muted-foreground">/ month · cancel anytime</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                For ambitious professionals, executives, and frequent presenters.
              </p>

              <ul className="mt-6 space-y-3.5 border-t border-border pt-6 text-sm">
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-primary font-bold shrink-0" />
                  <span><strong>Unlimited</strong> practice sessions with zero weekly cap</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-primary font-bold shrink-0" />
                  <span><strong>Specialized high-stakes scenarios</strong> (Boardroom, Salary Negotiation, Crisis Keynotes)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-primary font-bold shrink-0" />
                  <span><strong>Advanced Speech Analytics</strong> (Filler distribution, Pacing stability, Vocabulary richness)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="size-4 text-primary font-bold shrink-0" />
                  <span>Priority AI transcription speed &amp; retry comparison</span>
                </li>
              </ul>
            </div>

            <Button asChild variant="hero" size="xl" className="mt-8 w-full shadow-glow">
              <Link to="/onboarding">
                Upgrade to Pro <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="bg-brand relative overflow-hidden rounded-[2rem] px-8 py-14 text-center shadow-glow sm:px-16">
          <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
            Your next talk deserves a rehearsal.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/85">
            Pick a goal, speak for sixty seconds, and see exactly what to change.
          </p>
          <Button asChild size="xl" variant="secondary" className="mt-8">
            <Link to="/onboarding">
              Start your first session <ArrowRight className="size-4" />
            </Link>
          </Button>
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
