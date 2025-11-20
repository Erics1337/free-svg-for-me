import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function GET() {
    try {
        const { object } = await generateObject({
            model: google('gemini-2.0-flash'),
            schema: z.object({
                suggestions: z.array(z.string()).length(4),
            }),
            prompt: 'Generate 4 creative, distinct, and visually interesting short descriptions for SVG vector art. They should be diverse (e.g., one icon, one scene, one object, one abstract). Keep them under 10 words each. Examples: "Neon Cyberpunk Helmet", "Isometric Cozy Cottage", "Geometric Origami Bird", "Retro Film Camera".',
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
