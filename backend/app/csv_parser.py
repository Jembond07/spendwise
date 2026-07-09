"""Bank CSV import.

Most bank exports differ slightly in column naming, so this does a
case-insensitive match against a handful of known aliases rather than
assuming an exact header. It supports either a single signed "amount"
column, or separate "debit"/"credit" columns (common in bank exports).
"""

import csv
import io
from datetime import datetime

DATE_ALIASES = {"date", "transaction date", "posted date"}
DESC_ALIASES = {"description", "desc", "memo", "payee", "narrative"}
AMOUNT_ALIASES = {"amount", "value"}
DEBIT_ALIASES = {"debit", "withdrawal"}
CREDIT_ALIASES = {"credit", "deposit"}

DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%d-%m-%Y"]


class CsvParseError(Exception):
    pass


def _find_column(headers: list[str], aliases: set[str]) -> str | None:
    for header in headers:
        if header.strip().lower() in aliases:
            return header
    return None


def _parse_date(value: str):
    value = value.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: {value!r}")


def _parse_amount(value: str) -> float:
    cleaned = value.strip().replace("$", "").replace(",", "")
    if cleaned.startswith("(") and cleaned.endswith(")"):
        cleaned = "-" + cleaned[1:-1]
    return float(cleaned)


class ParsedRow:
    def __init__(self, amount: float, description: str, date):
        self.amount = amount
        self.description = description
        self.date = date


def parse_csv(file_bytes: bytes) -> tuple[list[ParsedRow], list[str]]:
    """Returns (rows, errors). Raises CsvParseError if required columns are missing."""
    text = file_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise CsvParseError("CSV file has no header row.")

    headers = list(reader.fieldnames)
    date_col = _find_column(headers, DATE_ALIASES)
    desc_col = _find_column(headers, DESC_ALIASES)
    amount_col = _find_column(headers, AMOUNT_ALIASES)
    debit_col = _find_column(headers, DEBIT_ALIASES)
    credit_col = _find_column(headers, CREDIT_ALIASES)

    if not date_col or not desc_col:
        raise CsvParseError(
            f"Could not find date/description columns. Found headers: {headers}"
        )
    if not amount_col and not (debit_col or credit_col):
        raise CsvParseError(
            f"Could not find an amount, debit, or credit column. Found headers: {headers}"
        )

    rows: list[ParsedRow] = []
    errors: list[str] = []

    for i, row in enumerate(reader, start=2):  # start=2 accounts for header row
        try:
            parsed_date = _parse_date(row[date_col])
            description = row[desc_col].strip()

            if amount_col:
                amount = _parse_amount(row[amount_col])
            else:
                debit = _parse_amount(row[debit_col]) if row.get(debit_col) else 0.0
                credit = _parse_amount(row[credit_col]) if row.get(credit_col) else 0.0
                amount = credit - debit if credit else -debit

            if not description:
                errors.append(f"Row {i}: empty description, skipped")
                continue

            rows.append(ParsedRow(amount=amount, description=description, date=parsed_date))
        except Exception as exc:
            errors.append(f"Row {i}: {exc}")

    return rows, errors
