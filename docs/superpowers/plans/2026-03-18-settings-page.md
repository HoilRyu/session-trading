# 설정 탭 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버 저장 기반 설정 탭을 구현하고, 시세/차트 화면이 기본 거래소·quote·폴링·차트 기본값을 설정에서 읽어 동작하도록 연결한다.

**Architecture:** 백엔드는 기존 `app_settings` key-value 저장소를 확장해 설정 조회/수정 API와 런타임 상태 API를 제공한다. 프런트는 `settings` 전용 feature 폴더를 만들고, 설정 페이지는 폼 저장 흐름과 운영 제어 액션을 분리한다. 시세/차트 화면은 서버 설정을 초기 기본값으로만 적용해 사용자 상호작용을 덮어쓰지 않도록 연결한다.

**Tech Stack:** FastAPI, Pydantic, SQLAlchemy AsyncSession, React, TypeScript, Vite, Vitest, Testing Library, Tailwind CSS

---

## 파일 구조

- Modify: `backend/app/repositories/app_settings.py`
  - 설정 기본값, 설정 읽기/쓰기 헬퍼, 섹션 직렬화 로직을 추가한다.
- Modify: `backend/app/main.py`
  - startup 시 persisted `ops` 설정을 읽어 market sync와 ticker auto start를 실행하도록 연결한다.
- Create: `backend/app/schemas/settings.py`
  - 설정 조회/수정/초기화/런타임 응답 스키마를 정의한다.
- Create: `backend/app/api/routes/settings.py`
  - `GET /api/v1/settings`, `PATCH /api/v1/settings`, `POST /api/v1/settings/reset`, `GET /api/v1/settings/runtime`를 제공한다.
- Modify: `backend/app/api/router.py`
  - 새 settings router를 등록한다.
- Modify: `backend/tests/test_app_settings.py`
  - 기본값 seed, 설정 직렬화, 부분 수정 헬퍼를 테스트한다.
- Modify: `backend/tests/test_health.py`
  - startup이 persisted `ops` 설정을 읽어 market sync와 auto start를 수행하는지 테스트한다.
- Create: `backend/tests/test_settings_api.py`
  - settings API, reset, runtime 응답 테스트를 추가한다.
- Create: `frontend/src/features/settings/settings.types.ts`
  - 프런트 설정 도메인 타입을 정의한다.
- Create: `frontend/src/features/settings/api/settings.ts`
  - settings 조회/수정/초기화 API 호출 유틸을 만든다.
- Create: `frontend/src/features/settings/api/settingsOperations.ts`
  - market sync 실행과 거래소별 stream start/stop 호출 유틸을 만든다.
- Create: `frontend/src/features/settings/hooks/useServerSettings.ts`
  - 저장 설정 조회/갱신 전용 훅을 만든다.
- Create: `frontend/src/features/settings/hooks/useSettingsRuntime.ts`
  - runtime 조회와 독립 새로고침을 담당하는 훅을 만든다.
- Create: `frontend/src/features/settings/hooks/useSettingsOperations.ts`
  - 운영 액션 pending/success/error 상태를 담당하는 훅을 만든다.
- Create: `frontend/src/features/settings/hooks/useSettingsPageState.ts`
  - 폼 초깃값, dirty state, 저장, 섹션 reset만 관리한다.
- Create: `frontend/src/features/settings/components/SettingsPageLayout.tsx`
  - 설정 페이지의 상단 상태 바와 카드 레이아웃을 조립한다.
- Create: `frontend/src/features/settings/components/SettingsGeneralCard.tsx`
  - 일반 설정 입력 UI를 담당한다.
- Create: `frontend/src/features/settings/components/SettingsMarketDataCard.tsx`
  - 거래소 활성화, quote, 정렬, 폴링, 자동 새로고침 UI를 담당한다.
- Create: `frontend/src/features/settings/components/SettingsChartCard.tsx`
  - 차트 interval, theme, 거래량 표시 UI를 담당한다.
- Create: `frontend/src/features/settings/components/SettingsOpsCard.tsx`
  - 마켓 동기화, stream 시작/중지, ticker 사용 여부, auto start 제어 UI를 담당한다.
