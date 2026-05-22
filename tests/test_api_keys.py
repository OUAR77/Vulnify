def _register_hunter(client, name="Hunter", email="hunter@test.com"):
    res = client.post("/api/auth/register", json={
        "name": name, "email": email,
        "password": "TestPass1", "role": "hunter",
    })
    return res.json()["token"]


def test_create_api_key(client):
    token = _register_hunter(client)
    res = client.post("/api/auth/api-keys", json={"name": "MyKey"},
                      headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["key"].startswith("vul_")
    assert data["name"] == "MyKey"


def test_list_api_keys(client):
    token = _register_hunter(client)
    client.post("/api/auth/api-keys", json={"name": "Key1"},
                headers={"Authorization": f"Bearer {token}"})
    client.post("/api/auth/api-keys", json={"name": "Key2"},
                headers={"Authorization": f"Bearer {token}"})
    res = client.get("/api/auth/api-keys",
                     headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    keys = res.json()
    assert len(keys) == 2
    names = [k["name"] for k in keys]
    assert "Key1" in names
    assert "Key2" in names


def test_delete_api_key(client):
    token = _register_hunter(client)
    created = client.post("/api/auth/api-keys", json={"name": "ToDelete"},
                          headers={"Authorization": f"Bearer {token}"}).json()
    res = client.delete(f"/api/auth/api-keys/{created['id']}",
                        headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    res = client.get("/api/auth/api-keys",
                     headers={"Authorization": f"Bearer {token}"})
    assert len(res.json()) == 0


def test_delete_api_key_not_found(client):
    token = _register_hunter(client)
    res = client.delete("/api/auth/api-keys/99999",
                        headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404


def test_api_key_can_auth(client):
    token = _register_hunter(client)
    created = client.post("/api/auth/api-keys", json={"name": "AuthTest"},
                          headers={"Authorization": f"Bearer {token}"}).json()
    api_key = created["key"]
    res = client.get("/api/auth/me", headers={"X-API-Key": api_key})
    assert res.status_code == 200
    assert res.json()["email"] == "hunter@test.com"


def test_api_key_invalid(client):
    res = client.get("/api/auth/me", headers={"X-API-Key": "vul_invalid_key"})
    assert res.status_code == 401
