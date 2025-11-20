import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  // Get the last message content as the prompt
  const lastMessage = messages[messages.length - 1];
  const prompt = lastMessage.content;

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

  console.log("[Gemini SVG] streaming", { promptLength: prompt.length, model });

  const result = streamText({
    model: google(model || 'gemini-2.0-flash'),
    system: systemPrompt,
    prompt: fullPrompt,
    temperature: 0.4,
  });

  return result.toDataStreamResponse();
}
