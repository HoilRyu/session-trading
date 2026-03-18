# 시세 차트 마켓 목록 무한 스크롤 설계서

## 개요

- 작성일: 2026-03-18
- 대상 경로: `frontend/src/features/market-chart/`
- 목적: 데스크톱 마켓 목록 패널과 모바일 `/market-chart` 목록 화면에 `start + limit` 기반 무한 스크롤과 1초 주기 범위 재조회를 추가한다.

## 목표

- 마켓 목록이 `limit=50` 고정 단위로 추가 로딩돼야 한다.
- 데스크톱과 모바일이 같은 마켓 목록 조회 상태를 공유하는 훅 구조를 유지해야 한다.
- 스크롤 하단 도달 시 다음 50개를 추가로 조회해야 한다.
- 1초마다 지금까지 로드된 전체 범위를 다시 조회해 현재 목록을 최신 데이터로 덮어써야 한다.
- 데스크톱 기본 선택 마켓 규칙은 유지해야 한다.

## 범위

- `GET /api/v1/markets`에 `start` 파라미터 추가 사용
- 프론트 공용 마켓 목록 훅 확장
- 무한 스크롤 로딩 상태 추가
- 1초 주기 범위 재조회 추가
- 데스크톱/모바일 목록 UI에 하단 감지 또는 목록 끝 도달 처리 추가

## 비범위

- 정렬 UI 추가
- 검색 UI 추가
- 서버 부하 최적화 전략
- WebSocket 전환
- 모바일 상세 라우트
- 차트 심볼과 선택 마켓 연동

## 설계 결정

### 1. 페이지 크기는 항상 `50`으로 고정한다

현재 백엔드 `GET /api/v1/markets`는 `start`와 `limit`를 지원하고, `limit`의 최대값은 `100`이다. 하지만 이번 구현은 단순성과 일관성을 위해 `50` 단위로 고정한다.

즉:

- 초기 로드: `start=0&limit=50`
- 추가 로드: `start=50&limit=50`, `start=100&limit=50`
- 범위 재조회: 지금까지 로드된 범위를 `50` 단위 청크로 다시 요청

이 규칙을 쓰면:

- 추가 로딩과 주기 갱신이 같은 단위로 맞춰지고
- 프론트 내부 상태 계산이 단순해진다.

### 2. 무한 스크롤과 1초 갱신은 같은 공용 훅에서 관리한다

현재 데스크톱 패널과 모바일 목록 화면은 같은 `useMarketList` 훅을 사용한다. 이번 변경에서도 이 구조를 유지한다.

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
   ├─ MarketChartDesktopLayout.tsx
   └─ MarketChartMobileListLayout.tsx
