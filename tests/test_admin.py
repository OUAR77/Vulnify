import pytest


def test_admin_list_users(client, auth_headers):
    resp = client.get("/api/admin/users", headers=auth_headers)
    assert resp.status_code == 403  # no admin role


def test_admin_list_users_as_admin(client, admin_headers):
    resp = client.get("/api/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_admin_stats(client, admin_headers):
    resp = client.get("/api/admin/stats", headers=admin_headers)
    assert resp.status_code == 200
    assert "total_users" in resp.json()


def test_admin_activity_logs(client, admin_headers):
    resp = client.get("/api/admin/activity-logs", headers=admin_headers)
    assert resp.status_code == 200


def test_admin_search_users(client, admin_headers):
    client.post("/api/auth/register", json={"name": "Searchable User", "email": "searchable@test.com", "password": "TestPass123"})
    resp = client.get("/api/admin/users?search=Searchable", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
