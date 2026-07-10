import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  ensure models are registered on Base
from app.database import Base, get_db
from app.main import DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, app
from app.models import Account, Category

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    db = TestSessionLocal()
    try:
        for cat in DEFAULT_CATEGORIES:
            db.add(Category(**cat))
        for acct in DEFAULT_ACCOUNTS:
            db.add(Account(**acct))
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    # No `with` block: skips the app's startup event, which would otherwise
    # touch the real sqlite file instead of this test's in-memory engine.
    return TestClient(app)
