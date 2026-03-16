# Backend Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `backend` 폴더에 `FastAPI` 기반 최소 실행 골격과 헬스체크 테스트를 만든다.

**Architecture:** `app/main.py`에서 `FastAPI` 앱을 생성하고, `app/api/router.py`가 라우터를 묶고, `app/core/config.py`가 환경설정을 로드한다. 최소 기능은 `/health` 엔드포인트와 그에 대한 스모크 테스트로 제한해, 이후 거래소 연동과 전략 모듈을 무리 없이 확장할 수 있는 시작점을 만든다.

**Tech Stack:** Python 3.12+, FastAPI, Uvicorn, Pydantic Settings, Pytest, HTTPX, setuptools

---

## 파일 구조

- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/README.md`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/router.py`
- Create: `backend/app/api/routes/__init__.py`
- Create: `backend/app/api/routes/health.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/tests/test_health.py`

## 참고 스펙

- [backend bootstrap spec](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/docs/superpowers/specs/2026-03-16-backend-bootstrap-design.md)

## Chunk 1: 프로젝트 골격과 의존성 준비

### Task 1: Python 프로젝트 메타데이터와 기본 디렉터리 만들기

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`
- Create: `backend/app/__init__.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/routes/__init__.py`
- Create: `backend/app/core/__init__.py`

- [ ] **Step 1: `backend/pyproject.toml` 작성**

```toml
[build-system]
requires = ["setuptools>=69.0"]
build-backend = "setuptools.build_meta"

[project]
name = "session-trading-backend"
version = "0.1.0"
description = "FastAPI backend for session trading"
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115.0,<1.0.0",
  "pydantic-settings>=2.6.0,<3.0.0",
  "uvicorn[standard]>=0.34.0,<1.0.0",
]

[project.optional-dependencies]
dev = [
  "httpx>=0.28.0,<1.0.0",
  "pytest>=8.3.0,<9.0.0",
]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]

[tool.setuptools.packages.find]
include = ["app*"]
```

- [ ] **Step 2: 패키지 디렉터리와 `__init__.py` 파일 생성**

생성 대상:

```text
backend/app/__init__.py
backend/app/api/__init__.py
backend/app/api/routes/__init__.py
backend/app/core/__init__.py
```

내용은 빈 파일로 둔다.

- [ ] **Step 3: `.env.example` 작성**

```env
APP_NAME=session-trading-backend
ENVIRONMENT=local
API_V1_PREFIX=
```

- [ ] **Step 4: 가상환경 생성**

Run:
```bash
cd backend && python3 -m venv .venv
```

Expected:
- `backend/.venv` 디렉터리가 생성된다.

- [ ] **Step 5: 의존성 설치**

Run:
```bash
cd backend && .venv/bin/python -m pip install --upgrade pip
```

Expected:
- `pip`가 최신 버전으로 갱신된다.

Run:
```bash
cd backend && .venv/bin/python -m pip install -e ".[dev]"
```

Expected:
- `fastapi`
- `uvicorn`
- `pydantic-settings`
- `pytest`
- `httpx`
가 설치된다.

- [ ] **Step 6: 설치 확인**

Run:
```bash
cd backend && .venv/bin/python -m pip show fastapi pydantic-settings pytest
```

Expected:
- 세 패키지의 버전과 설치 경로가 출력된다.

- [ ] **Step 7: 커밋**

```bash
git add backend/pyproject.toml backend/.env.example backend/app/__init__.py backend/app/api/__init__.py backend/app/api/routes/__init__.py backend/app/core/__init__.py
git commit -m "chore: bootstrap backend package metadata"
```

## Chunk 2: 헬스체크 API를 TDD로 추가

### Task 2: 실패하는 헬스체크 테스트 먼저 작성하기

**Files:**
- Create: `backend/tests/test_health.py`

- [ ] **Step 1: 실패할 테스트 작성**

```python
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_returns_service_status() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "session-trading-backend",
        "environment": "local",
    }
```

- [ ] **Step 2: 테스트가 실제로 실패하는지 확인**

Run:
```bash
cd backend && .venv/bin/python -m pytest tests/test_health.py -v
```

Expected:
- `ModuleNotFoundError`
- 또는 `ImportError`
가 발생하면서 테스트가 실패한다. 아직 `app.main`과 관련 구현이 없기 때문이다.

### Task 3: 최소 FastAPI 앱과 설정 로딩 구현하기

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/api/router.py`
- Create: `backend/app/api/routes/health.py`
- Create: `backend/app/core/config.py`

- [ ] **Step 1: `backend/app/core/config.py` 작성**

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "session-trading-backend"
    environment: str = "local"
    api_v1_prefix: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 2: `backend/app/api/routes/health.py` 작성**

```python
from fastapi import APIRouter

from app.core.config import get_settings


router = APIRouter(tags=["health"])


@router.get("/health")
def read_health() -> dict[str, str]:
    settings = get_settings()

    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
    }
```

- [ ] **Step 3: `backend/app/api/router.py` 작성**

```python
from fastapi import APIRouter

from app.api.routes.health import router as health_router


api_router = APIRouter()
api_router.include_router(health_router)
```

- [ ] **Step 4: `backend/app/main.py` 작성**

```python
from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings


settings = get_settings()

app = FastAPI(title=settings.app_name)
app.include_router(api_router, prefix=settings.api_v1_prefix)
```

- [ ] **Step 5: 테스트를 다시 실행해 통과 확인**

Run:
```bash
cd backend && .venv/bin/python -m pytest tests/test_health.py -v
```

Expected:
- `1 passed`가 출력된다.

- [ ] **Step 6: 전체 테스트 스위트 실행**

Run:
```bash
cd backend && .venv/bin/python -m pytest
```

Expected:
- `1 passed`가 출력된다.

- [ ] **Step 7: 커밋**

```bash
git add backend/app/main.py backend/app/api/router.py backend/app/api/routes/health.py backend/app/core/config.py backend/tests/test_health.py
git commit -m "feat: add backend health check endpoint"
```

## Chunk 3: 실행 문서화와 최종 검증

### Task 4: 로컬 실행 문서 작성과 수동 검증 마무리

**Files:**
- Create: `backend/README.md`

- [ ] **Step 1: `backend/README.md` 작성**

````md
# Session Trading Backend

## 요구사항

- Python 3.12 이상

## 로컬 실행

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -e ".[dev]"
cp .env.example .env
.venv/bin/uvicorn app.main:app --reload
```

서버가 실행되면 `http://127.0.0.1:8000/health`에서 상태를 확인할 수 있다.

## 테스트 실행

```bash
cd backend
.venv/bin/python -m pytest
```
````

- [ ] **Step 2: 전체 테스트 재실행**

Run:
```bash
cd backend && .venv/bin/python -m pytest
```

Expected:
- 전체 테스트가 통과한다.

- [ ] **Step 3: 개발 서버 수동 실행 확인**

Run:
```bash
cd backend && .venv/bin/uvicorn app.main:app --reload
```

Expected:
- `Uvicorn running on http://127.0.0.1:8000` 로그가 출력된다.

- [ ] **Step 4: 다른 터미널에서 헬스체크 응답 확인**

Run:
```bash
curl http://127.0.0.1:8000/health
```

Expected:
```json
{"status":"ok","service":"session-trading-backend","environment":"local"}
```

- [ ] **Step 5: 커밋**

```bash
git add backend/README.md
git commit -m "docs: add backend bootstrap usage guide"
```
