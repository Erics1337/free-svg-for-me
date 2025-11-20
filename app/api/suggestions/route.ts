import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

import { checkRateLimit } from '../../../lib/rate-limit';

export async function GET(req: Request) {
    // Rate Limit Check
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const isAllowed = checkRateLimit(ip, { limit: 5, window: 60000 }); // 5 requests per minute

    if (!isAllowed) {
        return new NextResponse('Too Many Requests', { status: 429 });
    }

    try {
        const { object } = await generateObject({
            model: google('gemini-2.0-flash'),
            temperature: 1.0,
            schema: z.object({
                suggestions: z.array(z.string()).length(4),
            }),
            prompt: `Generate 4 creative, distinct, and visually interesting short descriptions for SVG vector art. They should be diverse (e.g., one icon, one scene, one object, one abstract). Keep them under 10 words each. Examples: "Neon Cyberpunk Helmet", "Isometric Cozy Cottage", "Geometric Origami Bird", "Retro Film Camera". Random seed: ${Date.now()}`,
        });

        return NextResponse.json(object.suggestions);
    } catch (error) {
        console.error("Failed to generate suggestions:", error);
        // Fallback suggestions in case of error
        return NextResponse.json([
            'Retro Camera',
            'Space Rocket',
            'Origami Bird',
            'Isometric House'
        ]);
    }
}
