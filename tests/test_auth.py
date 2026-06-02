import pytest


def test_register(client):
    resp = client.post("/api/auth/register", json={"name": "New User", "email": "new@test.com", "password": "StrongPass1"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == "new@test.com"


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={"name": "User", "email": "dup@test.com", "password": "StrongPass1"})
    resp = client.post("/api/auth/register", json={"name": "User 2", "email": "dup@test.com", "password": "StrongPass2"})
    assert resp.status_code == 400
    assert "registrado" in resp.json()["detail"]


def test_register_weak_password(client):
    resp = client.post("/api/auth/register", json={"name": "User", "email": "weak@test.com", "password": "short"})
    assert resp.status_code == 422


def test_login(client):
    client.post("/api/auth/register", json={"name": "Test", "email": "login@test.com", "password": "LoginPass1"})
    resp = client.post("/api/auth/login", json={"email": "login@test.com", "password": "LoginPass1"})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_invalid(client):
    resp = client.post("/api/auth/login", json={"email": "no@exists.com", "password": "Whatever1"})
    assert resp.status_code == 401


def test_me(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_update_profile(client, auth_headers):
    resp = client.put("/api/auth/profile", headers=auth_headers, json={"name": "Updated Name", "company": "TestCorp"})
    assert resp.status_code == 200
    resp2 = client.get("/api/auth/me", headers=auth_headers)
    assert resp2.json()["name"] == "Updated Name"


def test_change_password(client, auth_headers):
    resp = client.put("/api/auth/password", headers=auth_headers, json={"current_password": "TestPass123", "new_password": "NewPass456"})
    assert resp.status_code == 200


def test_notification_prefs(client, auth_headers):
    resp = client.get("/api/auth/notifications", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["notify_critical"] == True

    resp = client.put("/api/auth/notifications", headers=auth_headers, json={"notify_low": True, "dark_mode": True})
    assert resp.status_code == 200

    resp = client.get("/api/auth/notifications", headers=auth_headers)
    assert resp.json()["notify_low"] == True
    assert resp.json()["dark_mode"] == True


def test_api_keys_crud(client, auth_headers):
    resp = client.post("/api/auth/api-keys", headers=auth_headers, json={"name": "Test Key"})
    assert resp.status_code == 200
    key_data = resp.json()
    assert key_data["key"].startswith("vul_")

    resp = client.get("/api/auth/api-keys", headers=auth_headers)
    assert resp.status_code == 200
    keys = resp.json()
    assert len(keys) == 1

    resp = client.delete(f"/api/auth/api-keys/{keys[0]['id']}", headers=auth_headers)
    assert resp.status_code == 200
