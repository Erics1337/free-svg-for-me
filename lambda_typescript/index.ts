import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { PostHog } from 'posthog-node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// AWS Lambda Streaming Handler wrapper
declare const awslambda: {
    streamifyResponse: (
        handler: (event: any, responseStream: any, context: any) => Promise<void>
    ) => any;
    HttpResponseStream: {
        from: (stream: any, metadata: any) => any;
    };
};

// In-memory IP rate limit for anonymous users: 3 requests per hour
const anonRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const ANON_LIMIT = 3;
const ANON_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkAnonRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();

    // Purge all expired entries to prevent unbounded Map growth
    for (const [key, rec] of anonRateLimitStore) {
        if (now > rec.resetTime) anonRateLimitStore.delete(key);
    }

    const record = anonRateLimitStore.get(ip);
    if (!record) {
        anonRateLimitStore.set(ip, { count: 1, resetTime: now + ANON_WINDOW_MS });
        return { allowed: true, remaining: ANON_LIMIT - 1 };
    }
    if (record.count >= ANON_LIMIT) {
        return { allowed: false, remaining: 0 };
    }
    record.count += 1;
    return { allowed: true, remaining: ANON_LIMIT - record.count };
}

// Credit costs per model
const CREDIT_COSTS: Record<string, number> = {
    'gemini-2.0-flash': 1,
    'gemini-3-pro-preview': 3,
    'gemini-3.1-pro-preview': 5,
};

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

    const { messages, prompt: bodyPrompt, model, animate, transparent, authToken } = body;
    const prompt = bodyPrompt || (messages?.length > 0 ? messages[messages.length - 1].content : "");

    if (!prompt) {
        responseStream.write('error: Prompt is required');
        responseStream.end();
        return;
    }

    const ALLOWED_MODELS = Object.keys(CREDIT_COSTS);
    const modelId = ALLOWED_MODELS.includes(model) ? model : 'gemini-2.0-flash';
    if (model && !ALLOWED_MODELS.includes(model)) {
        console.warn(`Invalid model requested: "${model}", falling back to gemini-2.0-flash`);
    }
    const isProModel = modelId.includes('pro');
    const creditCost = CREDIT_COSTS[modelId];

    if (authToken) {
        // --- Authenticated path: verify JWT and deduct credits ---
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
        if (authError || !user) {
            console.error("Auth error:", authError);
            responseStream.write('error: Invalid authentication. Please sign in again.');
            responseStream.end();
            return;
        }

        console.log("User authenticated:", user.id.substring(0, 8) + "…");

        const { data: deductionResult, error: deductionError } = await supabase.rpc('deduct_credits_for_generation', {
            p_user_id: user.id,
            p_credits_needed: creditCost,
            p_model: modelId,
            p_is_pro_model: isProModel,
        });

        if (deductionError) {
            console.error("Credit deduction error:", deductionError);
            responseStream.write('error: Failed to process credits. Please try again.');
            responseStream.end();
            return;
        }

        const result = Array.isArray(deductionResult) ? deductionResult[0] : deductionResult;
        if (!result || !result.success) {
            const errorMsg = result?.error_message || 'Insufficient credits';
            console.log("Credit check failed:", errorMsg);
            responseStream.write(`error: ${errorMsg}. Please purchase more credits.`);
            responseStream.end();
            return;
        }

        console.log("Credits deducted:", {
            userId: user.id,
            model: modelId,
            cost: creditCost,
            usedFreeTier: result.used_free_tier,
            remainingCredits: result.remaining_credits
        });
    } else {
        // --- Anonymous path: IP rate limit (3/hour), Flash only ---
        if (isProModel) {
            responseStream.write('error: Sign in required to use Pro models.');
            responseStream.end();
            return;
        }

        // Prefer the gateway-assigned source IP (not client-controllable).
        // Fall back to the rightmost x-forwarded-for entry (appended by the trusted proxy).
        const xffLast = event.headers?.['x-forwarded-for']?.split(',').at(-1)?.trim();
        const clientIp = event.requestContext?.http?.sourceIp || xffLast || crypto.randomUUID();

        const { allowed, remaining } = checkAnonRateLimit(clientIp);
        if (!allowed) {
            responseStream.write(`error: Rate limit reached. Sign up for free to get 10 credits and keep generating.`);
            responseStream.end();
            return;
        }

        console.log(`Anonymous generation, ${remaining} attempts remaining this hour`);
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

            // Wrap writer to reset the timeout on any write (including keep-alives).
            // hasChunks is set exclusively by onChunk so keep-alive pings don't count as content.
            const originalWrite = dataStreamWriter.writeData;
            dataStreamWriter.writeData = (data) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = undefined;
                }
                originalWrite(data);
            };

            const startTime = Date.now();
            const result = await streamText({
                model: google(modelId),
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

            // Capture analytics after stream is done
            if (posthog) {
                try {
                    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
                    try {
                        const usageResult = await result.usage; // Wait for usage to be available
                        usage = {
                            promptTokens: (usageResult as any).promptTokens ?? 0,
                            completionTokens: (usageResult as any).completionTokens ?? 0,
                            totalTokens: usageResult.totalTokens ?? 0
                        };
                    } catch (e) {
                        console.warn("Failed to get usage stats", e);
                    }

                    const duration = (Date.now() - startTime) / 1000;
                    const traceId = crypto.randomUUID();

                    console.log("Capturing PostHog event", { modelId, duration, tokens: usage.totalTokens, traceId });

                    const promptText = messages
                        ? messages.map((m: any) => m.content ?? '').join(' ')
                        : fullPrompt;
                    const promptHash = crypto.createHash('sha256').update(promptText).digest('hex').substring(0, 16);

                    posthog.capture({
                        distinctId: 'lambda-generator',
                        event: '$ai_generation',
                        properties: {
                            $ai_model: modelId,
                            $ai_provider: 'google',
                            $ai_input_length: promptText.length,
                            $ai_input_hash: promptHash,
                            $ai_output_length: fullText.length,
                            $ai_latency: duration,
                            $ai_input_tokens: usage.promptTokens,
                            $ai_output_tokens: usage.completionTokens,
                            $ai_total_tokens: usage.totalTokens,
                            $ai_base_url: 'https://generativelanguage.googleapis.com/v1beta',
                            $ai_trace_id: traceId,
                            animate,
                            transparent
                        }
                    });
                    // Force flush to ensure it sends before lambda freezes
                    await posthog.flush();
                } catch (phError) {
                    console.error("Failed to capture PostHog analytics", phError);
                }
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

                if (posthog) {
                    posthog.capture({
                        distinctId: 'lambda-generator',
                        event: '$ai_generation_error',
                        properties: {
                            error: 'Fallback failed',
                            details: String(fallbackError)
                        }
                    });
                    await posthog.flush();
                }
            }
        } else {
            // If it was a real error or user cancelled, we should probably output it
            console.error("Generation failed", error);
            dataStreamWriter.writeData(`Error: Generation failed. Please try again or contact support.`);

            if (posthog) {
                posthog.capture({
                    distinctId: 'lambda-generator',
                    event: '$ai_generation_error',
                    properties: {
                        error: 'Generation failed',
                        details: String(error)
                    }
                });
                await posthog.flush();
            }
        }
    } finally {
        clearInterval(keepAliveInterval);
        responseStream.end();
        if (posthog) {
            await posthog.shutdown();
        }
    }
});
