# 설정 탭 설계서

## 개요

- 작성일: 2026-03-18
- 대상 경로:
  - `frontend/src/pages/SettingsPage.tsx`
  - `frontend/src/features/`
  - `backend/app/repositories/app_settings.py`
  - `backend/app/api/routes/`
- 목적: 현재 플레이스홀더 상태인 `설정` 탭을 실제 설정 화면으로 교체하고, 시세/차트 화면과 운영 제어에 필요한 설정을 서버 저장 기반으로 관리할 수 있게 한다.

## 목표

- 설정 탭을 `사용자 설정 + 운영 제어 + 진단 정보`가 함께 있는 혼합형 페이지로 정의한다.
- 현재는 단일 사용자 전제로 구현하되, 이후 `사용자별 설정 + 관리자 운영 설정`으로 확장할 수 있는 구조를 유지한다.
- 설정 저장은 서버가 소유하고, 프런트는 설정 조회/수정과 운영 액션 호출만 맡는다.
- 시세/차트 화면의 기본 거래소, 기본 quote, 폴링 주기, 차트 기본값이 설정 탭과 연결돼야 한다.
- 운영 제어와 진단 정보는 저장 설정과 분리해 UI와 API 책임을 명확히 한다.

## 범위

- 설정 페이지 UI 구조 정의
- 서버 저장 설정 모델 정의
- 설정 조회/수정 API 형태 정의
- 운영 제어 버튼과 진단 패널 구조 정의
- 시세/차트 화면이 설정값을 사용하는 연결 지점 정의
- MVP 범위와 제외 범위 정의

## 비범위

- 사용자 인증/권한 시스템 도입
- 사용자별 설정 저장소 구현
- 거래소 API base URL, DB 접속 정보 같은 인프라 설정 편집
- 저수준 스트림 파라미터 직접 편집
- 알림, 테마 커스터마이징, 색상 규칙 같은 고급 개인화
- 배포 환경 전환 UI

## 현재 상태

- 프런트 설정 페이지는 [SettingsPage.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/pages/SettingsPage.tsx)에서 단순 플레이스홀더를 렌더링한다.
- 데스크톱 공용 레이아웃은 [DesktopRouteContent.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/features/navigation/DesktopRouteContent.tsx) 기반이다.
- 백엔드는 [app_settings.py](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend/app/repositories/app_settings.py)와 [app_setting.py](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend/app/models/app_setting.py)를 통해 JSONB key-value 저장소를 이미 가지고 있다.
- 거래소별 ticker stream 제어는 [admin_market_data_streams.py](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/backend/app/api/routes/admin_market_data_streams.py)에서 별도 API로 제공한다.

## 설계 결정

### 1. 설정 탭은 혼합형이지만 내부 구조는 도메인별로 분리한다

설정 탭은 한 페이지에서 아래 3종류를 함께 보여준다.

- 일반 사용자 설정
- 운영 제어 액션
- 런타임 진단 정보

하지만 저장 모델과 화면 구성은 아래 도메인으로 분리한다.

- `general`
- `market_data`
- `chart`
- `ops`
- `runtime`

이 분리가 필요한 이유는 이후 사용자별 설정으로 갈 때 저장 주체만 바꾸고 화면 구조는 최대한 유지하기 위해서다.

### 2. 저장 설정, 운영 액션, 런타임 상태를 분리한다

아래 3가지는 서로 성격이 다르므로 같은 모델로 다루지 않는다.

- 저장 설정
  - 예: 기본 거래소, 폴링 주기, 차트 타임프레임
- 운영 액션
  - 예: 마켓 동기화 실행, 거래소별 stream 시작/중지
- 런타임 상태
  - 예: 현재 stream 상태, 마지막 오류, 마지막 수신 시각

설정을 저장하는 API와 운영 액션 API를 분리하면 실패 처리와 UI 피드백이 단순해진다.

### 3. 저장소는 기존 `app_settings`를 확장해 사용한다

새로운 큰 설정 테이블을 만들지 않고, 기존 `app_settings` key-value 구조를 확장한다.

권장 키 구조:

- `general.default_exchange`
- `general.default_route`
- `market_data.default_quote`
- `market_data.default_order_by`
- `market_data.default_order_dir`
- `market_data.poll_interval_ms`
- `market_data.auto_refresh_enabled`
- `market_data.page_size`
- `market_data.upbit.enabled`
- `market_data.bithumb.enabled`
- `market_data.binance.enabled`
- `chart.default_exchange`
- `chart.default_symbol`
- `chart.default_interval`
- `chart.theme`
- `chart.show_volume`
- `chart.price_format_mode`
- `ui.mobile_default_view`
- `ops.market_sync_on_boot`
- `ops.upbit.auto_start`
- `ops.bithumb.auto_start`
- `ops.binance.auto_start`

기존 ticker 관련 키는 유지한다.

- `upbit.ticker.enabled`
- `upbit.ticker.flush_interval_ms`
- `upbit.ticker.batch_size`
- `bithumb.ticker.*`
- `binance.ticker.*`

