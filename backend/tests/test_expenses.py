def _first_category_id(client):
    return client.get("/categories").json()[0]["id"]


def test_create_and_list_expense(client):
    category_id = _first_category_id(client)
    resp = client.post(
        "/expenses",
        json={
            "amount": 42.50,
            "description": "Trader Joe's run",
            "category_id": category_id,
            "date": "2026-07-01",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["amount"] == 42.50
    assert body["category"]["id"] == category_id

    listed = client.get("/expenses").json()
    assert len(listed) == 1
    assert listed[0]["description"] == "Trader Joe's run"


def test_update_and_delete_expense(client):
    created = client.post(
        "/expenses",
        json={"amount": 10, "description": "Coffee", "date": "2026-07-02"},
    ).json()

    updated = client.put(f"/expenses/{created['id']}", json={"amount": 15}).json()
    assert updated["amount"] == 15

    delete_resp = client.delete(f"/expenses/{created['id']}")
    assert delete_resp.status_code == 204
    assert client.get(f"/expenses/{created['id']}").status_code == 404


def test_filter_expenses_by_search(client):
    client.post("/expenses", json={"amount": 5, "description": "Netflix sub", "date": "2026-07-01"})
    client.post("/expenses", json={"amount": 20, "description": "Groceries", "date": "2026-07-01"})

    results = client.get("/expenses", params={"search": "netflix"}).json()
    assert len(results) == 1
    assert results[0]["description"] == "Netflix sub"


def test_categorize_keyword_fallback(client, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    resp = client.post("/categorize", json={"description": "Uber ride downtown"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["method"] == "keyword"
    assert body["category_name"] == "Transportation"
