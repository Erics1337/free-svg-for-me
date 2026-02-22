#!/bin/sh
set -e

PORT="${PORT:-8080}"

exec python3 -m uvicorn streaming_app:app --host 0.0.0.0 --port "${PORT}"
