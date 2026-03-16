# Session Trading Backend

## 요구사항

- Python 3.12 이상

## 로컬 실행

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -e ".[dev]"
cp .env.example .env
.venv/bin/uvicorn app.main:app --reload
```

`.env`에는 아래 값이 들어 있어야 한다.

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=session_trading
DB_USER=session_trading
DB_PASSWORD=session_trading
```

서버 시작 시 PostgreSQL 연결 확인이 먼저 수행된다.
서버가 실행되면 `http://127.0.0.1:8000/health`에서 상태를 확인할 수 있다.
프런트 개발 서버는 기본적으로 `http://localhost:5173`와 `http://127.0.0.1:5173`에서 CORS 허용된다.

## 테스트 실행

```bash
cd backend
.venv/bin/python -m pytest
```
