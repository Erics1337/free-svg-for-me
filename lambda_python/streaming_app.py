import os
import logging
import queue
import threading
import time
import uuid
from typing import Iterator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
import google.generativeai as genai

from lambda_function import SYSTEM_PROMPT, _build_prompt, _init_posthog, _model_marker


logger = logging.getLogger(__name__)
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


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
                    saw_chunk = True
                    full_text_parts.append(text)
                    yield text
                continue

            if kind == "error":
                raise RuntimeError(payload or f"Unknown generation error for {model_id}")

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
    used_model = primary_model
    is_pro = "pro" in primary_model
    explicit_model_requested = bool(model_id)
    first_chunk_timeout_s = 90 if (is_pro and animate) else (60 if is_pro else 20)
    started_at = time.time()

    def event_stream() -> Iterator[str]:
        nonlocal used_model
        generated_text = ""

        # Flush proxy/browser buffers early.
        yield "initialized" + (" " * 4096)

        def _run_attempt(model_name: str, timeout_s: int) -> str:
            yield_marker = _model_marker(model_name)
            yield yield_marker
            result_text = yield from _stream_generate_attempt(model_name, full_prompt, timeout_s)
            return result_text

        try:
            generated_text = yield from _run_attempt(primary_model, first_chunk_timeout_s)
            used_model = primary_model
        except Exception as exc:
            logger.warning("Primary model failed: %s", exc)
            error_text = str(exc)
            is_timeout_like = isinstance(exc, TimeoutError) or "timed out" in error_text.lower()
            is_empty_like = "empty response" in error_text.lower()
            should_fallback = (not explicit_model_requested) and is_pro and (is_timeout_like or is_empty_like)

            if should_fallback:
                try:
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
                                "fallbackAttempted": False,
                            },
                        )
                        posthog.flush()
                    except Exception:
                        logger.exception("Failed to flush PostHog for generation error")
                yield (
                    "Error: Generation failed: "
                    f"{exc} (requestedModel={primary_model}, fallbackAttempted=false)"
                )
                return

        # Capture analytics after successful stream
        if posthog and generated_text:
            try:
                duration = time.time() - started_at
                trace_id = str(uuid.uuid4())
                posthog.capture(
                    "lambda-generator",
                    "$ai_generation",
                    {
                        "$ai_model": used_model,
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
