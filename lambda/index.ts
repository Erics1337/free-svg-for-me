import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { PostHog } from 'posthog-node';
import { withTracing } from '@posthog/ai';

// AWS Lambda Streaming Handler wrapper
declare const awslambda: {
    streamifyResponse: (
        handler: (event: any, responseStream: any, context: any) => Promise<void>
    ) => any;
    HttpResponseStream: {
        from: (stream: any, metadata: any) => any;
    };
};

export const handler = awslambda.streamifyResponse(async (event: any, responseStream: any, _context: any) => {
    console.log("Request received");

    // Initialize PostHog
    const posthogApiKey = process.env.POSTHOG_API_KEY;
    const posthogHost = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
    let posthog: PostHog | null = null;

    if (posthogApiKey) {
        console.log("Initializing PostHog with host:", posthogHost);
        posthog = new PostHog(posthogApiKey, {
            host: posthogHost,
            flushAt: 1,
            flushInterval: 0
        });
    } else {
        console.log("PostHog API Key not found");
    }

    // Set headers for SSE
    const metadata = {
        statusCode: 200,
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    };

    // Write metadata to the stream (this is how Lambda Function URLs handle headers in streaming mode)
    // Note: The exact method depends on the runtime interface, but typically responseStream is a writable.
    // For Function URLs with streamifyResponse, we use a specific helper or just write.
    // Actually, awslambda.streamifyResponse handles the http wrapping.
    // We can use responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);
    // But since we don't have the types, let's try to set it via the object if possible or just rely on default.
    // Better:
    responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        console.error("Failed to parse body", e);
        responseStream.write('error: Invalid JSON body');
        responseStream.end();
        return;
    }

    const { messages, prompt: bodyPrompt, model, animate, transparent } = body;
    const prompt = bodyPrompt || (messages?.length > 0 ? messages[messages.length - 1].content : "");

    if (!prompt) {
        responseStream.write('error: Prompt is required');
        responseStream.end();
        return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        responseStream.write('error: API Key missing');
        responseStream.end();
        return;
    }

    const google = createGoogleGenerativeAI({ apiKey });

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

    // AI SDK DataStreamWriter adapter for AWS ResponseStream
    const dataStreamWriter = {
        writeData: (data: string) => {
            responseStream.write(data);
        },
        write: (data: string) => {
            responseStream.write(data);
        }
    };

    // Initial padding to flush buffers
    dataStreamWriter.writeData('initialized' + ' '.repeat(4096));

    // Keep-alive interval
    const keepAliveInterval = setInterval(() => {
        dataStreamWriter.writeData('keep-alive');
    }, 5000);

    const generateWithTimeout = async (modelId: string, timeoutMs: number) => {
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | undefined;

        if (timeoutMs > 0) {
            timeoutId = setTimeout(() => {
                console.log(`Timeout ${timeoutMs}ms reached for ${modelId}`);
                controller.abort('TimeoutError');
            }, timeoutMs);
        }

        try {
            console.log(`Starting generation with ${modelId}`);
            let hasChunks = false;

            // Wrap writer to detect chunks
            const originalWrite = dataStreamWriter.writeData;
            dataStreamWriter.writeData = (data) => {
                hasChunks = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = undefined;
                }
                originalWrite(data);
            };

            // Wrap the model with PostHog tracing if PostHog is initialized
            let wrappedModel = google(modelId);
            if (posthog) {
                wrappedModel = withTracing(wrappedModel, posthog, {
                    posthogDistinctId: 'lambda-generator',
                    posthogProperties: {
                        animate,
                        transparent,
                        $ai_provider: 'google',
                        $ai_base_url: 'https://generativelanguage.googleapis.com/v1beta'
                    }
                });
            }

            const result = await streamText({
                model: wrappedModel,
                system: systemPrompt,
                prompt: fullPrompt,
                temperature: 0.4,
                abortSignal: controller.signal,
                onChunk: () => {
                    hasChunks = true;
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = undefined;
                    }
                }
            });

            // Stream the result
            const stream = result.textStream;
            const reader = stream.getReader();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += value;
                responseStream.write(value);
            }

            // Restore
            dataStreamWriter.writeData = originalWrite;

            if (!hasChunks) {
                throw new Error("EmptyStreamError");
            }

            console.log(`Finished ${modelId}`);

        } catch (error) {
            console.error(`Error with ${modelId}:`, error);
            throw error;
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    };

    try {
        const primaryModel = model || 'gemini-2.0-flash';
        const isPro = primaryModel.includes('pro');

        // Try primary
        await generateWithTimeout(primaryModel, isPro ? 15000 : 0);

    } catch (error: any) {
        const isTimeout = error === 'TimeoutError' || (error instanceof Error && error.name === 'AbortError');
        const isEmptyStream = error instanceof Error && error.message === 'EmptyStreamError';

        if ((isTimeout || isEmptyStream) && (model || '').includes('pro')) {
            console.log("Switching to fallback: gemini-2.0-flash");
            try {
                await generateWithTimeout('gemini-2.0-flash', 0);
            } catch (fallbackError) {
                console.error("Fallback failed", fallbackError);
                dataStreamWriter.writeData('Error: Failed to generate SVG with both models.');
            }
        } else {
            // If it was a real error or user cancelled, we should probably output it
            console.error("Generation failed", error);
            dataStreamWriter.writeData(`Error: Generation failed: ${error.message}`);
        }
    } finally {
        clearInterval(keepAliveInterval);
        responseStream.end();
        if (posthog) {
            await posthog.shutdown();
        }
    }
});