- Create: `frontend/src/features/settings/components/SettingsRuntimeCard.tsx`
  - 런타임 상태와 오류, 마지막 수신 시각을 표시한다.
- Modify: `frontend/src/pages/SettingsPage.tsx`
  - 플레이스홀더 대신 새 설정 페이지를 렌더링한다.
- Create: `frontend/src/features/settings/api/settings.test.ts`
  - settings API URL 및 요청/응답 매핑을 테스트한다.
- Create: `frontend/src/features/settings/api/settingsOperations.test.ts`
  - market sync, stream start/stop API 호출 유틸을 테스트한다.
- Create: `frontend/src/features/settings/hooks/useServerSettings.test.tsx`
  - 저장 설정 조회/갱신 훅의 성공/실패 흐름을 테스트한다.
- Create: `frontend/src/features/settings/hooks/useSettingsRuntime.test.tsx`
  - runtime 초기 조회와 독립 새로고침 흐름을 테스트한다.
- Create: `frontend/src/features/settings/hooks/useSettingsOperations.test.tsx`
  - 운영 액션별 pending/success/error 분리를 테스트한다.
- Create: `frontend/src/features/settings/hooks/useSettingsPageState.test.tsx`
  - dirty state, 저장, save failure, 섹션 reset 규칙을 테스트한다.
- Create: `frontend/src/features/settings/components/SettingsPageLayout.test.tsx`
  - 주요 카드 렌더링과 버튼 상태를 테스트한다.
- Modify: `frontend/src/pages/HomePage.tsx`
  - 모바일에서 `/settings` 진입 시 실제 설정 화면이 렌더링되도록 라우팅 분기를 조정한다.
- Modify: `frontend/src/app/App.test.tsx`
  - 설정 페이지 진입 시 데스크톱/모바일 모두 실제 설정 UI가 보이는지 검증한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
  - 서버 설정에서 데스크톱 기본 거래소, quote, 차트 interval을 초기값으로 적용한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`
  - 모바일 목록도 기본 거래소와 quote를 설정에서 읽도록 연결한다.
- Modify: `frontend/src/features/market-chart/hooks/useMarketList.ts`
  - 폴링 주기와 자동 새로고침 여부를 settings 기반으로 받을 수 있게 확장한다.
- Create: `frontend/src/features/market-chart/hooks/useMarketChartDefaults.ts`
  - settings 기반 초기값 계산과 최초 1회 적용 규칙을 공통화한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
  - 설정 기반 초기값 적용과 사용자 상호작용 유지 규칙을 테스트한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
  - 모바일 초기값 반영을 테스트한다.
- Modify: `frontend/src/features/market-chart/hooks/useMarketList.test.tsx`
  - 폴링 주기와 자동 새로고침 on/off 동작을 테스트한다.
- Create: `frontend/src/features/market-chart/hooks/useMarketChartDefaults.test.tsx`
  - 늦게 도착한 settings가 현재 사용자 선택을 덮어쓰지 않는 규칙을 테스트한다.

## Chunk 1: 백엔드 설정 모델과 API

### Task 1: 설정 기본값과 직렬화 모델을 테스트로 고정

**Files:**
- Modify: `backend/app/repositories/app_settings.py`
- Modify: `backend/tests/test_app_settings.py`

- [ ] **Step 1: 새 설정 기본값과 섹션 직렬화 기대값을 failing test로 추가**

추가 테스트 내용:

- `ensure_default_app_settings`가 기존 ticker 설정과 새 `general`, `market_data`, `chart`, `ops` 기본값을 모두 seed한다.
- `get_settings_document` 같은 새 헬퍼가 섹션 구조 JSON을 반환한다.
- 부분 수정 헬퍼가 지정된 키만 갱신하고 다른 키는 유지한다.
- 섹션 reset 헬퍼가 해당 섹션 키만 기본값으로 되돌린다.

테스트에서 고정할 기본값 예시:

```json
{
  "general": {
    "default_exchange": "upbit",
    "default_route": "/market-chart"
  },
  "market_data": {
    "default_quote": "KRW",
    "default_order_by": "trade_amount_24h",
    "default_order_dir": "desc",
    "poll_interval_ms": 1000,
    "auto_refresh_enabled": true,
    "page_size": 50,
    "exchanges": {
      "upbit": { "enabled": true },
      "bithumb": { "enabled": true },
      "binance": { "enabled": true }
    }
  },
  "chart": {
    "default_exchange": "upbit",
    "default_symbol": "KRW-BTC",
    "default_interval": "60",
    "theme": "light",
    "show_volume": true,
    "price_format_mode": "auto"
  },
  "ops": {
    "market_sync_on_boot": false,
    "exchanges": {
      "upbit": { "auto_start": false, "ticker_enabled": true },
      "bithumb": { "auto_start": false, "ticker_enabled": true },
      "binance": { "auto_start": false, "ticker_enabled": true }
    }
  }
}
```

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_app_settings.py -v
```

