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
        status: 503, // Service Unavailable
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
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
      execute: async (dataStream) => {
        console.log("[API] Stream execution started");

        // Send an initial message to flush the headers and keep the connection alive
        const padding = ' '.repeat(4096);
        dataStream.writeData('initialized' + padding);
        console.log("[API] Initial padding sent");

        // Keep-alive interval
        const keepAliveInterval = setInterval(() => {
          dataStream.writeData('keep-alive');
        }, 5000);

        const generateWithTimeout = async (modelId: string, timeoutMs: number) => {
          const controller = new AbortController();
          // Link user cancellation to our controller
          const abortHandler = () => controller.abort();
          req.signal.addEventListener('abort', abortHandler);

          let timeoutId: NodeJS.Timeout | undefined;
          if (timeoutMs > 0) {
            timeoutId = setTimeout(() => {
              console.log(`[API] Timeout ${timeoutMs}ms reached for ${modelId}`);
              controller.abort('TimeoutError');
            }, timeoutMs);
          }

          try {
            console.log(`[API] Starting generation with ${modelId} (timeout: ${timeoutMs}ms)`);

            let hasChunks = false;
            // Wrap the original writeData to track chunks
            const originalWriteData = dataStream.writeData;
            dataStream.writeData = (data) => {
              hasChunks = true;
              // Clear timeout on first write
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
              }
              return originalWriteData.call(dataStream, data);
            };

            const result = streamText({
              model: google(modelId),
              system: systemPrompt,
              prompt: fullPrompt,
              temperature: 0.4,
              abortSignal: controller.signal,
            });

            await result.mergeIntoDataStream(dataStream);

            // Restore original method (good practice)
            dataStream.writeData = originalWriteData;

            if (!hasChunks) {
              console.warn(`[API] Model ${modelId} returned empty stream.`);
              throw new Error("EmptyStreamError");
            }

            console.log(`[API] Finished ${modelId}`);

          } catch (error: any) {
            console.error(`[API] Error with ${modelId}:`, error);
            throw error;
          } finally {
            if (timeoutId) clearTimeout(timeoutId);
            req.signal.removeEventListener('abort', abortHandler);
          }
        };

        try {
          const primaryModel = model || 'gemini-2.0-flash';
          // Only apply timeout if it's the Pro model
          const isPro = primaryModel.includes('pro');

          // Try primary model with 15s timeout if Pro
          await generateWithTimeout(primaryModel, isPro ? 15000 : 0);

        } catch (error: any) {
          // Check if it was our timeout, a user abort, or an empty stream
          const isTimeout = error === 'TimeoutError' || (error instanceof Error && error.name === 'AbortError' && !req.signal.aborted);
          const isEmptyStream = error instanceof Error && error.message === 'EmptyStreamError';

          if ((isTimeout || isEmptyStream) && (model || '').includes('pro')) {
            console.log(`[API] Primary model failed (${isTimeout ? 'timeout' : 'empty stream'}). Switching to fallback: gemini-2.0-flash`);
            // Inform client (optional, might break JSON parsing if strict, but this is a text stream)
            // dataStream.writeData("\n<!-- Switching to faster model -->\n"); 

            try {
              await generateWithTimeout('gemini-2.0-flash', 0);
            } catch (fallbackError) {
              console.error("[API] Fallback failed:", fallbackError);
              throw fallbackError;
            }
          } else {
            // If it was a real error or user cancelled, rethrow
            throw error;
          }
        } finally {
          clearInterval(keepAliveInterval);
          console.log("[API] Stream execution finished");
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
