def _register_company(client, name="Corp", email="corp@test.com"):
    res = client.post("/api/auth/register", json={
        "name": name, "email": email,
        "password": "TestPass1", "role": "company",
    })
    return res.json()["token"]


def _register_hunter(client, name="Hunter", email="hunter@test.com"):
    res = client.post("/api/auth/register", json={
        "name": name, "email": email,
        "password": "TestPass1", "role": "hunter",
    })
    return res.json()["token"]


def test_create_program(client):
    token = _register_company(client)
    res = client.post("/api/programs", json={
        "company_name": "Corp", "industry": "tech",
        "max_reward": 5000, "description": "Test",
        "scope": ["*.example.com"], "tags": ["web"],
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["company_name"] == "Corp"


def test_create_program_hunter_forbidden(client):
    token = _register_hunter(client)
    res = client.post("/api/programs", json={
        "company_name": "Hack", "industry": "tech",
        "max_reward": 1000,
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_list_programs(client):
    token = _register_company(client)
    client.post("/api/programs", json={
        "company_name": "Corp", "industry": "tech",
        "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {token}"})
    res = client.get("/api/programs")
    assert res.status_code == 200
    assert res.json()["total"] == 1


def test_get_program(client):
    token = _register_company(client)
    prog = client.post("/api/programs", json={
        "company_name": "Corp", "industry": "finance",
        "max_reward": 10000,
    }, headers={"Authorization": f"Bearer {token}"}).json()
    res = client.get(f"/api/programs/{prog['id']}")
    assert res.status_code == 200
    assert res.json()["industry"] == "finance"
