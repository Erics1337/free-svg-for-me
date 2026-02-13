# Free SVG For Me 🎨

**Free SVG For Me** is a simple, powerful tool that generates custom SVGs, icons, and vector art from text descriptions using AI.

No signups. No paywalls. Just free vector art for your projects.

## Features

- 🖌️ **Text-to-SVG:** Powered by Google Gemini AI.
- ⚡ **Instant Generation:** Get clean code-ready SVGs in seconds.
- 🆓 **100% Free:** Monetized via unobtrusive ads, so you don't have to pay.
- 📱 **Responsive:** Works on mobile and desktop.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Backend:** AWS Lambda (Python 3.13 & Node.js 20)
- **Styling:** Tailwind CSS
- **AI:** Google Gemini (gemini-2.0-flash)
- **Icons:** Lucide React

## Backend Architecture (Migration)

We currently run two parallel Lambda functions for testing and migration purposes:

| Feature              | Node.js (Legacy)                          | Python (New)                     |
| :------------------- | :---------------------------------------- | :------------------------------- |
| **Function Name**    | `gemini-svg-generator`                    | `gemini-svg-generator-python`    |
| **Runtime**          | Node.js 20.x                              | Python 3.13                      |
| **Response Type**    | Streaming (`awslambda.streamifyResponse`) | Standard JSON (`{"svg": "..."}`) |
| **Timeout Handling** | Basic (Platform Native)                   | Robust (Threading + Fallback)    |
| **Analytics**        | PostHog (npm)                             | PostHog (python)                 |

To switch your frontend between the Node.js and Python backends, update the `NEXT_PUBLIC_LAMBDA_FUNCTION_URL` environment variable.

## Running Locally

1. **Clone the repo**
2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment:**
   Create a `.env` file and add your Gemini API key:

   ```bash
   GEMINI_API_KEY=your_key_here
   ```

4. **Run the dev server:**

   ```bash
   npm run dev
   ```

---

_Built by [Eric Swanson](https://github.com/Erics1337)_
