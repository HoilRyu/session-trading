# 시세 차트 마켓 목록 API 연결 설계서

## 개요

- 작성일: 2026-03-17
- 대상 경로: `frontend/src/features/market-chart/`
- 목적: 데스크톱 `시세 / 차트` 오른쪽 마켓 목록 패널과 모바일 `/market-chart` 목록 화면을 실제 백엔드 `GET /api/v1/markets`와 연결하는 1차 구조를 정의한다.

## 목표

- 데스크톱 마켓 목록 패널이 실제 서버 응답으로 렌더링돼야 한다.
- 모바일 `/market-chart` 목록 화면도 같은 API를 사용해 실제 목록을 렌더링해야 한다.
- 상단 `원화 / BTC / USDT` 탭 전환이 실제 `quote` 쿼리로 연결돼야 한다.
- 로딩, 에러, 빈 결과 상태를 목록 영역 안에서 처리해야 한다.
- 데스크톱 기본 선택 마켓은 `BTC/KRW`로 맞추고, 모바일 목록 화면은 선택 상태 없이 보여야 한다.

## 범위

- `GET /api/v1/markets` 프론트 연결
- 데스크톱/모바일 공용 조회 훅
- API 응답 타입과 UI 변환기
- `원화 / BTC / USDT` 탭 전환
- 로딩 / 에러 / 빈 결과 처리
- 데스크톱 기본 선택 마켓 계산

## 비범위

- 1초 재조회
- 무한 스크롤
- 검색
- 정렬 변경 UI
- 모바일 상세 라우트 `/market-chart/:market`
- 차트 심볼과 선택 마켓 연동
- 즐겨찾기/보유/관심 기능

## 설계 결정

### 1. 데스크톱과 모바일은 같은 조회 훅을 공유한다

현재 요구는 같은 마켓 목록 데이터를 데스크톱 오른쪽 패널과 모바일 목록 화면에서 함께 사용한다. 따라서 화면별로 따로 fetch하지 않고 공용 훅으로 묶는다.

권장 구조:

```text
features/market-chart/
├─ api/
│  ├─ marketList.types.ts
│  └─ marketListMapper.ts
├─ hooks/
│  └─ useMarketList.ts
└─ components/
   ├─ MarketChartMarketListPanel.tsx
   └─ MarketChartMobileListLayout.tsx
```

이 구조면:

- API 응답 타입
- 응답 → UI 아이템 변환
- 로딩/에러/데이터 조회

를 분리할 수 있다.

### 2. 백엔드 URL은 기존 `backend.ts`를 확장해 사용한다

이미 프론트에는 `VITE_BACKEND_HOST`, `VITE_BACKEND_PORT`, `VITE_BACKEND_USE_HTTPS`를 사용하는 [backend.ts](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/.worktrees/market-chart-layout/frontend/src/config/backend.ts)가 있다.

이번 단계에서는 이 파일에 아래 함수를 추가하는 방식이 적합하다.

- `getMarketsUrl(params)`

예상 쿼리:

- `exchange=upbit`
- `quote=KRW | BTC | USDT`
- `limit=50`

이번 1차는 `exchange`를 고정 `upbit`로 둔다.

### 3. API 응답은 바로 UI에 쓰지 않고 프론트 전용 아이템으로 변환한다

백엔드 응답은 숫자형 문자열과 nullable 필드를 포함하므로, 렌더링 전에 프론트 전용 구조로 변환한다.

변환 규칙:

- 이름: `display_name_ko -> display_name_en -> base_asset`
- 심볼: `base_asset/quote_asset`
- 현재가: 표시용 문자열로 포맷
- 전일대비: 백분율 문자열로 포맷
- 거래대금: 현재 단계에서는 `acc_trade_volume_24h`를 간단한 문자열 포맷으로 표시
- 경고 여부: 응답에서 받되 1차 UI에서는 필수 표시는 아님

즉, 기존 목업용 `MarketChartMarketListItem` 구조는 유지하되 데이터 공급원만 서버 응답으로 바꾼다.

### 4. 데스크톱과 모바일의 선택 상태는 다르게 처리한다

데스크톱은 차트 영역이 이미 존재하므로 기본 선택 마켓이 있어야 한다.

규칙:

- 조회 성공 후 `BTC/KRW`가 응답에 있으면 그 항목을 기본 선택
- 없으면 첫 번째 항목을 기본 선택

모바일 `/market-chart` 목록 화면은 아직 상세 라우트가 없으므로 선택 상태를 두지 않는다.

즉:

- 데스크톱: 선택 행 있음
- 모바일: 선택 행 없음

### 5. 이번 단계의 상태 처리는 목록 영역 내부에 한정한다

로딩, 에러, 빈 결과는 전체 페이지가 아니라 목록 영역 내부에서만 보여준다.

상태 기준:

- `loading`
  - 패널 안에 간단한 로딩 텍스트 또는 스켈레톤
- `error`
  - 에러 문구 + 재시도 버튼
- `empty`
  - 조회 결과 없음 안내

차트 영역, 상단 정보 영역, 모바일 앱바/하단 탭은 이번 작업에서 바꾸지 않는다.

## 데이터 흐름

```text
quote 탭 선택
→ useMarketList({ exchange: 'upbit', quote })
→ GET /api/v1/markets
→ 응답 items 수신
→ marketListMapper로 UI 아이템 변환
→ 데스크톱/모바일 목록 UI 렌더링
```

데스크톱 추가 흐름:

```text
응답 items 수신
→ BTC/KRW 존재 여부 확인
→ selectedMarketId 계산
→ 선택 행 강조
```

## 예상 구조

```text
Desktop
├─ TradingView 차트
└─ 마켓 목록 패널
   ├─ quote 탭
   ├─ 헤더
   └─ 실제 서버 데이터 리스트
```

```text
Mobile /market-chart
├─ 상단 앱바 영역 - 시세 / 차트
├─ 실제 서버 데이터 마켓 목록
└─ 하단 탭 영역
```

## 검증 기준

아래 조건을 만족하면 구현 계획으로 넘어갈 수 있다.

- 데스크톱 마켓 목록 패널이 실제 `/api/v1/markets` 응답으로 렌더링된다.
- 모바일 `/market-chart`도 같은 API 결과를 사용한다.
- `원화 / BTC / USDT` 탭 전환 시 `quote` 쿼리가 바뀐다.
- 로딩 / 에러 / 빈 결과 상태가 목록 영역 안에서 처리된다.
- 데스크톱은 `BTC/KRW`를 기본 선택하고, 모바일은 선택 상태를 두지 않는다.

## 가정

- 현재 백엔드에서 `GET /api/v1/markets`는 `exchange=upbit`, `quote`, `limit` 파라미터를 정상 지원한다.
- `trade_price`, `signed_change_rate`, `acc_trade_volume_24h`는 문자열로 내려오므로 프론트 포맷팅이 필요하다.
- 이번 단계에서는 거래소 선택은 추가하지 않고 `upbit` 고정으로 시작한다.
