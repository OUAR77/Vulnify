def _register_hunter(client):
    r = client.post("/api/auth/register", json={
        "name": "H", "email": "h@c.com", "password": "TestPass1", "role": "hunter",
    })
    return r.json()


def _register_company(client):
    r = client.post("/api/auth/register", json={
        "name": "C", "email": "c@c.com", "password": "TestPass1", "role": "company",
    })
    return r.json()


def test_company_list_programs(client):
    data = _register_company(client)
    res = client.get("/api/company/programs",
                     headers={"Authorization": f"Bearer {data['token']}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_company_create_and_list_programs(client):
    data = _register_company(client)
    client.post("/api/programs", json={
        "company_name": "TestCorp", "industry": "security", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {data['token']}"})
    res = client.get("/api/company/programs",
                     headers={"Authorization": f"Bearer {data['token']}"})
    assert res.status_code == 200
    assert len(res.json()) >= 1
    assert res.json()[0]["company_name"] == "TestCorp"


def test_company_reports_pagination(client):
    data = _register_company(client)
    res = client.get("/api/company/reports",
                     headers={"Authorization": f"Bearer {data['token']}"})
    assert res.status_code == 200
    assert "items" in res.json()
    assert "total" in res.json()


def test_company_reports_forbidden_for_hunter(client):
    data = _register_hunter(client)
    res = client.get("/api/company/reports",
                     headers={"Authorization": f"Bearer {data['token']}"})
    assert res.status_code == 403


def test_company_programs_forbidden_for_hunter(client):
    data = _register_hunter(client)
    res = client.get("/api/company/programs",
                     headers={"Authorization": f"Bearer {data['token']}"})
    assert res.status_code == 403