```

추가 책임:

- `useMarketList`
  - 초기 로드
  - 다음 페이지 로드
  - 1초 재조회
  - 총 개수와 추가 로드 가능 여부 계산
- 목록 UI 컴포넌트
  - 스크롤 하단 감지
  - 하단 로딩 표시
  - 에러 상태 표시

### 3. 현재 로드된 전체 범위는 1초마다 `50` 단위 여러 요청으로 재조회한다

사용자 요구는 “지금까지 로드한 전체 범위를 다시 요청”하는 방식이다. 현재 백엔드는 한 번에 최대 100개까지 허용하지만, 이번 설계는 `50` 고정을 사용하므로 전체 범위를 여러 요청으로 나눠 다시 받는다.

예:

- 50개 로드됨
  - 재조회: `start=0&limit=50`
- 130개 로드됨
  - 재조회:
    - `start=0&limit=50`
    - `start=50&limit=50`
    - `start=100&limit=50`

이 요청들을 합친 뒤, 현재 목록을 새 결과로 덮어쓴다.

핵심 규칙:

- “화면에 보이는 일부만” 갱신하지 않는다.
- “지금까지 로드된 전체 범위”를 갱신한다.
- 현재 정렬 순서와 가격/등락률/거래량 변화가 반영된 최신 목록으로 교체한다.

### 4. 추가 로딩과 주기 갱신은 서로 충돌하지 않도록 분리한다

무한 스크롤과 1초 갱신이 동시에 돌면 응답 순서가 엇갈릴 수 있다. 이를 막기 위해 요청 흐름을 구분한다.

권장 상태:

- `items`
- `total`
- `loadedCount`
- `initialLoading`
- `loadingMore`
- `refreshing`
- `error`

동작 규칙:

- 초기 로드 중에는 추가 로딩과 갱신을 하지 않는다.
- 추가 로딩 중에는 같은 추가 로딩을 중복 실행하지 않는다.
- 주기 갱신은 현재 로드 범위를 기준으로 새 데이터를 받아 전체 목록을 덮어쓴다.
- quote가 바뀌면:
  - 기존 목록과 범위 상태를 초기화하고
  - 다시 `start=0&limit=50`부터 시작한다.

### 5. 스크롤 감지는 목록 컨테이너 기준 하단 근접 방식으로 구현한다

이번 단계는 구현 복잡도를 낮추기 위해 `IntersectionObserver` 대신 목록 컨테이너의 스크롤 위치를 기준으로 하단 근접 여부를 계산한다.

판정 기준 예시:

```text
scrollTop + clientHeight >= scrollHeight - threshold
```

이 방식은:

- 현재 이미 내부 스크롤 컨테이너가 존재하고
- 데스크톱과 모바일 모두 같은 패널 구조를 공유하며
- 별도 sentinel 요소 없이도 적용 가능하다.

즉, 이번 단계에서는 스크롤 이벤트 기반이 가장 단순하고 충분하다.

### 6. 데스크톱 기본 선택 마켓은 계속 `BTC/KRW` 우선 규칙을 유지한다

무한 스크롤과 갱신이 들어가도 데스크톱 기본 선택 규칙은 유지한다.

규칙:

- 로드된 목록 안에 `BTC/KRW`가 있으면 그 항목을 우선 선택
- 없으면 첫 항목 선택

현재 선택값을 별도 사용자 상호작용으로 유지하는 단계는 아직 아니므로, 이번 작업은 기존 규칙을 그대로 따른다.

## 데이터 흐름

### 초기 로드

```text
quote 선택
→ useMarketList 초기화
→ GET /api/v1/markets?exchange=upbit&quote=KRW&start=0&limit=50
→ items, total, loadedCount 설정
```

### 추가 로드

```text
목록 하단 도달
→ 다음 start 계산
→ GET /api/v1/markets?exchange=upbit&quote=KRW&start=<loadedCount>&limit=50
→ items 뒤에 추가
→ loadedCount 갱신
```

### 1초 범위 재조회

```text
1초 경과
→ 현재 loadedCount 기준으로 50 단위 청크 계산
→ 각 청크를 병렬 요청
→ 응답 items를 순서대로 합침
→ 현재 목록 전체를 새 결과로 교체
```

## 예상 API 사용 예시

### 초기 50개

```text
/api/v1/markets?exchange=upbit&quote=KRW&start=0&limit=50
```

### 다음 50개

```text
/api/v1/markets?exchange=upbit&quote=KRW&start=50&limit=50
```

### 180개 로드된 상태의 범위 재조회

```text
/api/v1/markets?exchange=upbit&quote=KRW&start=0&limit=50
/api/v1/markets?exchange=upbit&quote=KRW&start=50&limit=50
/api/v1/markets?exchange=upbit&quote=KRW&start=100&limit=50
/api/v1/markets?exchange=upbit&quote=KRW&start=150&limit=50
```

## 테스트 기준

아래를 테스트로 고정한다.

- `getMarketsUrl`이 `start`와 `limit`를 포함해 URL을 만든다.
- `useMarketList`가 초기 50개를 조회한다.
- `useMarketList`가 `loadMore` 호출 시 다음 `start`로 조회한다.
- `useMarketList`가 1초마다 현재 `loadedCount` 범위를 청크 단위로 재조회한다.
- quote 변경 시 목록과 범위 상태가 초기화된다.
- 데스크톱/모바일 목록이 하단 로딩 상태를 표시한다.

## 검증 기준

- 데스크톱과 모바일에서 초기 목록이 50개 단위로 조회된다.
- 스크롤 하단 도달 시 다음 페이지가 추가된다.
- 현재까지 로드된 범위가 1초마다 다시 조회된다.
- `pnpm test:run`, `pnpm build`가 통과한다.

## 가정

- 현재 실행 중인 백엔드는 `start`와 `limit`를 정상 지원한다.
- 이번 단계에서는 백엔드 요청 수 최적화보다 동작 정확성을 우선한다.
- 이후 운영 최적화는 별도 전략 작업으로 분리한다.
