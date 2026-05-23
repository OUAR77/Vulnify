import os

os.environ["ADMIN_SEED_SECRET"] = "test-seed-secret-123"
os.environ["DISABLE_RATE_LIMITS"] = "true"
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///./tests/test_vulnify.db"

import pytest
from fastapi.testclient import TestClient
from database import Base, engine, get_db, SessionLocal
from main import app
from config import limiter


@pytest.fixture(scope="function", autouse=True)
def _reset_db():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture()
def client():
    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    original_check = limiter._check_request_limit

    def _mock_check_request_limit(request, func, in_middleware):
        request.state._rate_limiting_complete = True
        request.state.view_rate_limit = "999999/hour"

    limiter._check_request_limit = _mock_check_request_limit

    with TestClient(app) as c:
        yield c

    limiter._check_request_limit = original_check
    app.dependency_overrides.clear()
