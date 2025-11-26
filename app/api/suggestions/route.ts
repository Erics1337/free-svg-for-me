import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

import { checkRateLimit } from '../../../lib/rate-limit';

export async function POST(req: Request) {
    // Rate Limit Check
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const isAllowed = checkRateLimit(ip, { limit: 5, window: 60000 }); // 5 requests per minute

    if (!isAllowed) {
        return new NextResponse('Too Many Requests', { status: 429 });
    }

    const prompt = `Generate 4 creative, distinct, and visually interesting short descriptions for SVG vector art. They should be diverse (e.g., one icon, one scene, one object, one abstract). Keep them under 10 words each. Do not end with a period. Examples: "Neon Cyberpunk Helmet", "Isometric Cozy Cottage", "Geometric Origami Bird", "Retro Film Camera". Random seed: ${Date.now()}`;

    try {
        const result = await streamObject({
            model: google('gemini-2.0-flash'),
            temperature: 1.0,
            schema: z.object({
                suggestions: z.array(z.string()).length(4),
            }),
            prompt,
            onFinish: async ({ object, usage }) => {
                const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
                const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

                if (apiKey) {
                    try {
                        await fetch(`${host}/capture/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                api_key: apiKey,
                                event: '$ai_generation',
                                properties: {
                                    distinct_id: 'server-suggestions',
                                    $ai_model: 'gemini-2.0-flash',
                                    $ai_provider: 'google',
                                    $ai_input: [{ role: 'user', content: prompt }],
                                    $ai_output_choices: [{ role: 'assistant', content: JSON.stringify(object) }],
                                    $ai_input_tokens: usage?.promptTokens || 0,
                                    $ai_output_tokens: usage?.completionTokens || 0,
                                    $ai_total_tokens: usage?.totalTokens || 0,
                                    $ai_base_url: 'https://generativelanguage.googleapis.com/v1beta',
                                }
                            })
                        });
                    } catch (e) {
                        console.error("Failed to track PostHog event", e);
                    }
                }
            }
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Failed to generate suggestions:", error);
        // Fallback suggestions in case of error
        return NextResponse.json({
            suggestions: [
                'Retro Camera',
                'Space Rocket',
                'Origami Bird',
                'Isometric House'
            ]
        });
    }
}
