def _register_hunter(client):
    r = client.post("/api/auth/register", json={
        "name": "H", "email": "h@t.com", "password": "TestPass1", "role": "hunter",
    })
    return r.json()


def _register_company(client):
    r = client.post("/api/auth/register", json={
        "name": "C", "email": "c@t.com", "password": "TestPass1", "role": "company",
    })
    return r.json()


def test_stats(client):
    hunter = _register_hunter(client)
    company = _register_company(client)
    prog = client.post("/api/programs", json={
        "company_name": "C", "industry": "tech", "max_reward": 5000,
    }, headers={"Authorization": f"Bearer {company['token']}"}).json()
    client.post("/api/reports", json={
        "title": "Bug", "description": "D", "severity": "critical",
        "program_id": prog["id"],
    }, headers={"Authorization": f"Bearer {hunter['token']}"})
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_programs"] >= 1
    assert data["total_reports"] >= 1
    assert data["total_hunters"] >= 1
    assert data["total_companies"] >= 1
    assert "critical" in data["severity_counts"]
    assert len(data["top_programs"]) >= 1


def test_csv_export(client):
    company = _register_company(client)
    res = client.get("/api/reports/export/csv",
                     headers={"Authorization": f"Bearer {company['token']}"})
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "reportes.csv" in res.headers["content-disposition"]


def test_csv_export_forbidden_for_hunter(client):
    hunter = _register_hunter(client)
    res = client.get("/api/reports/export/csv",
                     headers={"Authorization": f"Bearer {hunter['token']}"})
    assert res.status_code == 403
