import io


def test_import_csv_basic(client):
    csv_content = (
        "Date,Description,Amount\n"
        "2026-07-01,Whole Foods,-54.20\n"
        "2026-07-02,Paycheck,1500.00\n"
    )
    file = io.BytesIO(csv_content.encode("utf-8"))

    resp = client.post(
        "/import/csv",
        files={"file": ("statement.csv", file, "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["imported"] == 2
    assert body["duplicates"] == 0
    assert body["skipped"] == 0

    expenses = client.get("/expenses").json()
    assert len(expenses) == 2
    assert all(e["source"] == "csv" for e in expenses)


def test_import_csv_missing_columns_errors(client):
    csv_content = "Foo,Bar\n1,2\n"
    file = io.BytesIO(csv_content.encode("utf-8"))

    resp = client.post(
        "/import/csv",
        files={"file": ("bad.csv", file, "text/csv")},
    )
    assert resp.status_code == 400


def _first_account_id(client):
    return client.get("/accounts").json()[0]["id"]


def test_import_csv_tags_account(client):
    account_id = _first_account_id(client)
    csv_content = "Date,Description,Amount\n2026-07-01,Whole Foods,-54.20\n"
    file = io.BytesIO(csv_content.encode("utf-8"))

    resp = client.post(
        "/import/csv",
        params={"account_id": account_id},
        files={"file": ("statement.csv", file, "text/csv")},
    )
    assert resp.status_code == 200

    expenses = client.get("/expenses").json()
    assert expenses[0]["account"]["id"] == account_id


def test_import_csv_skips_duplicates_on_reimport(client):
    account_id = _first_account_id(client)
    csv_content = "Date,Description,Amount\n2026-07-01,Whole Foods,-54.20\n2026-07-02,Paycheck,1500.00\n"

    first = client.post(
        "/import/csv",
        params={"account_id": account_id},
        files={"file": ("statement.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    ).json()
    assert first["imported"] == 2
    assert first["duplicates"] == 0

    second = client.post(
        "/import/csv",
        params={"account_id": account_id},
        files={"file": ("statement.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    ).json()
    assert second["imported"] == 0
    assert second["duplicates"] == 2

    assert len(client.get("/expenses").json()) == 2


def test_import_csv_same_transaction_different_account_not_duplicate(client):
    accounts = client.get("/accounts").json()
    account_a, account_b = accounts[0]["id"], accounts[1]["id"]
    csv_content = "Date,Description,Amount\n2026-07-01,Whole Foods,-54.20\n"

    client.post(
        "/import/csv",
        params={"account_id": account_a},
        files={"file": ("a.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    second = client.post(
        "/import/csv",
        params={"account_id": account_b},
        files={"file": ("b.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    ).json()

    assert second["imported"] == 1
    assert second["duplicates"] == 0
    assert len(client.get("/expenses").json()) == 2
