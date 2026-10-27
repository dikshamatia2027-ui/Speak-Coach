import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  Briefcase,
  Check,
  HeartHandshake,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  Presentation,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/app-shell";
import { MetricBar, ScoreRing, Sparkline } from "@/components/score";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpeakCoach — Speak with confidence, improve with every conversation" },
      {
        name: "description",
        content:
          "SpeakCoach turns speaking practice into measurable progress. Record real scenarios, get scored on pace, fillers, clarity and confidence, then retry.",
      },
      { property: "og:title", content: "SpeakCoach — Speak with confidence, improve with every conversation" },
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

/* ------------------------------------------------------------------ */
/* Page data                                                           */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#scenarios", label: "Scenarios" },
  { href: "#pricing", label: "Pricing" },
];

const BENEFITS = [
  {
    icon: MessageSquare,
    title: "Practise real conversations",
    body: "Interviews, presentations, meetings and pitches written the way real rooms actually sound — fillers, interruptions and all.",
  },
  {
    icon: Target,
    title: "Feedback that's personal",
    body: "Every attempt is scored on six metrics, with the exact lines that helped and the ones that quietly cost you the room.",
  },
  {
    icon: AudioLines,
    title: "Filler-word training",
    body: "“Um”, “uh”, “like” and “you know” are counted in your own sentences — with drills that swap each filler for a confident pause.",
  },
  {
    icon: Presentation,
    title: "Pitch & presentation coaching",
    body: "Elevator pitches, sales pitches and keynotes — rehearse the hook, the structure and the landing before the real room.",
  },
  {
    icon: HeartHandshake,
    title: "Vocabulary that fits the moment",
    body: "Repetitive and vague words in your actual transcripts get precise, natural alternatives — then you practise them in your own sentences.",
  },
  {
    icon: TrendingUp,
    title: "Watch yourself improve",
    body: "Retry any scenario and compare attempts side by side. Every metric moves against your last try, so progress is visible.",
  },
];

const STEPS = [
  {
    icon: Briefcase,
    title: "Choose a goal",
    body: "Job interview, big presentation, team meeting, sales pitch or everyday confidence — pick the room you're walking into.",
  },
  {
    icon: Mic,
    title: "Practise out loud",
    body: "You get a realistic prompt and sixty seconds on the clock. Speak naturally — the coach listens to every word.",
  },
  {
    icon: BarChart3,
    title: "Get specific feedback",
    body: "Your score, the lines that landed, the fillers that didn't — with the exact excerpt behind every metric.",
  },
  {
    icon: RefreshCw,
    title: "Retry until it lands",
    body: "Re-record the same scenario with the drills fresh in mind, and see the delta against your last attempt.",
  },
  {
    icon: TrendingUp,
    title: "Track the trend",
    body: "Sessions, streaks, personal bests and milestones — so improvement is something you can see, not guess.",
  },
];

const SCENARIOS = [
  {
    icon: Briefcase,
    title: "Interview preparation",
    body: "From the classic opener to tricky behavioural questions, rehearse the answers that decide the offer.",
    prompt: "“Tell me about yourself.”",
    meta: "90s · Final-round interview",
    featured: true,
  },
  {
    icon: Presentation,
    title: "Presentations",
    body: "Open strong, hold attention and land the message — without rushing your key point.",
    prompt: "“Open a 10-minute talk you're proud of.”",
    meta: "75s · All-hands keynote",
  },
  {
    icon: Users,
    title: "Workplace meetings",
    body: "Disagree respectfully, summarise cleanly and speak up when the topic is closing.",
    prompt: "“Push back on the team's decision.”",
    meta: "60s · Weekly planning",
  },
  {
    icon: HeartHandshake,
    title: "Everyday conversations",
    body: "Introductions, toasts and small talk that feel relaxed instead of rehearsed.",
    prompt: "“Introduce yourself to a room of strangers.”",
    meta: "45s · Networking event",
  },
  {
    icon: AudioLines,
    title: "Filler-word coaching",
    body: "Every “um”, “like” and “you know” is counted with the sentence around it — then turned into a pause drill.",
    prompt: "“Replace each filler with one beat of silence.”",
    meta: "Drill · In every report",
  },
];

const PREVIEW_METRICS = [
  { label: "Pace", score: 84, detail: "142 words per minute (ideal 130–160)" },
  { label: "Filler words", score: 76, detail: "6 fillers across 121 words" },
  { label: "Clarity", score: 85, detail: "Average sentence 15 words — easy to follow" },
  { label: "Vocabulary", score: 82, detail: "71% unique words — varied and specific" },
];

const TREND_SERIES = [58, 62, 61, 70, 68, 76, 84];

