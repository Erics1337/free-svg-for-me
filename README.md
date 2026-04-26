# Free SVG For Me 🎨

**Free SVG For Me** is a simple, powerful tool that generates custom SVGs, icons, and vector art from text descriptions using AI.

Users get 3 free Pro generations, then purchase credit packs to continue.

## Features

- 🖌️ **Text-to-SVG:** Powered by Google Gemini AI.
- ⚡ **Streaming Generation:** Live preview as SVG renders.
- 💳 **Credits:** Buy credit packs via Stripe, spend on Pro model generations.
- 🔐 **Auth:** Supabase email + Google OAuth.
- 📱 **Responsive:** Works on mobile and desktop.

## Tech Stack

- **Frontend:** React + Vite (`index.tsx`)
- **API Routes:** Next.js App Router (`/app/api`)
- **Backend:** AWS Lambda Node.js 20 (streaming)
- **Auth + Credits:** Supabase (Postgres + RLS + Edge Functions)
- **Payments:** Stripe Checkout
- **Infra:** Terraform
- **AI:** Google Gemini (Flash, 3.0 Pro, 3.1 Pro)
- **Styling:** Tailwind CSS

## Credit System

| Model | Credit Cost |
|---|---|
| Gemini 2.0 Flash | 1 |
| Gemini 3.0 Pro | 3 |
| Gemini 3.1 Pro | 5 |

New users get **3 free Pro generations**. Credit packages: $4/20 credits, $15/100, $60/500.

## Deployed Endpoints

| Service | URL |
|---|---|
| Lambda | Set `NEXT_PUBLIC_LAMBDA_FUNCTION_URL` in `.env.local` |
| Stripe Webhook | Configured in Stripe dashboard — see private deployment docs |
| Supabase | Set `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` |

## Running Locally

1. **Install dependencies:** `npm install`
2. **Set up environment:** Copy `.env.example` to `.env.local` and fill in all values.
3. **Run dev server:** `npm run dev`
4. **(Optional) Test Stripe webhooks locally:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   Use test card `4242 4242 4242 4242`.

## Deploying

### Lambda
```bash
cd typescript_lambda && npm run build
cd ../terraform && terraform apply
```

### Supabase Edge Function (Stripe webhook)
```bash
supabase functions deploy stripe-webhook
```

---

_Built by [Eric Swanson](https://github.com/Erics1337)_
