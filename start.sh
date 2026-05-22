#!/bin/bash
set -e
echo "=== Starting app ==="
echo "PORT=$PORT"
echo "ENVIRONMENT=$ENVIRONMENT"
echo "Starting uvicorn..."
python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-10000}" --log-level debug