/* ------------------------------------------------------------------ */
/* Landing page                                                        */
/* ------------------------------------------------------------------ */

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/15">
      {/* ---------- Navigation ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-15 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />

          <nav aria-label="Primary" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="hero" size="sm" className="hidden sm:inline-flex rounded-full px-4">
              <Link to="/onboarding">Start Practicing</Link>
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-secondary md:hidden"
            >
              {menuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav aria-label="Mobile" className="border-t border-border bg-background px-4 py-3 animate-fade md:hidden">
            <div className="mx-auto flex max-w-5xl flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
              <Button asChild variant="hero" size="sm" className="mt-2 rounded-full sm:hidden">
                <Link to="/onboarding">Start Practicing</Link>
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="bg-halo pointer-events-none absolute inset-x-0 -top-40 h-[540px]" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.02fr_1fr] lg:pt-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft">
              <AudioLines className="size-3.5 text-primary" />
              AI public speaking coach
            </span>
            <h1 className="mt-5 text-4xl leading-[1.06] font-bold tracking-tight text-foreground sm:text-5xl">
              Speak with confidence.
              <br />
              <span className="text-primary">Improve with every conversation.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              SpeakCoach gives you a realistic scenario, listens to your spoken answer, and returns a
              scored, specific report — fluency, pronunciation, clarity and confidence — then lets you
              retry until it lands.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="xl" className="rounded-full">
                <Link to="/onboarding">
                  Start Practicing Free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-success" /> No script needed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-success" /> 5 minutes a day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-success" /> Free to start
              </span>
            </div>
          </div>

          {/* Product preview: live session + coaching report */}
          <div className="animate-rise relative [animation-delay:120ms]">
            <div className="surface rounded-3xl p-5 shadow-lift sm:p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <Briefcase className="size-3.5 text-primary" /> Job interview · Final round
                </span>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">00:47</span>
              </div>

              <p className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">
                “Tell me about yourself.”
              </p>

              <div className="mt-5 flex h-14 items-center justify-center gap-[3px]" aria-hidden>
                {[22, 38, 14, 46, 30, 58, 26, 64, 42, 70, 34, 76, 50, 66, 38, 58, 30, 48, 24, 40, 18, 34, 14, 26, 20, 30, 16, 24, 12, 20, 10, 16].map(
                  (h, i) => (
                    <span
                      key={i}
                      className={i > 8 && i < 24 ? "w-1 rounded-full bg-primary" : "w-1 rounded-full bg-primary/25"}
                      style={{ height: h }}
                    />
                  ),
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                  </span>
                  Recording your answer
                </span>
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
                  <Mic className="size-5" />
                </span>
              </div>
            </div>

            <div className="surface absolute -bottom-6 -left-4 hidden w-60 rounded-2xl p-4 shadow-lift sm:block">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Coaching report
                </p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  Attempt 2
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <ScoreRing score={84} size={72} label="Score" />
                <div>
                  <p className="text-sm font-bold text-foreground">Strong delivery</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-success">
                    <TrendingUp className="size-3" /> +11 vs. last try
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-2.5">
                <MetricBar label="Pronunciation" score={88} />
                <MetricBar label="Filler words" score={76} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section aria-label="Why speakers use SpeakCoach" className="border-y border-border/70 bg-secondary/40">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm text-muted-foreground sm:px-6">
          {[
            "6 scored speaking metrics",
            "12 real-world scenarios · 5 goals",
            "AI transcript & report in seconds",
            "Free to start — no card needed",
          ].map((t) => (
            <span key={t} className="inline-flex items-center gap-2 font-medium">
              <Check className="size-4 text-primary" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Benefits ---------- */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Practice that transfers to the real room
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Speaking is a skill you build out loud. SpeakCoach makes every minute of practice count.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <b.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold tracking-tight">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border/70 bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">How it works</span>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Five steps. About five minutes a day.
            </h2>
          </div>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Practice scenarios ---------- */}
      <section id="scenarios" className="scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">Scenarios</span>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Built for the room you're walking into
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Every scenario mirrors a real moment — with the time pressure and messiness that come
              with it.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {SCENARIOS.map((s) => (
              <div
                key={s.title}
                className={`surface group flex flex-col p-6 transition-all hover:shadow-lift ${
                  s.featured ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                    <s.icon className="size-4.5" />
                  </span>
                  <h3 className="text-base font-semibold tracking-tight">{s.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <p className="font-display text-sm font-semibold text-foreground">{s.prompt}</p>
                  <span className="text-xs font-medium text-muted-foreground">{s.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Product preview ---------- */}
      <section id="preview" className="scroll-mt-20 border-y border-border/70 bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold tracking-wider text-primary uppercase">Product preview</span>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
                Your report, moments after you stop speaking
              </h2>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              Sample data
            </span>
          </div>

          <div className="surface mt-8 grid gap-8 rounded-3xl p-6 shadow-soft sm:p-8 lg:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <ScoreRing score={84} size={160} label="Overall" />
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                <TrendingUp className="size-3.5" /> +11 vs. last attempt
              </span>
              <div className="w-full max-w-56">
                <Sparkline values={TREND_SERIES} />
                <p className="mt-1 text-xs text-muted-foreground">Last 7 sessions</p>
              </div>
            </div>

            <div>
              <div className="grid gap-5 sm:grid-cols-2">
                {PREVIEW_METRICS.map((m) => (
                  <MetricBar key={m.label} label={m.label} score={m.score} detail={m.detail} />
                ))}
              </div>

              <div className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    What worked
                  </p>                  <p className="mt-1.5 flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    Your pause before the numbers read as confidence — the point landed.
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Next drill
                  </p>
                  <p className="mt-1.5 flex items-start gap-2 text-sm text-foreground">
                    <Target className="mt-0.5 size-4 shrink-0 text-primary" />
                    Replace “um” with a one-beat pause. Four minutes, then re-record.
                  </p>
                </div>
              </div>

              <Button asChild variant="hero" size="lg" className="mt-7 w-full rounded-full sm:w-auto">
                <Link to="/onboarding">
                  Get your first report <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">Pricing for India</span>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">Simple plans, built for your big day</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Start free to build your baseline, grab a pack for placement interviews, or go Pro for unlimited drills.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-3">
            {/* Free Tier */}
            <div className="surface flex flex-col justify-between p-6 sm:p-7">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Free</h3>
                  <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Starter
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold tracking-tight">₹0</span>
                  <span className="text-xs text-muted-foreground">/ month forever</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Build confidence with 3 AI-scored sessions every week.
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs sm:text-sm">
                  {[
                    ["3 practice sessions", " per week"],
                    ["Foundational speaking scenarios", ""],
                    ["Instant transcription & 6-metric scorecard", ""],
                    ["Basic pace & filler tracking", ""],
                  ].map(([main, tail]) => (
                    <li key={main} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-success" />
                      <span>
                        <strong>{main}</strong>
                        {tail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild variant="outline" size="lg" className="mt-6 w-full rounded-full">
                <Link to="/onboarding">Get started for free</Link>
              </Button>
            </div>

            {/* Event / Big Day Pack */}
            <div className="surface relative flex flex-col justify-between border border-primary/40 p-6 sm:p-7 bg-primary/5">
              <span className="absolute -top-3 right-5 rounded-full bg-secondary border border-border px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-foreground uppercase shadow-xs">
                One-Time Pack
              </span>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Interview Prep</h3>
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                    10 DRILLS
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold tracking-tight text-primary">₹99</span>
                  <span className="text-xs text-muted-foreground">/ single pack · no renewal</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ideal for placement interviews, GDs, and imminent pitch rounds.
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs sm:text-sm">
                  {[
                    ["10 high-stakes practice sessions", " to use anytime"],
                    ["Placement, GD & case interview scenarios", ""],
                    ["Detailed filler & pacing stability analysis", ""],
                    ["Line-level delivery coaching & rewrites", ""],
                  ].map(([main, tail]) => (
                    <li key={main} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 text-primary" />
                      <span>
                        <strong>{main}</strong>
                        {tail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild variant="outline" size="lg" className="mt-6 w-full rounded-full border-primary/40 text-primary hover:bg-primary/10">
                <Link to="/onboarding">
                  Get Interview Pack <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            {/* Pro Monthly */}
            <div className="surface relative flex flex-col justify-between border-2 border-primary/70 p-6 shadow-lift sm:p-7">
              <span className="absolute -top-3 right-5 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary-foreground uppercase shadow-sm">
                Recommended
              </span>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">SpeakCoach Pro</h3>
                  <span className="rounded-md border border-brand-yellow/30 bg-brand-yellow/10 px-2 py-0.5 text-[11px] font-bold text-warning">
                    PRO
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold tracking-tight">₹299</span>
                  <span className="text-xs text-muted-foreground">/ month · or ₹1,499 / 6 mo</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Unlimited practice for ambitious students, founders, and presenters.
                </p>
                <ul className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs sm:text-sm">
                  {[
                    ["Unlimited practice", " with zero weekly cap"],
                    ["Executive & MBA scenarios", " (GDs, Boardroom, Pitches)"],
                    ["Advanced acoustic analytics", " (variance, filler breakdown)"],
                    ["Attempt comparisons", " & priority AI coaching"],
                  ].map(([main, tail]) => (
                    <li key={main} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0 font-bold text-primary" />
                      <span>
                        <strong>{main}</strong>
                        {tail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild variant="hero" size="lg" className="mt-6 w-full rounded-full">
                <Link to="/onboarding">
                  Go Pro (₹299/mo) <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-foreground px-6 py-14 text-center sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-background sm:text-3xl">
            Your next talk deserves a rehearsal.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-background/70 sm:text-base">
            Pick a goal, speak for sixty seconds, and see exactly what to change — before it counts.
          </p>
          <div className="mt-7 flex justify-center">
            <Button asChild size="xl" variant="hero" className="rounded-full">
              <Link to="/onboarding">
                Start your first session <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Practice out loud. Improve on purpose.</p>
            <a
              href="mailto:hello@speakcoach.live"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4" /> hello@speakcoach.live
            </a>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground transition-colors hover:text-foreground">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/70">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>© 2026 SpeakCoach. All rights reserved.</p>
            <p>Speak with confidence. Improve with every conversation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
