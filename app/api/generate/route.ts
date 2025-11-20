import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute
const ipRequestMap = new Map<string, { count: number; lastRequest: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record) {
    ipRequestMap.set(ip, { count: 1, lastRequest: now });
    return false;
  }

  // Reset if window has passed
  if (now - record.lastRequest > RATE_LIMIT_WINDOW) {
    ipRequestMap.set(ip, { count: 1, lastRequest: now });
    return false;
  }

  // Increment count
  record.count += 1;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now - record.lastRequest > RATE_LIMIT_WINDOW) {
      ipRequestMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW * 2);


export async function POST(request: Request) {
  // 1. Rate Limiting Check
  const headersList = await headers(); // Ensure we await the headers() call in newer Next.js versions if needed, or just call it. In Next 15+ await is required.
  const ip = headersList.get("x-forwarded-for") || "unknown";
  
  // In dev, x-forwarded-for might be null or ::1, which is fine. 
  // In prod, it's the user's IP.
  
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "You are generating too fast! Please wait a minute." },
      { status: 429, headers: corsHeaders }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return NextResponse.json(
      { error: "Gemini API Key is missing or invalid in server environment." },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `
      You are a world-class expert in Scalable Vector Graphics (SVG) design and coding. 
      Your task is to generate a high-quality, visually stunning, and detailed SVG based on the user's description of an object or item.
      
      Guidelines:
      1.  **Output Format**: Return ONLY the raw SVG code. Do not wrap it in markdown code blocks (e.g., no \`\`\`xml). Do not add any conversational text before or after.
      2.  **Quality**: Use gradients, proper pathing, and distinct colors to create depth and visual appeal. Avoid simple stroked lines unless requested. The style should be "flat art" or "material design" unless specified otherwise.
      3.  **Technical**: 
          - Always include a \`viewBox\` attribute.
          - Ensure the SVG is self-contained (no external references).
          - Use semantic IDs or classes if helpful, but inline styles are preferred for portability.
          - Default size should be square (e.g., 512x512) unless the aspect ratio suggests otherwise.
    `;

    const fullPrompt = `Create an SVG representation of the following object/item: "${prompt}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
      },
    });

    const rawText = response.text || '';
    
    // Robust cleanup
    const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
    let cleanSvg = rawText;
    
    if (svgMatch && svgMatch[0]) {
      cleanSvg = svgMatch[0];
    } else {
      cleanSvg = rawText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    }

    return NextResponse.json({ svg: cleanSvg }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate SVG" },
      { status: 500, headers: corsHeaders }
    );
  }
}
