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

서버가 실행되면 `http://127.0.0.1:8000/health`에서 상태를 확인할 수 있다.

## 테스트 실행

```bash
cd backend
.venv/bin/python -m pytest
```