Expected:

- 새 기본값 키, 섹션 직렬화, 부분 수정 헬퍼가 아직 없어서 FAIL

- [ ] **Step 3: `app_settings.py`에 최소 구현 추가**

구현 내용:

- 새 기본 설정 상수와 설명 추가
- 섹션별 key prefix 목록 정의
- 설정 문서 직렬화 헬퍼 추가
- 부분 수정 헬퍼 추가
- 섹션 reset 헬퍼 추가

- [ ] **Step 4: 테스트를 다시 실행해 통과 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_app_settings.py -v
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/app/repositories/app_settings.py backend/tests/test_app_settings.py
git commit -m "feat(back): add settings document helpers"
```

### Task 2: settings API 스키마와 라우트를 추가

**Files:**
- Create: `backend/app/schemas/settings.py`
- Create: `backend/app/api/routes/settings.py`
- Modify: `backend/app/api/router.py`
- Create: `backend/tests/test_settings_api.py`

- [ ] **Step 1: settings API failing test 작성**

추가 테스트 내용:

- 빈 저장소에서 `GET /api/v1/settings`가 기본값 seed 후 섹션 구조 JSON을 반환한다.
- `GET /api/v1/settings`가 섹션 구조 JSON을 반환한다.
- `PATCH /api/v1/settings`가 부분 수정 후 최신 문서를 반환한다.
- 잘못된 `poll_interval_ms`, `page_size`, `default_quote`는 `400`을 반환한다.
- 잘못된 `default_interval`은 `400`을 반환한다.
- `chart.default_symbol`이 선택한 기본 거래소와 호환되지 않으면 `400`을 반환한다.
- `POST /api/v1/settings/reset`이 섹션 단위 복원을 수행한다.
- `POST /api/v1/settings/reset`은 `general`, `market_data`, `chart`만 허용하고 `ops`와 전체 reset은 거부한다.

검증 기준:

- `default_quote`는 `general.default_exchange`가 지원하는 quote 집합 기준으로 검증한다.
- `default_interval`은 프런트가 지원하는 interval 목록 기준으로 검증한다.
- `chart.default_symbol`은 `chart.default_exchange`와 호환되는 심볼만 허용한다.

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_settings_api.py -v
```

Expected:

- settings router와 스키마가 없어 FAIL

- [ ] **Step 3: 최소 API 구현**

구현 내용:

- Pydantic request/response 모델 추가
- settings router 추가
- `api_router`에 settings router 등록
- repository 헬퍼를 이용해 첫 조회 시 기본값 seed 후 조회/부분 수정/reset 연결

- [ ] **Step 4: settings API 테스트 재실행**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_settings_api.py -v
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/app/schemas/settings.py backend/app/api/routes/settings.py backend/app/api/router.py backend/tests/test_settings_api.py
git commit -m "feat(back): add settings api"
```

### Task 3: 런타임 상태 API를 추가하고 기존 admin 상태와 연결

**Files:**
- Modify: `backend/app/api/routes/settings.py`
- Modify: `backend/tests/test_settings_api.py`
- Reference: `backend/app/api/routes/admin_market_data_streams.py`

- [ ] **Step 1: runtime 응답 failing test 추가**

추가 테스트 내용:

- `GET /api/v1/settings/runtime`이 환경, backend status, backend target, 거래소별 stream 상태, 마지막 오류, 마지막 수신 시각, 마지막 flush 시각을 반환한다.
- 일부 거래소 상태 조회가 실패해도 전체 API는 가능한 범위에서 응답하고 실패 항목만 비운다.

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_settings_api.py -v
```

