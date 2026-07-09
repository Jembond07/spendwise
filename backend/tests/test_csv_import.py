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
