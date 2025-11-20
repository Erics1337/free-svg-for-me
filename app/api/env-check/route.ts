import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.0-pro";

  return NextResponse.json({
    hasKey: Boolean(apiKey),
    keyPreview: apiKey ? `${apiKey.slice(0, 6)}***` : null,
    model,
    nodeEnv: process.env.NODE_ENV,
  });
}
