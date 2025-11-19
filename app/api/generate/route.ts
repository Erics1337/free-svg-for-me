import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return NextResponse.json(
      { error: "Gemini API Key is missing or invalid in server environment." },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
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

    return NextResponse.json({ svg: cleanSvg });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate SVG" },
      { status: 500 }
    );
  }
}
