import os
import json
import time
import uuid
import threading
import queue
import logging

import google.generativeai as genai
from posthog import Posthog

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# System prompt for SVG generation
SYSTEM_PROMPT = """
You are a world-class expert in Scalable Vector Graphics (SVG) design and coding. 
Your task is to generate a high-quality, visually stunning, and detailed SVG based on the user's description of an object or item.

Guidelines:
1.  **Output Format**: Return ONLY the raw SVG code. Do not wrap it in markdown code blocks (e.g., no ```xml). Do not add any conversational text before or after.
2.  **Quality**: Use gradients, proper pathing, and distinct colors to create depth and visual appeal. Avoid simple stroked lines unless requested. The style should be "flat art" or "material design" unless specified otherwise.
3.  **Technical**: 
    - Always include a `viewBox` attribute.
    - Ensure the SVG is self-contained (no external references).
    - Use semantic IDs or classes if helpful, but inline styles are preferred for portability.
    - Default size should be square (e.g., 512x512) unless the aspect ratio suggests otherwise.
"""


def _init_posthog():
    """Initialize PostHog client if API key is available."""
    api_key = os.environ.get('POSTHOG_API_KEY')
    host = os.environ.get('POSTHOG_HOST', 'https://us.i.posthog.com')

    if api_key:
        logger.info(f"Initializing PostHog with host: {host}")
        return Posthog(api_key, host=host)
    
    logger.info("PostHog API Key not found, analytics disabled")
    return None


def _build_prompt(prompt, animate, transparent):
    """Build the full prompt with animation and transparency options."""
    full_prompt = f'Create an SVG representation of the following object/item: "{prompt}"'

    if animate:
        full_prompt += (
            "\n\nIMPORTANT: Make this SVG animated using CSS keyframes or SMIL. "
            "The animation should be subtle, continuous, and looping. "
            "Ensure the animation adds life to the object "
            "(e.g., glowing, floating, rotating parts, or color shifts)."
        )
    else:
        full_prompt += (
            "\n\nIMPORTANT: Do NOT include any animations, CSS keyframes, or SMIL. "
            "The SVG should be completely static."
        )

    if transparent:
        full_prompt += (
            "\n\nIMPORTANT: The SVG must have a TRANSPARENT background. "
            "Do NOT include any background <rect> or shapes. "
            "The background should be left empty so it can be placed on any color."
        )
    else:
        full_prompt += (
            "\n\nIMPORTANT: The SVG MUST have a background. Include a background "
            "<rect> or shape that fills the viewBox with a color appropriate for "
            "the scene or object (e.g., a sky, a solid color, or a gradient). "
            "Do not leave the background transparent."
        )

    return full_prompt


def _generate_with_timeout(model_id, full_prompt, timeout_seconds=30):
    """
    Generate content with a timeout mechanism using threading.
    
    Returns the full generated text or raises an exception on timeout/error.
    """
    result_queue = queue.Queue()
    stop_event = threading.Event()

    def _generate():
        try:
            logger.info(f"Starting generation with {model_id}")
            model = genai.GenerativeModel(
                model_name=model_id,
                system_instruction=SYSTEM_PROMPT
            )

            response = model.generate_content(
                full_prompt,
                stream=True,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.4
                )
            )

            full_text = ""
            for chunk in response:
                if stop_event.is_set():
                    break
                if chunk.text:
                    full_text += chunk.text

            result_queue.put(('success', full_text))

        except Exception as e:
            logger.error(f"Error with {model_id}: {e}")
            result_queue.put(('error', str(e)))

    gen_thread = threading.Thread(target=_generate)
    gen_thread.start()
    gen_thread.join(timeout=timeout_seconds)

    if gen_thread.is_alive():
        # Timeout reached — signal the thread to stop
        logger.warning(f"Timeout ({timeout_seconds}s) reached for {model_id}")
        stop_event.set()
        raise TimeoutError(f"Generation timed out after {timeout_seconds}s for {model_id}")

    # Thread completed — check result
    try:
        status, result = result_queue.get_nowait()
    except queue.Empty:
        raise RuntimeError(f"No result from generation thread for {model_id}")

    if status == 'error':
        raise RuntimeError(result)

    if not result:
        raise RuntimeError(f"Empty response from {model_id}")

    logger.info(f"Finished generation with {model_id}")
    return result


