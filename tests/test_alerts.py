import pytest


def test_list_alerts_empty(client, auth_headers):
    resp = client.get("/api/alerts", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0


def test_list_alerts_with_filter(client, auth_headers):
    # Add an asset and check it to trigger an alert
    client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "linkedin.com"})
    assets = client.get("/api/assets", headers=auth_headers).json()
    if assets:
        asset_id = assets[0]["id"]
        client.post(f"/api/assets/{asset_id}/check", headers=auth_headers)

    resp = client.get("/api/alerts?severity=high", headers=auth_headers)
    assert resp.status_code == 200


def test_mark_alert_read(client, auth_headers):
    # Trigger an alert
    client.post("/api/assets", headers=auth_headers, json={"type": "domain", "value": "facebook.com"})
    assets = client.get("/api/assets", headers=auth_headers).json()
    if assets:
        client.post(f"/api/assets/{assets[0]['id']}/check", headers=auth_headers)
        alerts = client.get("/api/alerts", headers=auth_headers).json()
        if alerts["items"]:
            alert_id = alerts["items"][0]["id"]
            resp = client.put(f"/api/alerts/{alert_id}/read", headers=auth_headers)
            assert resp.status_code == 200


def test_mark_all_read(client, auth_headers):
    resp = client.put("/api/alerts/read-all", headers=auth_headers)
    assert resp.status_code == 200
