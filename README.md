# Speak Coach AI

Build a polished AI-powered public speaking practice app called SpeakCoach. It helps users improve their speaking by practicing realistic scenarios aloud, receiving AI analysis, and retrying to improve.

Create these screens: a premium landing page, onboarding, user dashboard, voice practice session, AI feedback/results page, practice history, and profile/settings.

The main user flow should be: choose a goal such as job interview, presentation, meeting, sales pitch, or general confidence → receive a speaking question/scenario → record a spoken response using a prominent microphone interface → show the transcript → analyze the response with AI → display an actionable speaking report → allow the user to retry and compare attempts.

The feedback screen should include an overall speaking score and separate metrics for pace, filler words, clarity, pronunciation, vocabulary, and delivery/confidence. Show specific examples of what the user did well and what they should improve, followed by 2–3 concrete exercises.

The dashboard should show recent practice sessions, average score, improvement trend, current goal, and a prominent “Practice Now” button.

Use a modern premium AI SaaS aesthetic: clean whitespace, rounded cards, subtle blue/purple gradients, excellent typography, smooth micro-interactions, and a very simple distraction-free recording interface. Make everything fully responsive and mobile-friendly.

For the MVP, use realistic mock AI analysis and sample data so the complete product flow works end-to-end. Structure the app so real AI voice/transcription APIs and authentication can be connected later. the name of the app is public speaking trainer

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/90abe27a-a8fd-4986-b696-a8784c8a4584).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Dodo Payments Integration

SpeakCoach includes built-in integration with [Dodo Payments](https://dodopayments.com) for Pro subscriptions ($12/month) and customer billing management.

### Environment Variables

Copy `.env.example` to `.env` or set the following in your hosting provider (Vercel / Cloudflare):

| Variable | Description |
| :--- | :--- |
| `DODO_PAYMENTS_API_KEY` | Secret API key from [Dodo Payments Dashboard](https://app.dodopayments.com) (`test_...` or `live_...`) |
| `DODO_PAYMENTS_PRODUCT_ID` | Product ID for the Pro Tier subscription (`pdt_...`) |
| `DODO_PAYMENTS_WEBHOOK_KEY` | Webhook secret for verifying webhook signatures (`whsec_...`) |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` (default) or `live_mode` |
| `DODO_PAYMENTS_BUSINESS_ID` | Optional: Business ID for self-service Customer Portal |

### Webhook Endpoint
Configure your Dodo Payments webhook destination URL:
`https://your-domain.com/api/webhooks/dodo`

## Deploy to Vercel

1. Import this repository into [Vercel](https://vercel.com/new).
2. Framework Preset: **Other** or **Vite** (our `vercel.json` and Nitro Build Output API v3 handle the build automatically).
3. Set your environment variables (`DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_PRODUCT_ID`, etc.).
4. Click **Deploy**.