def handler(event, context):
    """
    AWS Lambda handler for SVG generation using Google Gemini.
    
    Accepts POST requests with JSON body containing:
    - prompt: Text description of the SVG to generate
    - messages: Alternative to prompt (uses last message content)
    - model: Gemini model to use (default: gemini-2.0-flash)
    - animate: Whether to animate the SVG
    - transparent: Whether the SVG should have a transparent background
    """
    logger.info("Request received")

    # CORS headers for Function URL
    cors_headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
    }

    # Handle CORS preflight
    http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }

    # Parse body
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse body: {e}")
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Invalid JSON body'})
        }

    messages = body.get('messages')
    body_prompt = body.get('prompt')
    model_id = body.get('model')
    animate = body.get('animate', False)
    transparent = body.get('transparent', False)

    # Extract prompt
    prompt = body_prompt
    if not prompt and messages and len(messages) > 0:
        prompt = messages[-1].get('content', '')

    if not prompt:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Prompt is required'})
        }

    # Validate API key
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': 'API Key missing'})
        }

    genai.configure(api_key=api_key)

    # Initialize analytics
    posthog = _init_posthog()

    # Build prompt
    full_prompt = _build_prompt(prompt, animate, transparent)

    # Determine model
    primary_model = model_id or 'gemini-2.0-flash'
    is_pro = 'pro' in primary_model
    timeout = 60 if is_pro else 120

    start_time = time.time()
    generated_text = None

    try:
        # Try primary model with timeout
        generated_text = _generate_with_timeout(primary_model, full_prompt, timeout_seconds=timeout)

    except (TimeoutError, RuntimeError) as e:
        logger.warning(f"Primary model failed: {e}")

        # Fallback to flash model if primary was pro
        if is_pro:
            logger.info("Switching to fallback: gemini-2.0-flash")
            try:
                generated_text = _generate_with_timeout(
                    'gemini-2.0-flash', full_prompt, timeout_seconds=120
                )
            except Exception as fallback_error:
                logger.error(f"Fallback failed: {fallback_error}")

                if posthog:
                    posthog.capture(
                        'lambda-generator',
                        '$ai_generation_error',
                        {'error': 'Fallback failed', 'details': str(fallback_error)}
                    )
                    posthog.flush()

                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'error': f'Failed to generate SVG with both models: {fallback_error}'
                    })
                }
        else:
            if posthog:
                posthog.capture(
                    'lambda-generator',
                    '$ai_generation_error',
                    {'error': 'Generation failed', 'details': str(e)}
                )
                posthog.flush()

            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps({'error': f'Generation failed: {e}'})
            }

    # Capture analytics
    duration = time.time() - start_time
    if posthog and generated_text:
        trace_id = str(uuid.uuid4())
        logger.info(f"Capturing PostHog event, duration: {duration:.2f}s, traceId: {trace_id}")

        posthog.capture(
            'lambda-generator',
            '$ai_generation',
            {
                '$ai_model': primary_model,
                '$ai_provider': 'google',
                '$ai_input': messages or [{'role': 'user', 'content': full_prompt}],
                '$ai_output_choices': [{'role': 'assistant', 'content': generated_text}],
                '$ai_latency': duration,
                '$ai_trace_id': trace_id,
                'animate': animate,
                'transparent': transparent
            }
        )

        try:
            posthog.flush()
        except Exception as ph_error:
            logger.error(f"Failed to flush PostHog: {ph_error}")

    # Return the generated SVG
    return {
        'statusCode': 200,
        'headers': {
            **cors_headers,
            'Content-Type': 'text/plain',
        },
        'body': generated_text
    }
