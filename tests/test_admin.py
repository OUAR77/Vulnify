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


def test_admin_seed(client):
    res = client.post("/api/admin/seed")
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["role"] == "admin"


def test_admin_seed_already_exists(client):
    client.post("/api/admin/seed")
    res = client.post("/api/admin/seed")
    assert res.status_code == 400
    assert "Ya existe" in res.json()["detail"]


def test_admin_list_users(client):
    _register_hunter(client)
    _register_company(client, "C2", "c2@test.com")
    admin = client.post("/api/admin/seed").json()
    res = client.get("/api/admin/users",
                     headers={"Authorization": f"Bearer {admin['token']}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    users = data["items"]
    assert len(users) >= 3
    roles = {u["role"] for u in users}
    assert "hunter" in roles
    assert "company" in roles
    assert "admin" in roles


def test_admin_update_user_role(client):
    hunter = _register_hunter(client)
    admin = client.post("/api/admin/seed").json()
    res = client.put(f"/api/admin/users/{hunter['user']['id']}", json={"role": "company"},
                     headers={"Authorization": f"Bearer {admin['token']}"})
    assert res.status_code == 200
    me = client.get("/api/auth/me",
                    headers={"Authorization": f"Bearer {hunter['token']}"})
    assert me.json()["role"] == "company"


def test_admin_delete_user(client):
    hunter = _register_hunter(client)
    admin = client.post("/api/admin/seed").json()
    res = client.delete(f"/api/admin/users/{hunter['user']['id']}",
                        headers={"Authorization": f"Bearer {admin['token']}"})
    assert res.status_code == 200


def test_admin_cannot_delete_self(client):
    admin = client.post("/api/admin/seed").json()
    me = client.get("/api/auth/me",
                    headers={"Authorization": f"Bearer {admin['token']}"}).json()
    res = client.delete(f"/api/admin/users/{me['id']}",
                        headers={"Authorization": f"Bearer {admin['token']}"})
    assert res.status_code == 400


def test_admin_list_programs(client):
    company = _register_company(client)
    admin = client.post("/api/admin/seed").json()
    client.post("/api/programs", json={
        "company_name": "Corp", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {company['token']}"})
    res = client.get("/api/admin/programs",
                     headers={"Authorization": f"Bearer {admin['token']}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) >= 1


def test_admin_list_reports(client):
    hunter = _register_hunter(client)
    company = _register_company(client, "C2", "c2@test.com")
    admin = client.post("/api/admin/seed").json()
    prog = client.post("/api/programs", json={
        "company_name": "C2", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {company['token']}"}).json()
    client.post("/api/reports", json={
        "title": "Test Bug", "description": "Desc", "severity": "high",
        "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {hunter['token']}"})
    res = client.get("/api/admin/reports",
                     headers={"Authorization": f"Bearer {admin['token']}"})
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) >= 1
