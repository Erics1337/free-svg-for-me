import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

import { checkRateLimit } from '../../../lib/rate-limit';

export async function POST(req: Request) {
  // Rate Limit Check
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const isAllowed = checkRateLimit(ip, { limit: 2, window: 60000 }); // 2 requests per minute

  if (!isAllowed) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const { messages, model, animate, transparent } = await req.json();

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

  let fullPrompt = `Create an SVG representation of the following object/item: "${prompt}"`;

  if (animate) {
    fullPrompt += `\n\nIMPORTANT: Make this SVG animated using CSS keyframes or SMIL. The animation should be subtle, continuous, and looping. Ensure the animation adds life to the object (e.g., glowing, floating, rotating parts, or color shifts).`;
  } else {
    fullPrompt += `\n\nIMPORTANT: Do NOT include any animations, CSS keyframes, or SMIL. The SVG should be completely static.`;
  }

  if (transparent) {
    fullPrompt += `\n\nIMPORTANT: The SVG must have a TRANSPARENT background. Do NOT include any background <rect> or shapes. The background should be left empty so it can be placed on any color.`;
  } else {
    fullPrompt += `\n\nIMPORTANT: The SVG MUST have a background. Include a background <rect> or shape that fills the viewBox with a color appropriate for the scene or object (e.g., a sky, a solid color, or a gradient). Do not leave the background transparent.`;
  }

  console.log("[Gemini SVG] streaming", { promptLength: prompt.length, model });

  const result = streamText({
    model: google(model || 'gemini-2.0-flash'),
    system: systemPrompt,
    prompt: fullPrompt,
    temperature: 0.4,
  });

  return result.toDataStreamResponse();
}
