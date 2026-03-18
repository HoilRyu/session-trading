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
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload
```

`.env`에는 아래 값이 들어 있어야 한다.

```env
UPBIT_API_BASE_URL=https://api.upbit.com
UPBIT_WEBSOCKET_URL=wss://api.upbit.com/websocket/v1
UPBIT_REQUEST_TIMEOUT_SEC=10
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

## 마이그레이션

```bash
cd backend
.venv/bin/alembic upgrade head
```

## 관리자 API

마켓 목록 동기화 작업 생성:

```bash
curl -X POST http://127.0.0.1:8000/admin/market-syncs
```

동기화 작업 상태 조회:

```bash
curl http://127.0.0.1:8000/admin/market-syncs/<run_id>
```

업비트 ticker 스트림 시작:

```bash
curl -X POST http://127.0.0.1:8000/admin/market-data-streams/ticker/start
```

이 호출은 업비트 REST 현재가 snapshot으로 `latest_market_tickers`를 먼저 채운 뒤,
WebSocket `ticker` 스트림을 시작한다.

업비트 ticker 스트림 상태 조회:

```bash
curl http://127.0.0.1:8000/admin/market-data-streams/ticker/status
```

업비트 ticker 스트림 중지:

```bash
curl -X POST http://127.0.0.1:8000/admin/market-data-streams/ticker/stop
```

`market_ticker_events`는 Timescale hypertable로 생성되고, 기본 retention은 `3일`이다.
최신 ticker는 `latest_market_tickers`에 upsert되고, 기본 스트림 설정은 `app_settings`에 저장된다.
REST bootstrap 데이터는 `latest_market_tickers`에만 들어가고, `market_ticker_events`는 WebSocket 이벤트만 저장한다.

## 마켓 조회 API

프런트 목록 조회용 일반 API:

```bash
curl "http://127.0.0.1:8000/api/v1/markets"
```

지원 쿼리 파라미터:

- `exchange`
  - 기본값: `all`
  - 예: `all`, `upbit`
- `quote`
  - 기본값: `all`
  - 예: `all`, `KRW`, `BTC`, `USDT`
- `query`
  - 기본값: 빈 문자열
- `start`
  - 기본값: `0`
- `limit`
  - 기본값: `50`
  - 최대값: `100`
- `order_by`
  - 기본값: `name`
  - 지원값: `name`, `price`, `change_rate`, `volume_24h`
- `order_dir`
  - 미입력 시 `name`은 `asc`
  - 미입력 시 `price`, `change_rate`, `volume_24h`는 `desc`

예시:

```bash
curl "http://127.0.0.1:8000/api/v1/markets?exchange=all&quote=KRW&order_by=price&start=0&limit=50"
```

이 API는 `market_listings`, `latest_market_tickers`, `exchanges`를 조인해
마켓 메타데이터와 최신 가격을 함께 반환한다.
실시간 정렬을 반영하려면 프런트가 현재 로드한 범위를 `start + limit`로 다시 요청하면 된다.