즉, 새 설정 탭은 기존 운영용 키와 새 UI용 키를 함께 사용한다.

### 4. 백엔드 API 주소는 설정 탭의 수정 대상에서 제외한다

`백엔드 API 주소`는 사용자가 바꾸는 일반 설정이 아니라 배포/환경 설정이다. 서버 저장 설정으로 두면 앱 부트스트랩 책임이 꼬인다.

따라서 설정 탭에서는 아래처럼 다룬다.

- `현재 연결 대상`: 읽기 전용 진단 정보로 표시
- `API 주소 수정`: MVP 범위에서 제외

### 5. 설정 페이지는 한 페이지 5섹션 구조로 간다

권장 UI 구조:

- 상단 상태 바
  - 백엔드 연결 상태
  - 마지막 저장 시각
  - 현재 환경
  - 저장 중/오류 상태
- 일반
  - 기본 거래소
  - 기본 진입 화면
- 마켓 데이터
  - 거래소별 활성화 여부
  - 기본 quote
  - 목록 기본 정렬 기준/방향
  - 폴링 주기
  - 자동 새로고침 여부
  - 목록 기본 개수
- 차트
  - 기본 거래소
  - 기본 심볼
  - 기본 타임프레임
  - 차트 테마
  - 거래량 표시 여부
- 운영 제어
  - 마켓 동기화 실행
  - 거래소별 ticker stream 시작/중지
  - 거래소별 ticker 사용 여부
  - 거래소별 auto start 여부
- 진단
  - 백엔드 연결 상태
  - 현재 환경
  - 거래소별 stream 상태
  - 마지막 오류
  - 마지막 수신 시각
  - 디버그 정보 복사

### 6. 저장 UX는 `편집 후 저장`, 운영 제어는 `즉시 실행`으로 분리한다

폼 성격의 설정은 자동 저장하지 않는다.

- 일반
- 마켓 데이터
- 차트

이 섹션은 변경 후 `저장` 버튼을 눌러 반영한다.

운영 제어는 즉시 실행한다.

- 마켓 동기화 실행
- 거래소별 stream 시작/중지

진단 정보는 읽기 전용으로 보여준다.

이 규칙을 쓰면:

- 저장 상태와 실행 상태를 섞지 않을 수 있고
- 액션 실패와 저장 실패를 따로 처리할 수 있다.

### 7. 초기화는 전체가 아니라 섹션 단위로 제공한다

`기본값 복원`은 전체 리셋보다 섹션 리셋이 안전하다.

예:

- 마켓 데이터 기본값 복원
- 차트 기본값 복원

운영 제어까지 한 번에 초기화하는 동작은 의도치 않은 운영 영향이 크므로 MVP에서 제외한다.

### 8. 현재는 단일 사용자지만, 구조는 이후 사용자별 설정 확장을 고려한다

이번 단계는 단일 사용자 전제이므로 모든 저장 설정을 전역 설정처럼 다뤄도 된다.

하지만 이후 확장 방향은 아래처럼 잡는다.

- 개인화 설정
  - `general`
  - `market_data`
  - `chart`
  - `ui`
- 운영 설정
  - `ops`
  - ticker 제어와 런타임 상태

즉, 이번 설계는 나중에 저장 범위를 `global`과 `user`로 나누기 쉽게 만드는 데 목적이 있다.

## 백엔드 API 구조

### 1. `GET /api/v1/settings`

저장된 설정 전체 조회용 API다.

응답은 프런트가 바로 렌더링할 수 있는 섹션 구조 JSON으로 반환한다.

