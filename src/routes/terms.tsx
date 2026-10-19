import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/app-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — SpeakCoach" },
      { name: "description", content: "The terms of using SpeakCoach." },
    ],
  }),
  component: TermsPage,
});

const SECTIONS = [
  {
    title: "Using SpeakCoach",
    body: "SpeakCoach is a practice tool. You agree to use it for personal skill development and not to misuse the service, interfere with its operation, or attempt to access it in ways these terms do not allow.",
  },
  {
    title: "Your content",
    body: "Your recordings and transcripts remain yours. You grant SpeakCoach the limited permission needed to analyse them and show you your results.",
  },
  {
    title: "Subscriptions",
    body: "Pro subscriptions are billed monthly at $12 and can be cancelled any time. Cancellation takes effect at the end of the current billing period. Payments are handled by Dodo Payments.",
  },
  {
    title: "AI feedback",
    body: "Coaching scores and suggestions are automated. They are guidance, not professional advice, and should not be relied on as the sole basis for high-stakes decisions.",
  },
  {
    title: "Contact",
    body: "Questions about these terms? Email hello@speakcoach.live.",
  },
];

function TermsPage() {
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
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight">Terms of Service</h1>
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
