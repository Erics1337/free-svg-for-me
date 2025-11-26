import { checkRateLimit } from '../../../lib/rate-limit';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const LAMBDA_URL = process.env.LAMBDA_FUNCTION_URL || "https://mcvufgsro4ha4raizlfmzspvvq0xqfgz.lambda-url.us-east-1.on.aws/";

export async function POST(req: Request) {
  try {
    console.log("[API] Request received - Proxying to Lambda");

    // Rate Limit Check
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const isAllowed = checkRateLimit(ip, { limit: 5, window: 60000 });

    if (!isAllowed) {
      console.warn(`[API] Rate limit exceeded for IP: ${ip}`);
      return new Response('Too Many Requests', { status: 429 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[API] Failed to parse JSON body", e);
      return new Response('Invalid JSON body', { status: 400 });
    }

    // Proxy to Lambda
    const lambdaResponse = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!lambdaResponse.ok) {
      console.error(`[API] Lambda failed with status ${lambdaResponse.status}`);
      const errorText = await lambdaResponse.text();
      return new Response(errorText || 'Lambda Error', { status: lambdaResponse.status });
    }

    // Stream the Lambda response back to the client
    return new Response(lambdaResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive',
      },
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
