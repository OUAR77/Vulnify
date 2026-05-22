#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --limit-max-requests 10000 --timeout-graceful-shutdown 30
