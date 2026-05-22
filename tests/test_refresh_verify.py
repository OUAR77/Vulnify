def _register_hunter(client):
    r = client.post("/api/auth/register", json={
        "name": "H", "email": "h@test.com", "password": "TestPass1", "role": "hunter",
    })
    return r.json()


def test_refresh_token(client):
    data = _register_hunter(client)
    assert "refresh_token" in data
    res = client.post("/api/auth/refresh", json={"refresh_token": data["refresh_token"]})
    assert res.status_code == 200
    assert "token" in res.json()


def test_refresh_token_invalid(client):
    res = client.post("/api/auth/refresh", json={"refresh_token": "bad-token"})
    assert res.status_code == 401


def test_send_verification(client):
    data = _register_hunter(client)
    res = client.post("/api/auth/send-verification",
                      headers={"Authorization": f"Bearer {data['token']}"})
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_verify_email_invalid_token(client):
    res = client.post("/api/auth/verify-email", json={"token": "bad-token"})
    assert res.status_code == 400
