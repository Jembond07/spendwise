from datetime import date


def _first_category_id(client):
    return client.get("/categories").json()[0]["id"]


def test_create_budget_and_dashboard_status(client):
    category_id = _first_category_id(client)
    today = date.today().isoformat()

    client.post("/expenses", json={"amount": 80, "description": "test spend", "category_id": category_id, "date": today})

    budget_resp = client.post(
        "/budgets", json={"category_id": category_id, "monthly_limit": 100, "alert_pct": 75}
    )
    assert budget_resp.status_code == 201

    dashboard = client.get("/dashboard").json()
    statuses = dashboard["budget_status"]
    assert len(statuses) == 1
    assert statuses[0]["spent"] == 80
    assert statuses[0]["pct_used"] == 80.0
    assert statuses[0]["over_alert"] is True


def test_cannot_create_duplicate_budget_for_category(client):
    category_id = _first_category_id(client)
    client.post("/budgets", json={"category_id": category_id, "monthly_limit": 100})
    dup = client.post("/budgets", json={"category_id": category_id, "monthly_limit": 200})
    assert dup.status_code == 400


def test_delete_budget(client):
    category_id = _first_category_id(client)
    created = client.post("/budgets", json={"category_id": category_id, "monthly_limit": 50}).json()
    resp = client.delete(f"/budgets/{created['id']}")
    assert resp.status_code == 204
    assert client.get("/budgets").json() == []
