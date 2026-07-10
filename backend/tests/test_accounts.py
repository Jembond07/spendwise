def test_default_accounts_seeded(client):
    accounts = client.get("/accounts").json()
    names = {a["name"] for a in accounts}
    assert {"Checking", "Credit Card", "Savings", "Investment"} <= names


def test_create_update_delete_account(client):
    created = client.post("/accounts", json={"name": "Brokerage", "type": "investment"}).json()
    assert created["type"] == "investment"

    updated = client.put(f"/accounts/{created['id']}", json={"name": "Brokerage (Fidelity)"}).json()
    assert updated["name"] == "Brokerage (Fidelity)"

    resp = client.delete(f"/accounts/{created['id']}")
    assert resp.status_code == 204
    assert not any(a["id"] == created["id"] for a in client.get("/accounts").json())


def test_expense_tagged_with_account(client):
    account_id = client.get("/accounts").json()[0]["id"]
    resp = client.post(
        "/expenses",
        json={"amount": 12, "description": "Coffee", "date": "2026-07-01", "account_id": account_id},
    )
    assert resp.status_code == 201
    assert resp.json()["account"]["id"] == account_id

    filtered = client.get("/expenses", params={"account_id": account_id}).json()
    assert len(filtered) == 1
