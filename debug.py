#!/usr/bin/env python3
import sys, os
sys.stdout = sys.stderr
print("=== DEBUG APP ===")
print(f"Python: {sys.executable}")
print(f"PORT: {os.environ.get('PORT', 'NOT SET')}")
print(f"ENV: {os.environ.get('ENVIRONMENT', 'NOT SET')}")
print(f"DB_URL: {str(os.environ.get('DATABASE_URL', 'NOT SET'))[:50]}")
sys.stdout.flush()

try:
    from config import settings
    print("Config OK")
except Exception as e:
    print(f"CONFIG ERROR: {e}")
    sys.exit(1)

try:
    from database import Base, engine
    print("Database OK")
except Exception as e:
    print(f"DATABASE ERROR: {e}")
    sys.exit(1)

try:
    import models
    Base.metadata.create_all(bind=engine)
    print("Tables OK")
except Exception as e:
    print(f"TABLES ERROR: {e}")

print("Starting uvicorn...")
sys.stdout.flush()
os.execvp("uvicorn", ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", os.environ.get("PORT", "10000")])
