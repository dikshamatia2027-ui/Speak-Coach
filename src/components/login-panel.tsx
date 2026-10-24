import * as React from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function LoginPanel() {
  const { signInWithEmail, configured } = useAuth();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signInWithEmail(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Mail className="size-6" />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Sign in to SpeakCoach</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your practice history and plan are saved to your account, so they follow you to any device.
      </p>

      {!configured ? (
        <p className="mt-6 text-sm text-destructive">Sign-in is not set up yet. Please try again later.</p>
      ) : sent ? (
        <p className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue. It can take a minute to arrive,
          so check your spam folder too.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3 text-left">
          <label className="text-sm font-medium" htmlFor="login-email">
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
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy || !email}>
            {busy ? "Sending…" : "Email me a sign-in link"}
          </Button>
          <p className="text-xs text-muted-foreground">No password needed. We only use your email to sign you in.</p>
        </form>
      )}
    </div>
  );
}
