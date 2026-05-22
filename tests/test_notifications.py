def _register_hunter(client, name="Hunter", email="hunter@test.com"):
    res = client.post("/api/auth/register", json={
        "name": name, "email": email,
        "password": "TestPass1", "role": "hunter",
    })
    return res.json()


def _register_company(client, name="Corp", email="corp@test.com"):
    res = client.post("/api/auth/register", json={
        "name": name, "email": email,
        "password": "TestPass1", "role": "company",
    })
    return res.json()


def test_list_notifications(client):
    hunter = _register_hunter(client)
    res = client.get("/api/notifications",
                     headers={"Authorization": f"Bearer {hunter['token']}"})
    assert res.status_code == 200
    assert res.json() == []


def test_notification_created_on_status_change(client):
    hunter = _register_hunter(client)
    company = _register_company(client)
    prog = client.post("/api/programs", json={
        "company_name": "Corp", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {company['token']}"}).json()
    report = client.post("/api/reports", json={
        "title": "Bug", "description": "Desc", "severity": "medium",
        "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {hunter['token']}"}).json()
    client.put(f"/api/reports/{report['id']}/status", json={"status": "valid", "reward": 500},
               headers={"Authorization": f"Bearer {company['token']}"})
    notes = client.get("/api/notifications",
                       headers={"Authorization": f"Bearer {hunter['token']}"}).json()
    assert len(notes) >= 1
    assert "ha cambiado a valid" in notes[0]["message"]


def test_mark_notification_read(client):
    hunter = _register_hunter(client)
    company = _register_company(client, "C2", "c2@test.com")
    prog = client.post("/api/programs", json={
        "company_name": "C2", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {company['token']}"}).json()
    report = client.post("/api/reports", json={
        "title": "XSS", "description": "Desc", "severity": "high",
        "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {hunter['token']}"}).json()
    client.put(f"/api/reports/{report['id']}/status", json={"status": "valid", "reward": 500},
               headers={"Authorization": f"Bearer {company['token']}"})
    notes = client.get("/api/notifications",
                       headers={"Authorization": f"Bearer {hunter['token']}"}).json()
    assert len(notes) > 0
    nid = notes[0]["id"]
    res = client.put(f"/api/notifications/{nid}/read",
                     headers={"Authorization": f"Bearer {hunter['token']}"})
    assert res.status_code == 200
    notes = client.get("/api/notifications",
                       headers={"Authorization": f"Bearer {hunter['token']}"}).json()
    assert notes[0]["read"] is True
