import pytest


def test_register_hunter(client):
    res = client.post("/api/auth/register", json={
        "name": "Hunter1", "email": "hunter@test.com",
        "password": "TestPass1", "role": "hunter",
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["role"] == "hunter"


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "name": "H1", "email": "dup@test.com",
        "password": "TestPass1", "role": "hunter",
    })
    res = client.post("/api/auth/register", json={
        "name": "H2", "email": "dup@test.com",
        "password": "TestPass1", "role": "hunter",
    })
    assert res.status_code == 400
    assert "ya registrado" in res.json()["detail"]


def test_register_weak_password(client):
    res = client.post("/api/auth/register", json={
        "name": "H1", "email": "h@t.com",
        "password": "123", "role": "hunter",
    })
    assert res.status_code == 422


def test_login(client):
    client.post("/api/auth/register", json={
        "name": "Hunter1", "email": "hunter@test.com",
        "password": "TestPass1", "role": "hunter",
    })
    res = client.post("/api/auth/login", json={
        "email": "hunter@test.com", "password": "TestPass1",
    })
    assert res.status_code == 200
    assert "token" in res.json()


def test_login_wrong_password(client):
    res = client.post("/api/auth/login", json={
        "email": "nonexist@test.com", "password": "bad",
    })
    assert res.status_code == 401


def test_me(client):
    reg = client.post("/api/auth/register", json={
        "name": "Me", "email": "me@test.com",
        "password": "TestPass1", "role": "hunter",
    })
    token = reg.json()["token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@test.com"


def test_register_company(client):
    res = client.post("/api/auth/register", json={
        "name": "Corp", "email": "corp@test.com",
        "password": "TestPass1", "role": "company",
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "company"


def test_register_admin_forbidden(client):
    res = client.post("/api/auth/register", json={
        "name": "Admin", "email": "admin@test.com",
        "password": "TestPass1", "role": "admin",
    })
    assert res.status_code == 403
