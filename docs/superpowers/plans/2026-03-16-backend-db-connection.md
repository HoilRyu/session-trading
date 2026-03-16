# Backend DB Connection Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `backend`에 PostgreSQL 연결 설정, 앱 시작 시 DB ping 확인, `/health`의 DB 상태 응답을 추가한다.

**Architecture:** `app/core/config.py`가 DB 환경변수와 `database_url` 조합을 담당하고, `app/db/session.py`가 `SQLAlchemy` async engine과 ping 함수를 담당한다. `app/main.py`는 앱 startup에서 DB 연결을 확인하고, `app/api/routes/health.py`는 현재 DB 상태를 응답에 반영한다. 테스트는 실제 로컬 DB에 종속되지 않도록 ping 함수와 설정을 대체하는 방식으로 검증한다.

**Tech Stack:** Python 3.12+, FastAPI, SQLAlchemy, asyncpg, Pydantic Settings, Pytest, HTTPX

---

## 파일 구조

- Modify: `backend/pyproject.toml`
- Modify: `backend/.env.example`
- Modify: `backend/README.md`
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/api/routes/health.py`
- Create: `backend/app/db/__init__.py`
- Create: `backend/app/db/session.py`
- Modify: `backend/tests/test_health.py`
- Create: `backend/tests/test_config.py`

## 참고 스펙

- [backend db connection spec](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/docs/superpowers/specs/2026-03-16-backend-db-connection-design.md)

## Chunk 1: 의존성과 설정 구조 준비

### Task 1: DB 의존성과 환경변수 예시 추가

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/.env.example`
- Create: `backend/app/db/__init__.py`

- [ ] **Step 1: `backend/pyproject.toml`에 DB 의존성 추가**

`dependencies`에 아래를 추가한다.

```toml
"asyncpg>=0.30.0,<1.0.0",
"sqlalchemy>=2.0.36,<3.0.0",
```

- [ ] **Step 2: `backend/.env.example`에 DB 예시 값 추가**

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=session_trading
DB_USER=session_trading
DB_PASSWORD=session_trading
```

- [ ] **Step 3: `backend/app/db/__init__.py` 생성**

빈 파일로 둔다.

- [ ] **Step 4: 의존성 설치**

Run:
```bash
cd backend && .venv/bin/python -m pip install -e ".[dev]"
```

Expected:
- `sqlalchemy`
- `asyncpg`
가 설치된다.

- [ ] **Step 5: 설치 확인**

Run:
```bash
cd backend && .venv/bin/python -m pip show sqlalchemy asyncpg
```

Expected:
- 두 패키지의 버전과 설치 경로가 출력된다.

- [ ] **Step 6: 커밋**

```bash
git add backend/pyproject.toml backend/.env.example backend/app/db/__init__.py
git commit -m "chore: add backend database dependencies"
```

## Chunk 2: 설정과 헬스체크를 TDD로 확장

### Task 2: 설정 클래스의 DB URL 조합 테스트 먼저 작성

**Files:**
- Create: `backend/tests/test_config.py`

- [ ] **Step 1: 실패할 테스트 작성**

```python
from app.core.config import Settings


def test_settings_build_database_url() -> None:
    settings = Settings(
        db_host="127.0.0.1",
        db_port=5432,
        db_name="session_trading",
        db_user="session_trading",
        db_password="session_trading",
    )

    assert (
        settings.database_url
        == "postgresql+asyncpg://session_trading:session_trading@127.0.0.1:5432/session_trading"
    )
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run:
```bash
cd backend && .venv/bin/python -m pytest tests/test_config.py -v
```

Expected:
- `AttributeError`
- 또는 `ValidationError`
가 발생하며 실패한다. 아직 DB 설정 필드와 `database_url`이 없기 때문이다.

### Task 3: 설정 클래스에 DB 필드와 `database_url` 추가

**Files:**
- Modify: `backend/app/core/config.py`

- [ ] **Step 1: `backend/app/core/config.py`에 DB 설정 필드 추가**

필드:

```python
db_host: str = "127.0.0.1"
db_port: int = 5432
db_name: str = "session_trading"
db_user: str = "session_trading"
db_password: str = "session_trading"
```

- [ ] **Step 2: `database_url` 계산 속성 추가**

```python
@property
def database_url(self) -> str:
    return (
        f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
        f"@{self.db_host}:{self.db_port}/{self.db_name}"
    )
```

- [ ] **Step 3: 설정 테스트 다시 실행**

Run:
```bash
cd backend && .venv/bin/python -m pytest tests/test_config.py -v
```

Expected:
- `1 passed`가 출력된다.

## Chunk 3: 헬스체크 DB 상태를 TDD로 추가

