# SpeakCoach — shared change log

Two people work on this repo with different AI tools: **Saprabh** (Claude Code) and **Diksha** (Antigravity).
This file is how we tell each other what changed. Read it before you start; add to it before you push.

## Rules (for both humans and AI tools)

**Before starting work**
1. `git fetch origin` and compare your branch with `origin/main` (`git log --oneline HEAD..origin/main`).
2. Read the newest entries below, plus any commits on `main` that have no entry yet.
3. If `main` has moved, merge it into your branch first (`git merge origin/main`). Never rebase or force-push: Lovable syncs `main`.

**When you push a change**
1. Add an entry at the top of the **Log** (newest first) in the same commit or pull request.
2. Say who, which branch or PR, what changed and why, which files, and anything the other person must do
   (run SQL, set an env var, redeploy, re-test something).
3. Never paste keys, passwords or user data here. Name the variable, not its value.

**Entry template**

```
### YYYY-MM-DD — Short title (Name, AI tool)
Branch/PR: ... | Status: merged / open / pushed to main
- What changed and why
- Files: ...
- Action needed: ... (or "none")
```

---

## Log

### 2026-11-17 — Shared change log (Saprabh, Claude Code)
PR #4 (`docs/shared-changelog`) | Status: merged (`3a2b955`)
- Added this file, plus `CLAUDE.md` and a section in `AGENTS.md` so both AI tools read it and keep it updated.
- Action needed: none.

### 2026-11-17 — Skip onboarding for signed-in users, fix one-letter names (Diksha, Antigravity)
Commit `b5af246` | Status: pushed to `main`
- Signed-in users with sessions (or `onboarded: true`) are sent from `/onboarding` to `/dashboard`.
- Onboarding pre-fills the name (account name → saved name longer than 1 letter → name from email) and skips the name step if one is known.
- Landing page buttons go to `/dashboard` when signed in, `/onboarding` when not.
- `auth.tsx` ignores one-letter saved names (the "Welcome back, h" bug).
- Files: `src/routes/onboarding.tsx`, `src/routes/index.tsx`, `src/lib/auth.tsx`
- Action needed: none.
- Note from Saprabh's review: onboarding still accepts a one-letter `full_name` from account metadata (only the stored profile name is checked for length).

### 2026-11-16 — Scientific speech metrics for Pro (Diksha, Antigravity)
Commit `6b4efd3` | Status: pushed to `main`
- New `computeProDiagnostics` (pause-to-speech ratio, lexical density, cadence variance, hedging phrases) added to each analysis; shown on the results page for Pro.
- Upgrade modal benefit list rewritten to match.
- Files: `src/lib/speakcoach.ts`, `src/lib/ai/analyze.server.ts`, `src/routes/results.$sessionId.tsx`, `src/components/pro-upgrade-modal.tsx`
- Action needed: none.
- Note from Saprabh's review: the diagnostics are sent to free users too and only hidden in the page, so a free user could read them from the network response.

### 2026-11-15 — Per-user AI limits (Saprabh, Claude Code)
PR #3 (`fix/per-user-ai-limits`) | Status: merged (`bf0963e`), SQL already run on production Supabase
- Vocabulary sentence check had no limit: now 40 per hour per account.
- Custom scenarios and practice analysis were limited per network in server memory (blocked shared Wi-Fi, reset on restart): now 10 and 15 per hour per account, counted in Supabase.
- Per-network limits kept only as a loose flood guard (40 and 60 per hour).
- Falls back to an in-memory per-account count if the database function is missing.
- Files: `src/lib/ai-quota.server.ts` (+ test), `src/lib/vocab.functions.ts`, `src/routes/api/analyze.ts`, `src/routes/api/generate-scenario.ts`, `supabase-schema.sql`
- Database: new table `ai_usage` and function `take_ai_quota` (already created on production).
- Action needed: none.

### 2026-11-15 — Dodo API key fixed (Saprabh, dashboards only — no code)
- `DODO_PAYMENTS_API_KEY` in Vercel was a masked copy (contained `•`), which broke checkout. Replaced with a full live key.
- The key needed **Checkout Sessions: Write** and **Customers: Write**; **Payments: Read** is used by the webhook.
- Action needed: delete unused old keys in Dodo; check `DODO_PAYMENTS_WEBHOOK_KEY` in Vercel is not masked too.

### 2026-11-15 — Reminder cron endpoint no longer leaks emails (Saprabh, Claude Code)
PR #2 (`fix/cron-email-leak`) | Status: merged (`377a0a7`)
- `/api/cron/nudge-emails` was public and returned users' emails. It now needs `Authorization: Bearer <CRON_SECRET>`, compared in constant time, and refuses everyone if `CRON_SECRET` is unset. The response returns counts only.
- Files: `src/lib/cron-auth.server.ts` (+ test), `src/routes/api/cron/nudge-emails.ts`
- `CRON_SECRET` is set in Vercel Production.
- Action needed (Diksha): the endpoint does not send any email yet, and `vercel.json` has no cron schedule calling it. `listUsers` only reads the first 50 users.

### 2026-11-15 — Live Dodo payments (Diksha, Antigravity)
Commit `899d8de` | Status: pushed to `main`
- Checkout via Dodo is live; "coming soon" states removed from pricing and settings.
- Files: `src/components/pro-upgrade-modal.tsx`, `src/routes/index.tsx`, `src/routes/settings.tsx`, `src/routeTree.gen.ts`

### 2026-11-14 — Audit fixes: limits, payments, data ownership, practice and mobile UI (Saprabh, Claude Code)
PR #1 (`fix/audit-top-10`) | Status: merged (`511dfbe`)
- Free weekly limit enforced on the server with an atomic Supabase function `reserve_analysis`; failed analyses are given back.
- Payment webhook only grants Pro for `DODO_PAYMENTS_PRODUCT_ID`, applies events in order (`apply_plan_event`), and Pro expires at `plan_renews_at`.
- Row-level security rewritten: users can only read their own profile and manage their own sessions; plan is server-only.
- Recordings stop at 130 seconds (Vercel 4.5 MB upload limit); practice blocks leaving the page while recording; mobile nav has five tabs; mic icon only means record.
- Colour palette restored to the earlier blue (`--primary: #2563eb`).
- Database: `supabase-schema.sql` run on production. Vercel env vars copied to Preview; Supabase redirect URL `https://*-no-talking.vercel.app/**` added for previews.

### 2026-11-08 — Custom scenarios, XP and badges, inactivity nudges (Diksha, Antigravity)
Commit `46230e8` | Status: pushed to `main`
- Custom scenario generator (`/api/generate-scenario`), XP bar and badges, reminder cron endpoint.

---

## Still open (from Saprabh's security audit)
- S9: the browser sends duration, prompt and goal for analysis, and Pro-only scenarios are not enforced on the server.
- S10: upload size is checked with the `content-length` header only; audio type is not checked.
- S8: the payment webhook falls back to matching users by email.
- S11: raw error messages from Dodo and the AI reach users.
- S13: no security headers (CSP, X-Frame-Options and so on).
- S14/S15: analytics load without consent; the privacy policy must mention Dodo and reminder emails.
- S16: `npm audit` reports 4 production issues (zod is high).
- S17: `/api/customer-portal` has no sign-in check.
