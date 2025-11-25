import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, createDataStreamResponse } from 'ai';
import { checkRateLimit } from '../../../lib/rate-limit';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log("[API] Request received");

    // Rate Limit Check
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const isAllowed = checkRateLimit(ip, { limit: 5, window: 60000 }); // Increased limit for testing

    if (!isAllowed) {
      console.warn(`[API] Rate limit exceeded for IP: ${ip}`);
      return new Response('Too Many Requests', { status: 429 });
    }

    // Initialize Google AI Client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[API] GEMINI_API_KEY is missing");
      return new Response(JSON.stringify({ error: 'Configuration Error', details: 'API Key is missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[API] Failed to parse JSON body", e);
      return new Response('Invalid JSON body', { status: 400 });
    }

    const { messages, prompt: bodyPrompt, model, animate, transparent } = body;

    // Get the prompt from either messages (chat) or prompt (completion)
    const prompt = bodyPrompt || (messages?.length > 0 ? messages[messages.length - 1].content : "");

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

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

    // Use createDataStreamResponse to allow sending immediate data
    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Send an initial message to flush the headers and keep the connection alive
        // Note: writeData writes a raw string. The client needs to handle this or ignore it if it expects JSON.
        // For ai sdk, it's safer to just start streaming.
        // dataStream.writeData('started'); 

        const result = streamText({
          model: google(model || 'gemini-2.0-flash'),
          system: systemPrompt,
          prompt: fullPrompt,
          temperature: 0.4,
          abortSignal: req.signal,
        });

        // Send a keep-alive message every 5 seconds to prevent timeout
        // Using a comment or whitespace might be safer if the client parses JSON/text
        const keepAliveInterval = setInterval(() => {
          // dataStream.writeData(' '); // Send a space as keep-alive
        }, 5000);

        try {
          await result.mergeIntoDataStream(dataStream);
        } catch (streamError) {
          console.error("[API] Stream execution error:", streamError);
          // We can't change the status code here as headers are sent, but we can log it.
          throw streamError;
        } finally {
          clearInterval(keepAliveInterval);
        }
      },
      onError: (error) => {
        console.error("Stream error:", error);
        return "An error occurred while generating the SVG.";
      }
    });

  } catch (error) {
    console.error("[API] Unhandled error:", error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
