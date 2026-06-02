import pytest


def test_add_asset_domain(client, auth_headers):
    resp = client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "example.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "domain"
    assert data["value"] == "example.com"


def test_add_asset_email(client, auth_headers):
    resp = client.post("/api/assets", headers=auth_headers, json={"type": "email", "value": "test@example.com"})
    assert resp.status_code == 200


def test_add_asset_invalid_type(client, auth_headers):
    resp = client.post("/api/assets", headers=auth_headers, json={"type": "invalid", "value": "test"})
    assert resp.status_code == 400


def test_add_asset_duplicate(client, auth_headers):
    client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "dup.com"})
    resp = client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "dup.com"})
    assert resp.status_code == 409


def test_list_assets(client, auth_headers):
    client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "one.com"})
    resp = client.get("/api/assets", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_delete_asset(client, auth_headers):
    resp = client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "delete.com"})
    asset_id = resp.json()["id"]
    resp = client.delete(f"/api/assets/{asset_id}", headers=auth_headers)
    assert resp.status_code == 200
    resp = client.get("/api/assets", headers=auth_headers)
    assert len(resp.json()) == 0


def test_quick_check(client):
    resp = client.post("/api/check", json={"type": "domain", "value": "example.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert "breaches_found" in data
    assert "safe" in data


def test_stats(client, auth_headers):
    client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "stats.com"})
    resp = client.get("/api/stats", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total_assets"] == 1
