import os
import logging
import queue
import threading
import time
import uuid
import datetime
from typing import Iterator

import boto3
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
import google.generativeai as genai

from lambda_function import SYSTEM_PROMPT, _build_prompt, _init_posthog, _model_marker

logger = logging.getLogger(__name__)

table = None
try:
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.Table('svg-generator-usage')
except Exception as e:
    logger.error("Failed to initialize DynamoDB: %s", e)

def check_rate_limit(ip_address: str, limit: int = 4) -> bool:
    if not table:
        return True
    try:
        today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
        ip_date = f"{ip_address}#{today}"
        
        response = table.update_item(
            Key={'ip_date': ip_date},
            UpdateExpression="ADD request_count :inc",
            ExpressionAttributeValues={':inc': 1},
            ReturnValues="UPDATED_NEW"
        )
        count = response.get('Attributes', {}).get('request_count', 0)
        return count <= limit
    except Exception as e:
        logger.error("DynamoDB rate limit error: %s", e)
        # Fail open
        return True


logger = logging.getLogger(__name__)
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
PHASE_MARKER_PREFIX = "[[PHASE:"
PHASE_MARKER_SUFFIX = "]]"

TRANSIENT_ERROR_HINTS = (
    "internal error",
    "internal server error",
    "500",
    "503",
    "service unavailable",
    "temporarily unavailable",
    "backend error",
    "deadline exceeded",
    "connection reset",
    "econnreset",
)


class GenerationAttemptError(RuntimeError):
    """Raised when a model attempt fails and may include partial stream context."""

    def __init__(self, message: str, saw_chunk: bool) -> None:
        super().__init__(message)
        self.saw_chunk = saw_chunk


def _phase_marker(phase: str) -> str:
    return f"{PHASE_MARKER_PREFIX}{phase}{PHASE_MARKER_SUFFIX}"


def _is_timeout_like(exc: Exception, error_text: str) -> bool:
    return isinstance(exc, TimeoutError) or "timed out" in error_text


def _is_empty_like(error_text: str) -> bool:
    return "empty response" in error_text


def _is_internal_like(error_text: str) -> bool:
    return any(hint in error_text for hint in TRANSIENT_ERROR_HINTS)


def _stream_generate_attempt(model_id: str, full_prompt: str, first_chunk_timeout_s: int) -> Iterator[str]:
    """
    Stream model output with a first-chunk timeout and periodic keep-alives.
    Returns a generator whose StopIteration.value is the accumulated full text.
    """
    event_queue: queue.Queue[tuple[str, str | None]] = queue.Queue()
    stop_event = threading.Event()
    full_text_parts: list[str] = []
    saw_chunk = False

    def _worker() -> None:
        try:
            logger.info("Starting generation with %s", model_id)
            model = genai.GenerativeModel(
                model_name=model_id,
                system_instruction=SYSTEM_PROMPT,
            )
            response = model.generate_content(
                full_prompt,
                stream=True,
                generation_config=genai.types.GenerationConfig(temperature=0.4),
            )

            for chunk in response:
                if stop_event.is_set():
                    break
                text = getattr(chunk, "text", None)
                if text:
                    event_queue.put(("chunk", text))

            event_queue.put(("done", None))
        except Exception as exc:
            logger.exception("Error with %s", model_id)
            event_queue.put(("error", str(exc)))

    worker_thread = threading.Thread(target=_worker, daemon=True)
    worker_thread.start()
    start_time = time.time()

    try:
        while True:
            try:
                kind, payload = event_queue.get(timeout=2)
            except queue.Empty:
                if not saw_chunk and (time.time() - start_time) > first_chunk_timeout_s:
                    stop_event.set()
                    raise TimeoutError(f"Generation timed out waiting for first chunk from {model_id}")
                # Keep the streaming connection warm while the model is thinking.
                yield "keep-alive"
                continue

            if kind == "chunk":
                text = payload or ""
                if text:
                    if not saw_chunk:
                        saw_chunk = True
                        yield _phase_marker("streaming")
                    full_text_parts.append(text)
                    yield text
                continue

            if kind == "error":
                raise GenerationAttemptError(
                    payload or f"Unknown generation error for {model_id}",
                    saw_chunk=saw_chunk,
                )

            if kind == "done":
                break

        full_text = "".join(full_text_parts)
        if not full_text:
            raise RuntimeError(f"Empty response from {model_id}")

        logger.info("Finished generation with %s", model_id)
        return full_text
    finally:
        stop_event.set()


@app.get("/")
def healthcheck() -> PlainTextResponse:
    return PlainTextResponse("ok")


@app.options("/")
def options_root() -> PlainTextResponse:
    return PlainTextResponse("")