Expected:

- runtime route 또는 필드가 없어 FAIL

- [ ] **Step 3: runtime 최소 구현**

구현 내용:

- `get_settings()`와 기존 ticker stream service를 조합해 runtime payload 구성
- 거래소별 상태를 `upbit`, `bithumb`, `binance` 키로 정규화
- 환경, 현재 서버 target 문자열, `backend_status=online` 포함
- 거래소별 `last_received_at`, `last_flushed_at`, `last_error` 포함

- [ ] **Step 4: 백엔드 설정 관련 테스트 전체 검증**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_app_settings.py tests/test_settings_api.py tests/test_admin_market_data_streams.py tests/test_config.py -v
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/app/api/routes/settings.py backend/tests/test_settings_api.py
git commit -m "feat(back): add settings runtime status api"
```

### Task 4: persisted `ops` 설정을 실제 startup 동작에 연결

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/repositories/app_settings.py`
- Modify: `backend/tests/test_health.py`

- [ ] **Step 1: startup 동작 failing test 추가**

추가 테스트 내용:

- startup이 환경 변수 대신 persisted `ops.exchanges.{exchange}.auto_start` 값을 읽어 stream auto start를 결정한다.
- `ops.market_sync_on_boot=true`면 market sync service를 enqueue하고 실행을 시작한다.
- persisted 값이 없을 때만 현재 env 기반 auto-start 기본값으로 fallback한다.

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_health.py -v
```

Expected:

- startup이 persisted ops 설정을 읽지 않아 FAIL

- [ ] **Step 3: startup 최소 구현**

구현 내용:

- `app_settings.py`에 startup용 `ops` 설정 조회 헬퍼 추가
- `lifespan`에서 DB ping 후 persisted `ops` 설정을 읽어 market sync와 auto start를 결정
- `market_sync_on_boot`는 catalog sync service를 background task로 시작
- `auto_start`는 persisted 값이 있으면 env 설정보다 우선

- [ ] **Step 4: startup 관련 테스트와 runtime 회귀 검증**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_health.py tests/test_settings_api.py tests/test_app_settings.py tests/test_config.py -v
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add backend/app/main.py backend/app/repositories/app_settings.py backend/tests/test_health.py
git commit -m "feat(back): apply persisted ops settings on startup"
```

## Chunk 2: 프런트 설정 feature와 페이지 구현

### Task 4: settings API 클라이언트와 공통 훅을 만든다

**Files:**
- Create: `frontend/src/features/settings/settings.types.ts`
- Create: `frontend/src/features/settings/api/settings.ts`
- Create: `frontend/src/features/settings/api/settings.test.ts`
- Create: `frontend/src/features/settings/api/settingsOperations.ts`
- Create: `frontend/src/features/settings/api/settingsOperations.test.ts`
- Create: `frontend/src/features/settings/hooks/useServerSettings.ts`
- Create: `frontend/src/features/settings/hooks/useServerSettings.test.tsx`
- Create: `frontend/src/features/settings/hooks/useSettingsRuntime.ts`
- Create: `frontend/src/features/settings/hooks/useSettingsRuntime.test.tsx`
- Create: `frontend/src/features/settings/hooks/useSettingsOperations.ts`
- Create: `frontend/src/features/settings/hooks/useSettingsOperations.test.tsx`

- [ ] **Step 1: settings API와 훅 failing test 작성**

추가 테스트 내용:

