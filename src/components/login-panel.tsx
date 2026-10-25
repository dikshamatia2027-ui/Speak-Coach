import * as React from "react";
import { Mail, Phone, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function LoginPanel() {
  const { signInWithEmail, configured } = useAuth();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showCheckEmail, setShowCheckEmail] = React.useState(false);
  const [resendTime, setResendTime] = React.useState(0);
  const [isResending, setIsResending] = React.useState(false);

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signInWithEmail(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  function startResendTimer() {
    setIsResending(true);
    let seconds = 30;
    const timer = setInterval(() => {
      setResendTime(seconds);
      seconds--;
      if (seconds <= 0) {
        clearInterval(timer);
        setIsResending(false);
        setResendTime(0);
      }
    }, 1000);
    return timer;
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <style>
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        }
      </style>
      {!sent ? (
        <div className="max-w-md w-full rounded-2xl overflow-hidden bg-card shadow-sm" >
          <div className="grid max-w-md w-full grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Left column: headline and benefits */}
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight p-4">Practice speaking. Get scored feedback.</h2>
              <div className="space-y-3 p-4" >
                <div className="flex items-start gap-3" >
                  <Phone className="size-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Scored report in seconds</p>
                    <p className="text-sm text-muted-foreground">Instant feedback on your practice sessions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-4" >
                  <Shield className="size-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Retry and compare attempts</p>
                    <p className="text-sm text-muted-foreground">See your progress and retry challenges.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-4" >
                  <Check className="size-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Progress saved to your account</p>
                    <p className="text-sm text-muted-foreground">Your history follows you across devices.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Right column: email form */}
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight p-4">Sign in to SpeakCoach</h2>
              <p className="text-sm text-muted-foreground p-4">
                Your practice history and plan are saved to your account, so they follow you to any device.
              </p>
              <form onSubmit={submit} className="p-4 space-y-3">
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
                  className="w-full rounded-xl border border-background bg-card px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disable:pointer-events-none disable:opacity-50"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy || !email}>
                  {busy ? "Sending…" : "Email me a sign-in link"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : showCheckEmail ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <Mail className="size-6 mx-auto mb-4" />
          <h3 className="text-xl font-bold tracking-tight mb-2">Check your email</h3>
          <p className="text-muted-foreground mb-6">We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue. It can take a minute to arrive, so check your spam folder too.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isResending ? (
              <Button
                disabled
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Waiting {resendTime}s
              </Button>
            ) : (
              <Button
                onClick={() => {
                  startResendTimer();
                  signInWithEmail(email.trim());
                }
                disabled={isResending}
                className="flex-1 rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Resend link
                </Button>
              )}
              <a
                href="#"
                onClick={() => setShowCheckEmail(false)}className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:text-primary"
                        >
                          Use a different email
                        </a>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-border bg-card p-4 text-sm">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device to continue. It can take a minute to arrive,
          so check your spam folder too.
        </p>
      )}
    </div>
  );
}
