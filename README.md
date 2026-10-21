# SpeakCoach

An AI public-speaking trainer. Pick a goal, answer a realistic scenario out loud, and get a scored report on pace, filler words, clarity, pronunciation, vocabulary and delivery. Then retry and compare attempts.

Live: https://speakcoach.live

## How it works

1. The browser records the answer as a WAV file.
2. `POST /api/analyze` sends it to Groq Whisper for a transcript, then to a Groq language model for the report.
3. The report is shown with line-level feedback and exercises.

The Groq key stays on the server and never reaches the browser.

## Tech

TanStack Start (React, Vite) deployed on Vercel. Groq for speech-to-text and analysis. Dodo Payments for the Pro subscription. Microsoft Clarity for analytics.

## Run locally

```bash
npm install
cp .env.example .env   # then fill in the keys
npm run dev
```

## Environment variables

| Name | Used for |
|---|---|
| `GROQ_API_KEY` | Speech-to-text and analysis (get one at console.groq.com/keys) |
| `DODO_PAYMENTS_API_KEY` | Creating checkout sessions and the customer portal |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Verifying payment webhooks (the webhook rejects everything without it) |

Set these in Vercel under Project Settings > Environment Variables, then redeploy.

## Known limitations

- Practice history and the Pro plan are stored in the browser (localStorage), not on a server. Accounts and server-side storage are the next piece of work.
- Rate limiting on `/api/analyze` is best-effort and per server instance.