- `getSettings`, `patchSettings`, `resetSettingsSection`, `getSettingsRuntime`가 올바른 URL과 메서드로 호출된다.
- `useServerSettings`가 초기 조회 성공 시 데이터를 노출한다.
- 조회 실패 시 오류 상태를 노출한다.
- `saveSettings` 호출 후 최신 문서로 갱신된다.
- `useSettingsRuntime`가 페이지 진입 시 runtime을 조회하고, 저장 로딩과 무관하게 독립 새로고침이 가능하다.
- `useSettingsOperations`가 `market sync`, `stream start`, `stream stop`을 즉시 실행하고 operation별 pending 상태를 분리한다.

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend
npm run test:run -- src/features/settings/api/settings.test.ts src/features/settings/hooks/useServerSettings.test.tsx
```

Expected:

- settings feature 파일이 없어 FAIL

- [ ] **Step 3: API 유틸과 공통 훅 최소 구현**

구현 내용:

- settings 타입 정의
- settings 조회/저장/reset API 유틸 구현
- admin action API 유틸 구현
- `useServerSettings`는 저장 설정 전용으로 `data`, `loading`, `error`, `save`, `resetSection`만 제공
- `useSettingsRuntime`는 `runtime`, `loading`, `error`, `refresh`만 제공
- `useSettingsOperations`는 action별 `pending`, `message`, `error`, `runMarketSync`, `startStream`, `stopStream` 제공

- [ ] **Step 4: 테스트를 다시 실행해 통과 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend
npm run test:run -- src/features/settings/api/settings.test.ts src/features/settings/api/settingsOperations.test.ts src/features/settings/hooks/useServerSettings.test.tsx src/features/settings/hooks/useSettingsRuntime.test.tsx src/features/settings/hooks/useSettingsOperations.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/settings/settings.types.ts frontend/src/features/settings/api/settings.ts frontend/src/features/settings/api/settings.test.ts frontend/src/features/settings/api/settingsOperations.ts frontend/src/features/settings/api/settingsOperations.test.ts frontend/src/features/settings/hooks/useServerSettings.ts frontend/src/features/settings/hooks/useServerSettings.test.tsx frontend/src/features/settings/hooks/useSettingsRuntime.ts frontend/src/features/settings/hooks/useSettingsRuntime.test.tsx frontend/src/features/settings/hooks/useSettingsOperations.ts frontend/src/features/settings/hooks/useSettingsOperations.test.tsx
git commit -m "feat(front): add settings api client"
```

### Task 5: 설정 페이지 폼 상태와 카드 컴포넌트를 구현한다

**Files:**
- Create: `frontend/src/features/settings/hooks/useSettingsPageState.ts`
- Create: `frontend/src/features/settings/hooks/useSettingsPageState.test.tsx`
- Create: `frontend/src/features/settings/components/SettingsPageLayout.tsx`
- Create: `frontend/src/features/settings/components/SettingsPageLayout.test.tsx`
- Create: `frontend/src/features/settings/components/SettingsGeneralCard.tsx`
- Create: `frontend/src/features/settings/components/SettingsMarketDataCard.tsx`
- Create: `frontend/src/features/settings/components/SettingsChartCard.tsx`
- Create: `frontend/src/features/settings/components/SettingsOpsCard.tsx`
- Create: `frontend/src/features/settings/components/SettingsRuntimeCard.tsx`
- Modify: `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: settings page 상태/렌더링 failing test 작성**

추가 테스트 내용:

- 설정 페이지가 `일반`, `마켓 데이터`, `차트`, `운영 제어`, `진단` 카드를 렌더링한다.
- 입력 변경 시 dirty state가 생기고 `저장` 버튼이 활성화된다.
- 저장 성공 시 dirty state가 사라진다.
- 저장 실패 시 입력값은 유지되고 섹션 오류 메시지가 표시된다.
- `general`, `market_data`, `chart` 섹션만 복원 버튼이 있고 `ops`는 복원 대상에서 제외된다.
- 운영 제어 버튼 로딩이 저장 버튼 로딩과 분리된다.
- `market sync`, `stream start/stop` 버튼이 성공/실패 메시지를 버튼 근처에 표시한다.
- 모바일에서 섹션이 아코디언 구조로 렌더링되고 운영 제어가 일반 설정과 시각적으로 분리된다.
- runtime 새로고침이 저장 로딩과 독립적으로 동작한다.
- 설정 페이지 라우트 진입 시 데스크톱과 모바일 모두 플레이스홀더 대신 실제 카드 UI가 보인다.

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend
npm run test:run -- src/features/settings/hooks/useSettingsPageState.test.tsx src/features/settings/components/SettingsPageLayout.test.tsx src/app/App.test.tsx
```

Expected:

- settings page 전용 훅과 카드 컴포넌트가 없어 FAIL

