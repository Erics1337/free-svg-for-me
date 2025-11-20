import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = 'gemini-3-pro-preview';

  return NextResponse.json({
    hasKey: Boolean(apiKey),
    keyPreview: apiKey ? `${apiKey.slice(0, 6)}***` : null,
    model,
    nodeEnv: process.env.NODE_ENV,
  });
}