예시:

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
    "show_volume": true
  },
  "ops": {
    "market_sync_on_boot": false,
    "exchanges": {
      "upbit": { "auto_start": true, "ticker_enabled": true },
      "bithumb": { "auto_start": true, "ticker_enabled": true },
      "binance": { "auto_start": true, "ticker_enabled": true }
    }
  }
}
```

### 2. `PATCH /api/v1/settings`

부분 수정용 API다.

- 섹션 단위 patch 허용
- 저장 후 최신 전체 문서를 다시 반환
- 입력값 검증 실패 시 `400`

예시 요청:

```json
{
  "market_data": {
    "poll_interval_ms": 2000,
    "default_quote": "BTC"
  },
  "chart": {
    "default_interval": "240"
  }
}
```

### 3. `POST /api/v1/settings/reset`

기본값 복원용 API다.

- 전체 복원은 지원하지 않고 섹션 복원만 허용
- 예: `general`, `market_data`, `chart`

예시 요청:

```json
{
  "section": "chart"
}
```

### 4. `GET /api/v1/settings/runtime`

저장 설정이 아니라 진단 정보 조회용 API다.

포함 항목:

- 현재 환경
- 백엔드 연결 상태
- 거래소별 stream 상태
- 마지막 오류
- 마지막 수신 시각
- 마지막 flush 시각
- 현재 연결 대상 정보

### 5. 운영 액션은 기존 admin API를 재사용한다

아래 API는 새 설정 API에 흡수하지 않는다.

- `POST /admin/market-syncs`
- `POST /admin/market-data-streams/ticker/start?exchange=...`
- `POST /admin/market-data-streams/ticker/stop?exchange=...`
- `GET /admin/market-data-streams/ticker/status?exchange=...`

프런트 설정 탭은 이 API들을 호출하는 버튼만 제공한다.

## 프런트 화면 구조

### 데스크톱

- 상단: 제목, 설명, 저장 상태, `저장`, `섹션 복원`
- 본문:
  - 2열 카드 레이아웃
  - `일반`, `마켓 데이터`, `차트`
  - `운영 제어`, `진단`은 전체 폭 카드

### 모바일

- 상단 요약 바
- 섹션별 아코디언
- 운영 제어는 별도 블록으로 분리
- 위험 액션 버튼은 본문 일반 설정과 시각적으로 분리

## 저장/적용 UX

- 페이지 진입 시
  - `GET /api/v1/settings`
  - `GET /api/v1/settings/runtime`
- 폼 수정 시
  - `저장되지 않은 변경` 표시
  - `저장` 버튼 활성화
- 저장 성공 시
  - 최신 설정으로 폼 갱신
  - 마지막 저장 시각 갱신
- 저장 실패 시
  - 해당 섹션 값을 유지
  - 섹션 단위 오류 메시지 표시
- 운영 액션 실행 시
  - 해당 버튼만 로딩
  - 성공/실패 결과를 버튼 근처에 표시
- 진단 새로고침은 저장 상태와 분리

## 입력 검증 규칙

- `poll_interval_ms`
  - 최소 `1000`
  - 최대 `10000`
- `page_size`
  - 최소 `20`
  - 최대 `100`
- `default_quote`
  - 선택한 거래소가 지원하는 quote만 허용
- `default_symbol`
  - 선택한 거래소와 호환되는 심볼만 허용
- `default_interval`
  - 프런트가 실제로 지원하는 interval 목록 안에서만 허용

초기 버전에서는 `chart.default_exchange`와 `general.default_exchange`를 같게 유지하는 방향이 UX가 단순하다.

## MVP 포함 항목

- 설정 페이지 실구현
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`
- `GET /api/v1/settings/runtime`
- 일반
  - 기본 거래소
  - 기본 진입 화면
- 마켓 데이터
  - 거래소별 활성화 여부
  - 기본 quote
  - 목록 기본 정렬 기준/방향
  - 폴링 주기
  - 자동 새로고침 여부
- 차트
  - 기본 타임프레임
  - 차트 테마
  - 거래량 표시 여부
- 운영 제어
  - 마켓 동기화 실행
  - 거래소별 ticker stream 시작/중지
  - 거래소별 ticker 사용 여부
  - 거래소별 auto start 여부
- 진단
  - 백엔드 연결 상태
  - 현재 환경
  - 거래소별 stream 상태
  - 마지막 오류
  - 마지막 수신 시각

## MVP 제외 항목

- 백엔드 API 주소 수정
- 거래소 API base URL 수정
- DB 설정 수정
- `batch_size`, `flush_interval_ms`, `retention_days` 같은 저수준 파라미터 노출
- 사용자별 설정 저장
- 인증/권한 분리
- 알림, 색상 규칙, 고급 디버그 옵션

## 구현 순서

1. 백엔드 설정 모델과 스키마 추가
2. `GET /api/v1/settings`, `PATCH /api/v1/settings`, `GET /api/v1/settings/runtime` 구현
3. 프런트 `SettingsPage` 실구현
4. 설정 폼과 운영 제어 UI 연결
5. 시세/차트 화면이 설정값을 읽어 기본 동작에 반영
6. 테스트 추가

## 테스트 기준

- 백엔드
  - 기본 설정 seed가 누락 없이 생성된다.
  - `GET /api/v1/settings`가 섹션 구조를 반환한다.
  - `PATCH /api/v1/settings`가 부분 수정과 검증을 처리한다.
  - `GET /api/v1/settings/runtime`가 거래소별 상태를 반환한다.
- 프런트
  - 설정 페이지가 각 섹션을 렌더링한다.
  - 저장되지 않은 변경 상태가 표시된다.
  - 저장 성공/실패 UI가 분리된다.
  - 운영 액션 버튼이 별도 로딩 상태를 가진다.
  - 시세/차트 화면이 기본 거래소, 기본 quote, 폴링 주기를 설정에서 읽는다.

## 가정

- 현재는 인증 없는 단일 사용자 모드다.
- 설정 탭은 내부 운영 도구 성격을 포함한다.
- 거래소별 스트림 제어는 기존 admin API를 재사용한다.
- 향후 사용자별 설정이 추가되면 `general`, `market_data`, `chart`, `ui`는 사용자 범위로 이동할 수 있다.
