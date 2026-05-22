def _register_hunter(client, name="Hunter", email="hunter@test.com"):
    res = client.post("/api/auth/register", json={
        "name": name, "email": email,
        "password": "TestPass1", "role": "hunter",
    })
    return res.json()["token"]


def _register_company(client, name="Corp", email="corp@test.com"):
    res = client.post("/api/auth/register", json={
        "name": name, "email": email,
        "password": "TestPass1", "role": "company",
    })
    return res.json()["token"]


def test_create_report(client):
    token = _register_hunter(client)
    ct = _register_company(client, "C2", "c2@test.com")
    prog = client.post("/api/programs", json={
        "company_name": "C2", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {ct}"}).json()
    res = client.post("/api/reports", json={
        "title": "XSS found", "description": "Vuln",
        "severity": "high", "steps": "Step 1...",
        "impact": "Data leak", "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["id"]


def test_duplicate_report(client):
    token = _register_hunter(client)
    ct = _register_company(client, "C3", "c3@test.com")
    prog = client.post("/api/programs", json={
        "company_name": "C3", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {ct}"}).json()
    client.post("/api/reports", json={
        "title": "SQLi", "description": "Desc",
        "severity": "critical", "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {token}"})
    res = client.post("/api/reports", json={
        "title": "SQLi", "description": "Desc",
        "severity": "critical", "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 409


def test_company_validate_report(client):
    ht = _register_hunter(client)
    ct = _register_company(client)
    prog = client.post("/api/programs", json={
        "company_name": "Corp", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {ct}"}).json()
    rep = client.post("/api/reports", json={
        "title": "Bug", "description": "Desc",
        "severity": "medium", "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {ht}"}).json()
    res = client.put(f"/api/reports/{rep['id']}/status", json={
        "status": "valid", "reward": 1000,
    }, headers={"Authorization": f"Bearer {ct}"})
    assert res.status_code == 200
    assert res.json()["status"] == "valid"
