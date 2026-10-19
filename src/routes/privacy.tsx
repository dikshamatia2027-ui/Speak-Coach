import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — SpeakCoach" },
      { name: "description", content: "How SpeakCoach handles your practice data." },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "What we store",
    body: "Your practice sessions — recordings, transcripts and AI-generated scores — are stored to show your progress and history. Your name, goal and preferences are stored to personalise the app.",
  },
  {
    title: "What we never do",
    body: "We do not sell your data, share it with advertisers, or use your practice recordings to train public models.",
  },
  {
    title: "Payments",
    body: "Payments are processed by Dodo Payments. SpeakCoach never sees or stores your full card details.",
  },
  {
    title: "Your choices",
    body: "You can clear your practice history and account data at any time from Settings. Deleting your data removes your sessions, scores and profile permanently.",
  },
  {
    title: "Contact",
    body: "Questions about your privacy? Email hello@speakcoach.live and we will respond within a few days.",
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-15 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <span className="text-xs font-semibold tracking-wider text-primary uppercase">Legal</span>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © 2026 SpeakCoach. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
