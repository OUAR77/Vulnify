import pytest


def test_search_assets(client, auth_headers):
    client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "searchtest.com"})
    resp = client.get("/api/search?q=searchtest", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_assets"] >= 1
    assert data["assets"][0]["value"] == "searchtest.com"


def test_search_no_results(client, auth_headers):
    resp = client.get("/api/search?q=xxxxxnonexistentxxxxx", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total_assets"] == 0
    assert resp.json()["total_alerts"] == 0


def test_search_empty_query(client, auth_headers):
    resp = client.get("/api/search?q=", headers=auth_headers)
    assert resp.status_code == 422
