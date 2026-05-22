def test_leaderboard_empty(client):
    res = client.get("/api/hunters/leaderboard")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


def test_leaderboard_with_hunters(client):
    client.post("/api/auth/register", json={
        "name": "H1", "email": "h1@t.com", "password": "TestPass1", "role": "hunter",
    })
    client.post("/api/auth/register", json={
        "name": "H2", "email": "h2@t.com", "password": "TestPass1", "role": "hunter",
    })
    res = client.get("/api/hunters/leaderboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 2


def test_leaderboard_pagination(client):
    res = client.get("/api/hunters/leaderboard?page=1&per_page=5")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert data["per_page"] == 5
