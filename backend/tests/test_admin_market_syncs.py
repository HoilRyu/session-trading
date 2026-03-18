from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.services.market_catalog_sync import QueuedMarketSyncRun, get_market_catalog_sync_service


class FakeMarketCatalogSyncService:
    def __init__(self) -> None:
        self.run_id = uuid4()
        self.background_called_with = []
        self.run_detail = SimpleNamespace(
            id=self.run_id,
            status="running",
            requested_at=datetime.now(UTC),
            started_at=datetime.now(UTC),
            finished_at=None,
            total_exchanges=1,
            completed_exchanges=0,
            failed_exchanges=0,
            items=[
                SimpleNamespace(
                    exchange=SimpleNamespace(code="upbit"),
                    status="running",
                    inserted_count=0,
                    updated_count=0,
                    deactivated_count=0,
                    error_message=None,
                )
            ],
        )

    async def enqueue_market_sync(self) -> QueuedMarketSyncRun:
        return QueuedMarketSyncRun(
            run_id=self.run_id,
            status="queued",
            queued_exchange_count=1,
        )

    async def run_market_sync(self, run_id) -> None:
        self.background_called_with.append(run_id)

    async def get_run_detail(self, run_id):
        if run_id == self.run_id:
            return self.run_detail
        return None


def test_post_admin_market_syncs_returns_202_and_runs_background_task() -> None:
    fake_service = FakeMarketCatalogSyncService()
    app.dependency_overrides[get_market_catalog_sync_service] = lambda: fake_service

    client = TestClient(app)
    response = client.post("/admin/market-syncs")

    app.dependency_overrides.clear()

    assert response.status_code == 202
    assert response.json() == {
        "run_id": str(fake_service.run_id),
        "status": "queued",
        "queued_exchange_count": 1,
    }
    assert fake_service.background_called_with == [fake_service.run_id]


def test_get_admin_market_syncs_returns_run_detail() -> None:
    fake_service = FakeMarketCatalogSyncService()
    app.dependency_overrides[get_market_catalog_sync_service] = lambda: fake_service

    client = TestClient(app)
    response = client.get(f"/admin/market-syncs/{fake_service.run_id}")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "running"
    assert response.json()["items"][0]["exchange_code"] == "upbit"


def test_get_admin_market_syncs_returns_404_for_missing_run() -> None:
    fake_service = FakeMarketCatalogSyncService()
    app.dependency_overrides[get_market_catalog_sync_service] = lambda: fake_service

    client = TestClient(app)
    response = client.get(f"/admin/market-syncs/{uuid4()}")

    app.dependency_overrides.clear()

    assert response.status_code == 404
