def _register_hunter(client):
    res = client.post("/api/auth/register", json={
        "name": "Hunter", "email": "hunter@test.com",
        "password": "TestPass1", "role": "hunter",
    })
    return res.json()


def test_profile_update(client):
    hunter = _register_hunter(client)
    res = client.put("/api/auth/profile", json={"bio": "Security researcher"},
                     headers={"Authorization": f"Bearer {hunter['token']}"})
    assert res.status_code == 200
    me = client.get("/api/auth/me",
                    headers={"Authorization": f"Bearer {hunter['token']}"}).json()
    assert me["bio"] == "Security researcher"


def test_forgot_password(client):
    _register_hunter(client)
    res = client.post("/api/auth/forgot-password", json={"email": "hunter@test.com"})
    assert res.status_code == 200
    assert "reset_token" in res.json()


def test_forgot_password_nonexistent(client):
    res = client.post("/api/auth/forgot-password", json={"email": "no@existe.com"})
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_reset_password(client):
    hunter = _register_hunter(client)
    fp = client.post("/api/auth/forgot-password", json={"email": "hunter@test.com"}).json()
    token = fp["reset_token"]
    res = client.post("/api/auth/reset-password", json={"token": token, "password": "NewPass123"})
    assert res.status_code == 200
    login = client.post("/api/auth/login", json={"email": "hunter@test.com", "password": "NewPass123"})
    assert login.status_code == 200
    assert "token" in login.json()


def test_reset_password_invalid_token(client):
    res = client.post("/api/auth/reset-password", json={"token": "bad-token", "password": "NewPass123"})
    assert res.status_code == 400