@app.post("/")
async def generate_svg(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON body"}, status_code=400)

    messages = body.get("messages")
    body_prompt = body.get("prompt")
    model_id = body.get("model")
    animate = bool(body.get("animate", False))
    transparent = bool(body.get("transparent", False))

    prompt = body_prompt
    if not prompt and messages and len(messages) > 0:
        prompt = messages[-1].get("content", "")

    if not prompt:
        return JSONResponse({"error": "Prompt is required"}, status_code=400)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return JSONResponse({"error": "API Key missing"}, status_code=500)

    genai.configure(api_key=api_key)

    posthog = _init_posthog()
    full_prompt = _build_prompt(prompt, animate, transparent)

    primary_model = model_id or "gemini-2.0-flash"
    is_pro = "pro" in primary_model
    explicit_model_requested = bool(model_id)
    
    # Enforce Server-Side Rate Limit
    if is_pro:
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
        
        if not check_rate_limit(client_ip, limit=3):
            logger.warning("Rate limit exceeded for IP %s. Forcing fallback to gemini-2.0-flash.", client_ip)
            primary_model = "gemini-2.0-flash"
            is_pro = False

    used_model = primary_model
    # Pro models (especially with animation) can take a long time before the
    # first token, even when total generation succeeds. Keep the connection
    # alive while waiting instead of failing too early.
    first_chunk_timeout_s = 240 if (is_pro and animate) else (180 if is_pro else 30)
    started_at = time.time()

    def event_stream() -> Iterator[str]:
        nonlocal used_model
        generated_text = ""
        fallback_attempted = False
        retry_attempted = False

        # Flush proxy/browser buffers early.
        yield "initialized" + (" " * 4096)
        yield _phase_marker("queued")

        def _run_attempt(model_name: str, timeout_s: int) -> str:
            yield _phase_marker("thinking")
            yield_marker = _model_marker(model_name)
            yield yield_marker
            result_text = yield from _stream_generate_attempt(model_name, full_prompt, timeout_s)
            return result_text

        try:
            generated_text = yield from _run_attempt(primary_model, first_chunk_timeout_s)
            used_model = primary_model
        except Exception as exc:
            logger.warning("Primary model failed: %s", exc)
            error_text = str(exc).lower()
            saw_partial_output = bool(getattr(exc, "saw_chunk", False))
            is_timeout_like = _is_timeout_like(exc, error_text)
            is_empty_like = _is_empty_like(error_text)
            is_internal_like = _is_internal_like(error_text)
            transient_failure = is_timeout_like or is_empty_like or is_internal_like

            # Retry once on transient provider failures when no output has been streamed yet.
            if transient_failure and not saw_partial_output:
                try:
                    retry_attempted = True
                    yield _phase_marker("retry")
                    generated_text = yield from _run_attempt(primary_model, first_chunk_timeout_s)
                    used_model = primary_model
                except Exception as retry_exc:
                    logger.warning("Primary retry failed: %s", retry_exc)
                    exc = retry_exc
                    error_text = str(exc).lower()
                    saw_partial_output = bool(getattr(exc, "saw_chunk", False))
                    is_timeout_like = _is_timeout_like(exc, error_text)
                    is_empty_like = _is_empty_like(error_text)
                    is_internal_like = _is_internal_like(error_text)
                    transient_failure = is_timeout_like or is_empty_like or is_internal_like

            should_fallback = (
                not generated_text
                and (not explicit_model_requested)
                and is_pro
                and transient_failure
                and not saw_partial_output
            )

            if should_fallback:
                try:
                    fallback_attempted = True
                    yield _phase_marker("fallback")
                    used_model = "gemini-2.0-flash"
                    generated_text = yield from _run_attempt(used_model, 20)
                except Exception as fallback_exc:
                    logger.exception("Fallback failed")
                    if posthog:
                        try:
                            posthog.capture(
                                "lambda-generator",
                                "$ai_generation_error",
                                {"error": "Fallback failed", "details": str(fallback_exc)},
                            )
                            posthog.flush()
                        except Exception:
                            logger.exception("Failed to flush PostHog for fallback error")
                    yield f"Error: Failed to generate SVG with both models. {fallback_exc}"
                    return
            else:
                if posthog:
                    try:
                        posthog.capture(
                            "lambda-generator",
                            "$ai_generation_error",
                            {
                                "error": "Generation failed",
                                "details": str(exc),
                                "requestedModel": primary_model,
                                "fallbackAttempted": fallback_attempted,
                                "retryAttempted": retry_attempted,
                                "transientFailure": transient_failure,
                            },
                        )
                        posthog.flush()
                    except Exception:
                        logger.exception("Failed to flush PostHog for generation error")
                yield (
                    "Error: Generation failed: "
                    f"{exc} (requestedModel={primary_model}, fallbackAttempted={str(fallback_attempted).lower()}, "
                    f"retryAttempted={str(retry_attempted).lower()})"
                )
                return

        # Capture analytics after successful stream
        yield _phase_marker("finalizing")
        if posthog and generated_text:
            try:
                duration = time.time() - started_at
                trace_id = str(uuid.uuid4())
                
                posthog_model = used_model
                if "gemini-3.1-pro" in used_model or "gemini-3-pro" in used_model:
                    posthog_model = "gemini-1.5-pro"
                
                posthog.capture(
                    "lambda-generator",
                    "$ai_generation",
                    {
                        "$ai_model": posthog_model,
                        "actual_model": used_model,
                        "$ai_provider": "google",
                        "$ai_input": messages or [{"role": "user", "content": full_prompt}],
                        "$ai_output_choices": [{"role": "assistant", "content": generated_text}],
                        "$ai_latency": duration,
                        "$ai_trace_id": trace_id,
                        "animate": animate,
                        "transparent": transparent,
                    },
                )
                posthog.flush()
            except Exception:
                logger.exception("Failed to capture PostHog analytics")

    return StreamingResponse(event_stream(), media_type="text/plain")