- [ ] **Step 3: 최소 구현**

구현 내용:

- `useSettingsPageState`에
  - 폼 초깃값
  - dirty 계산
  - 저장
  - save failure 시 섹션 오류 상태 유지
  - 섹션 reset
- 카드 컴포넌트는 각 도메인 입력만 담당
- `SettingsPage`는 `useServerSettings`, `useSettingsRuntime`, `useSettingsOperations`, `useSettingsPageState`를 조합
- 운영 제어 카드와 진단 카드는 저장 흐름과 독립적으로 동작
- `HomePage` 모바일 분기에서 `/settings`는 실제 `Outlet` 기반 설정 화면을 렌더링
- 저장/오류 상태는 상단 상태 바에 표시

- [ ] **Step 4: 테스트를 다시 실행해 통과 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend
npm run test:run -- src/features/settings/hooks/useSettingsPageState.test.tsx src/features/settings/components/SettingsPageLayout.test.tsx src/app/App.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/settings/hooks/useSettingsPageState.ts frontend/src/features/settings/hooks/useSettingsPageState.test.tsx frontend/src/features/settings/components/SettingsPageLayout.tsx frontend/src/features/settings/components/SettingsPageLayout.test.tsx frontend/src/features/settings/components/SettingsGeneralCard.tsx frontend/src/features/settings/components/SettingsMarketDataCard.tsx frontend/src/features/settings/components/SettingsChartCard.tsx frontend/src/features/settings/components/SettingsOpsCard.tsx frontend/src/features/settings/components/SettingsRuntimeCard.tsx frontend/src/pages/SettingsPage.tsx frontend/src/pages/HomePage.tsx frontend/src/app/App.test.tsx
git commit -m "feat(front): implement settings page"
```

## Chunk 3: 시세/차트 화면 설정 연동과 전체 검증

### Task 6: 마켓 리스트 폴링과 기본값이 settings를 따르도록 연결

**Files:**
- Modify: `frontend/src/features/market-chart/hooks/useMarketList.ts`
- Modify: `frontend/src/features/market-chart/hooks/useMarketList.test.tsx`
- Create: `frontend/src/features/market-chart/hooks/useMarketChartDefaults.ts`
- Create: `frontend/src/features/market-chart/hooks/useMarketChartDefaults.test.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
- Modify: `frontend/src/features/market-chart/components/TradingViewAdvancedChart.tsx`
- Modify: `frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx`
- Reference: `frontend/src/features/settings/hooks/useServerSettings.ts`

- [ ] **Step 1: settings 기반 초기값과 폴링 failing test 추가**

추가 테스트 내용:

- 데스크톱 `시세 / 차트`가 settings의 기본 거래소와 quote를 초기값으로 사용한다.
- 모바일 목록도 settings 기본값을 따른다.
- `useMarketList`가 settings의 `poll_interval_ms`, `auto_refresh_enabled`를 따른다.
- `TradingViewAdvancedChart`가 settings의 `default_interval`을 config에 반영한다.
- `TradingViewAdvancedChart`가 settings의 `theme`, `show_volume`을 config에 반영한다.
- 사용자가 탭을 바꾼 뒤 settings 조회가 늦게 도착해도 현재 선택을 덮어쓰지 않는다.

- [ ] **Step 2: 테스트를 단독 실행해 실패 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend
npm run test:run -- src/features/market-chart/hooks/useMarketList.test.tsx src/features/market-chart/hooks/useMarketChartDefaults.test.tsx src/features/market-chart/components/MarketChartDesktopLayout.test.tsx src/features/market-chart/components/MarketChartMobileListLayout.test.tsx src/features/market-chart/components/TradingViewAdvancedChart.test.tsx
```

Expected:

- settings 기반 초기값과 폴링 제어가 없어 FAIL

- [ ] **Step 3: 최소 구현**

구현 내용:

- `useMarketList`가 `pollIntervalMs`, `autoRefreshEnabled`를 입력으로 받도록 확장
- `useMarketChartDefaults`가 settings 문서에서 초기 exchange/quote/interval/theme/showVolume과 최초 1회 적용 규칙을 계산
- 데스크톱/모바일 레이아웃은 공통 훅이 계산한 초기값만 받아 사용
- 초기값은 최초 적용 한 번만 수행하고 이후 사용자 상호작용은 유지
- `TradingViewAdvancedChart`가 `interval`, `theme`, `showVolume` prop을 받아 TradingView config에 반영
- 데스크톱 차트 레이아웃이 settings의 차트 기본값을 차트 컴포넌트에 전달

- [ ] **Step 4: 테스트를 다시 실행해 통과 확인**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend
npm run test:run -- src/features/market-chart/hooks/useMarketList.test.tsx src/features/market-chart/hooks/useMarketChartDefaults.test.tsx src/features/market-chart/components/MarketChartDesktopLayout.test.tsx src/features/market-chart/components/MarketChartMobileListLayout.test.tsx src/features/market-chart/components/TradingViewAdvancedChart.test.tsx
```