### Task 4: 헬스체크의 DB 상태 테스트 먼저 작성

**Files:**
- Modify: `backend/tests/test_health.py`

- [ ] **Step 1: 성공 상태 테스트 확장**

기존 응답 기대값에 `database: "ok"`를 추가한다.

- [ ] **Step 2: 실패 상태 테스트 추가**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_503_when_database_is_unavailable(monkeypatch) -> None:
    async def fake_ping_database() -> None:
        raise RuntimeError("database unavailable")

    monkeypatch.setattr("app.api.routes.health.ping_database", fake_ping_database)

    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 503
    assert response.json()["database"] == "unavailable"
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run:
```bash
cd backend && .venv/bin/python -m pytest tests/test_health.py -v
```

Expected:
- 성공 상태 기대값 불일치 또는 import 오류로 실패한다.

### Task 5: DB session 모듈과 헬스체크 DB ping 구현

**Files:**
- Create: `backend/app/db/session.py`
- Modify: `backend/app/api/routes/health.py`

- [ ] **Step 1: `backend/app/db/session.py` 작성**

포함 내용:

```python
from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings


settings = get_settings()

engine = create_async_engine(settings.database_url, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def ping_database() -> None:
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))
```

- [ ] **Step 2: `backend/app/api/routes/health.py`를 비동기 헬스체크로 수정**

동작:
- `await ping_database()` 호출
- 성공 시 `database: "ok"` 반환
- 실패 시 `HTTPException(status_code=503, detail=...)` 대신 응답 본문에 DB 상태를 포함해 503 반환

예시 구조:

```python
from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.db.session import ping_database
```

- [ ] **Step 3: 헬스체크 테스트 다시 실행**

Run:
```bash
cd backend && .venv/bin/python -m pytest tests/test_health.py -v
```

Expected:
- 모든 헬스체크 테스트가 통과한다.

## Chunk 4: startup DB 확인과 문서화

### Task 6: 앱 startup에서 DB 연결 확인 추가

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: startup 이벤트 또는 lifespan에 DB ping 추가**

동작:
- 앱 시작 시 `await ping_database()` 실행
- 실패하면 예외를 전파해 앱 시작을 중단

- [ ] **Step 2: 기존 테스트가 깨지지 않는지 확인**

Run:
```bash
cd backend && .venv/bin/python -m pytest tests/test_health.py tests/test_config.py -v
```

Expected:
- 모든 테스트가 통과한다.

### Task 7: 실행 문서와 로컬 환경 파일 정리

**Files:**
- Modify: `backend/README.md`

- [ ] **Step 1: `backend/README.md`에 DB 환경변수와 준비 절차 추가**

반영 내용:
- `cp .env.example .env`
- `.env`에 로컬 PostgreSQL 접속 정보 확인
- 서버 시작 전 DB가 떠 있어야 함을 명시

- [ ] **Step 2: 로컬 `.env` 작성**

Run:
```bash
cd backend && cat <<'EOF' > .env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=session_trading
DB_USER=session_trading
DB_PASSWORD=session_trading
EOF
```

Expected:
- `backend/.env` 파일이 생성된다.
- Git에는 추적되지 않는다.

- [ ] **Step 3: `.env`가 무시되는지 확인**

Run:
```bash
git check-ignore backend/.env && echo ignored
```

Expected:
- `ignored`가 출력된다.

## Chunk 5: 최종 검증

### Task 8: 통합 검증 수행

**Files:**
- Verify only: `backend/app/main.py`
- Verify only: `backend/app/api/routes/health.py`
- Verify only: `backend/app/db/session.py`
- Verify only: `backend/tests/test_health.py`
- Verify only: `backend/tests/test_config.py`

- [ ] **Step 1: 전체 백엔드 테스트 실행**

Run:
```bash
cd backend && .venv/bin/python -m pytest
```

Expected:
- 전체 테스트가 통과한다.

- [ ] **Step 2: 개발 서버 실행**

Run:
```bash
cd backend && .venv/bin/uvicorn app.main:app --reload
```

Expected:
- 서버가 정상 시작된다.
- startup 시 DB 연결 확인이 통과한다.

- [ ] **Step 3: 헬스체크 응답 확인**

Run:
```bash
curl http://127.0.0.1:8000/health
```

Expected:
```json
{"status":"ok","service":"session-trading-backend","environment":"local","database":"ok"}
```

- [ ] **Step 4: 커밋**

```bash
git add backend/pyproject.toml backend/.env.example backend/README.md backend/app/core/config.py backend/app/main.py backend/app/api/routes/health.py backend/app/db/__init__.py backend/app/db/session.py backend/tests/test_health.py backend/tests/test_config.py
git commit -m "feat: add backend postgres connectivity"
```
