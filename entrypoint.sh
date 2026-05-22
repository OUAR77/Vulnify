#!/bin/sh
set -e

echo "Creating database tables..."
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine); print('Tables created')"

echo "Starting uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --limit-max-requests 10000 --timeout-graceful-shutdown 30