Expected:

- PASS

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/hooks/useMarketList.ts frontend/src/features/market-chart/hooks/useMarketList.test.tsx frontend/src/features/market-chart/hooks/useMarketChartDefaults.ts frontend/src/features/market-chart/hooks/useMarketChartDefaults.test.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx frontend/src/features/market-chart/components/TradingViewAdvancedChart.tsx frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx
git commit -m "feat(front): apply settings to market chart defaults"
```

### Task 7: 전체 검증과 문서 정리

**Files:**
- Modify: `backend/README.md`
- Modify: `frontend/README.md`

- [ ] **Step 1: README와 사용 흐름 보강**

문서 반영 내용:

- settings API 요약
- 설정 페이지가 제어하는 항목
- 운영 제어 버튼과 기존 admin API 관계

- [ ] **Step 2: 전체 테스트와 빌드를 실행**

Run:

```bash
cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend
.venv/bin/python -m pytest tests/test_app_settings.py tests/test_settings_api.py tests/test_admin_market_data_streams.py tests/test_admin_market_syncs.py tests/test_markets_api.py -v

cd /Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend
npm run test:run -- src/features/settings/api/settings.test.ts src/features/settings/api/settingsOperations.test.ts src/features/settings/hooks/useServerSettings.test.tsx src/features/settings/hooks/useSettingsRuntime.test.tsx src/features/settings/hooks/useSettingsOperations.test.tsx src/features/settings/hooks/useSettingsPageState.test.tsx src/features/settings/components/SettingsPageLayout.test.tsx src/features/market-chart/hooks/useMarketList.test.tsx src/features/market-chart/hooks/useMarketChartDefaults.test.tsx src/features/market-chart/components/TradingViewAdvancedChart.test.tsx src/features/market-chart/components/MarketChartDesktopLayout.test.tsx src/features/market-chart/components/MarketChartMobileListLayout.test.tsx src/app/App.test.tsx
npm run build
```

Expected:

- 백엔드 테스트 PASS
- 프런트 테스트 PASS
- 프런트 빌드 PASS

- [ ] **Step 3: 수동 검증**

수동 확인 항목:

- `/settings` 진입 시 설정 카드가 보인다.
- 값 변경 후 저장 버튼이 활성화된다.
- 거래소별 stream 시작/중지 버튼이 작동한다.
- `/market-chart`가 설정한 기본 거래소와 quote로 열린다.
- 폴링 주기를 바꾸면 목록 재조회 빈도가 변경된다.
- 자동 새로고침을 끄면 1초 주기 재조회가 멈춘다.
- 차트 기본 interval, theme, 거래량 표시를 바꾸면 TradingView 위젯 config가 해당 값으로 열린다.
- settings 응답이 늦게 도착해도 이미 사용자가 바꾼 거래소, quote, 차트 선택을 덮어쓰지 않는다.

- [ ] **Step 4: 최종 커밋**

```bash
git add backend/README.md frontend/README.md
git commit -m "docs: document settings page workflow"
```

## 가정

- 설정 저장은 현재 전역 범위 단일 사용자 모드다.
- 인증과 권한 분리는 이번 단계에 넣지 않는다.
- `backend target`은 읽기 전용 진단 정보로만 노출한다.
- 설정 페이지는 내부 운영 도구 역할을 포함한다.
