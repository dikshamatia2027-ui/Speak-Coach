import * as React from "react";
import { Mail, Mic, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const RESEND_SECONDS = 30;

const BENEFITS = [
  { icon: Mic, text: "A scored report on your answer in seconds" },
  { icon: RefreshCw, text: "Retry and compare your attempts" },
  { icon: ShieldCheck, text: "Progress saved to your account, on any device" },
] as const;

export function LoginPanel() {
  const { signInWithEmail, configured } = useAuth();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function send() {
    setError(null);
    setBusy(true);
    const res = await signInWithEmail(email.trim());
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSent(true);
    setCooldown(RESEND_SECONDS);
  }

  function onSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    void send();
  }

  return (
    <div className="mx-auto w-full max-w-3xl py-6 sm:py-12">
      <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 bg-accent/60 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Practice speaking. Get scored feedback.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer a realistic scenario out loud and see exactly what to improve.
            </p>
          </div>
          <ul className="space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          {!configured ? (
            <p className="text-sm text-destructive" role="alert">
              Sign-in is not set up yet. Please try again later.
            </p>
          ) : sent ? (
            <div className="text-center md:text-left">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary md:mx-0">
                <Mail className="size-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-bold">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a sign-in link to <strong className="text-foreground">{email}</strong>. Open it on this device. It can take a
                minute to arrive, so check your spam folder too.
              </p>
              {error && (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={cooldown > 0 || busy}
                  onClick={() => void send()}
                  className="w-full"
                >
                  {busy ? "Sending…" : cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend link"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setError(null);
                    setCooldown(0);
                  }}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <h2 className="text-xl font-bold">Sign in to SpeakCoach</h2>
              <p className="text-sm text-muted-foreground">No password needed. We email you a link.</p>
              <label className="block pt-2 text-sm font-medium" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy || !email}>
                {busy ? "Sending…" : "Email me a sign-in link"}
              </Button>
              <p className="text-xs text-muted-foreground">We only use your email to sign you in.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
