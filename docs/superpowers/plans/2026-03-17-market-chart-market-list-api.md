# 시세 차트 마켓 목록 API 연결 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 `시세 / 차트` 오른쪽 패널과 모바일 `/market-chart` 목록 화면을 실제 `GET /api/v1/markets` 응답으로 렌더링하고, `원화 / BTC / USDT` 탭 전환과 로딩/에러 상태를 처리하기

**Architecture:** 백엔드 URL 조합은 기존 `backend.ts`를 확장하고, `features/market-chart` 아래에 API 응답 타입, 응답 변환기, 공용 조회 훅을 분리한다. 데스크톱과 모바일은 같은 조회 훅을 공유하되, 데스크톱만 `BTC/KRW` 기본 선택 규칙을 적용하고 모바일은 선택 상태 없이 목록만 렌더링한다.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library, Vite Fetch API

---

## 파일 구조

- Create: `frontend/src/features/market-chart/api/marketList.types.ts`
  - 백엔드 `GET /api/v1/markets` 응답 타입과 프론트 조회 파라미터 타입을 정의한다.
- Create: `frontend/src/features/market-chart/api/marketListMapper.ts`
  - API 응답 item을 기존 `MarketChartMarketListItem` UI 구조로 변환하고 숫자 문자열을 표시용 텍스트로 포맷한다.
- Create: `frontend/src/features/market-chart/api/marketListMapper.test.ts`
  - 이름 fallback, 심볼 조합, 가격/등락률/거래대금 포맷을 검증한다.
- Create: `frontend/src/features/market-chart/hooks/useMarketList.ts`
  - `exchange`, `quote`, `limit`를 받아 목록 조회와 로딩/에러 상태를 관리한다.
- Create: `frontend/src/features/market-chart/hooks/useMarketList.test.tsx`
  - 성공, 실패, 탭 변경 재조회, 기본 선택 마켓 계산을 검증한다.
- Modify: `frontend/src/config/backend.ts`
  - `getMarketsUrl` 같은 마켓 목록 URL 조합 함수를 추가한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`
  - 목업 데이터 대신 조회 훅 결과를 렌더링할 수 있도록 인터페이스를 확장한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`
  - 로딩, 에러, 탭 전환, 실제 데이터 렌더링 기준으로 테스트를 확장한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
  - 목업 데이터 제거, 조회 훅 연결, `BTC/KRW` 기본 선택 규칙 적용.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
  - 실제 데이터 로딩 이후 패널 렌더링과 기본 선택 행을 검증한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`
  - 모바일 `/market-chart`에서도 같은 조회 훅 결과로 목록을 렌더링한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
  - 모바일 목록의 로딩/에러/실데이터 렌더링을 검증한다.
- Modify: `frontend/src/app/App.test.tsx`
  - 데스크톱/모바일 라우팅에서 실제 API 기반 마켓 목록이 보이는지 검증한다.

## Chunk 1: API 타입과 변환 규칙 고정

### Task 1: 응답 타입과 mapper TDD

**Files:**
- Create: `frontend/src/features/market-chart/api/marketList.types.ts`
- Create: `frontend/src/features/market-chart/api/marketListMapper.ts`
- Create: `frontend/src/features/market-chart/api/marketListMapper.test.ts`

- [ ] **Step 1: 실패하는 mapper 테스트 작성**

아래를 검증하는 테스트를 작성한다.

- `display_name_ko`가 있으면 종목명으로 사용한다.
- `display_name_ko`가 없으면 `display_name_en`, 그것도 없으면 `base_asset`를 사용한다.
- 심볼은 `base_asset/quote_asset` 형식으로 변환된다.
- `trade_price`는 천 단위 구분이 들어간 문자열로 포맷된다.
- `signed_change_rate`는 백분율 문자열로 포맷된다.
- `acc_trade_volume_24h`는 현재 단계용 거래대금 문자열로 변환된다.

예시:

```ts
import { mapMarketListItem } from './marketListMapper'

describe('mapMarketListItem', () => {
  it('API 응답을 UI 아이템으로 변환한다', () => {
    const item = mapMarketListItem({
      market_listing_id: 1,
      exchange: 'upbit',
      raw_symbol: 'KRW-BTC',
      base_asset: 'BTC',
      quote_asset: 'KRW',
      display_name_ko: '비트코인',
      display_name_en: 'Bitcoin',
      has_warning: false,
      trade_price: '109131000.00000000',
      signed_change_rate: '-0.0084',
      acc_trade_volume_24h: '422181000.00000000',
      event_time: null,
    })

    expect(item.displayNameKo).toBe('비트코인')
    expect(item.tradePrice).toBe('109,131,000')
    expect(item.changeRate).toContain('%')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/api/marketListMapper.test.ts`  
Expected: mapper 파일이 없어 실패

- [ ] **Step 3: 최소 구현 작성**

구현 내용:

- `marketList.types.ts`에 `MarketListApiItem`, `MarketListApiResponse`, `MarketListQueryParams`를 정의한다.
- `marketListMapper.ts`에 `mapMarketListItem`, `mapMarketListResponse`를 추가한다.
- 이름 fallback과 심볼 조합 규칙을 구현한다.
- 숫자 문자열 포맷은 현재 요구 범위만 충족하는 최소 함수로 작성한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/api/marketListMapper.test.ts`  
Expected: mapper 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/api/marketList.types.ts frontend/src/features/market-chart/api/marketListMapper.ts frontend/src/features/market-chart/api/marketListMapper.test.ts
git commit -m "feat(front): 시세 차트 마켓 목록 API 변환기 추가"
```

## Chunk 2: 공용 조회 훅과 백엔드 URL 연결

### Task 2: `useMarketList`와 `getMarketsUrl` 추가

**Files:**
- Create: `frontend/src/features/market-chart/hooks/useMarketList.ts`
- Create: `frontend/src/features/market-chart/hooks/useMarketList.test.tsx`
- Modify: `frontend/src/config/backend.ts`

- [ ] **Step 1: 실패하는 훅 테스트 작성**

아래를 검증한다.

- 기본 조회 시 `exchange=upbit`, `quote=KRW`, `limit=50`으로 호출한다.
- 성공 응답이면 변환된 items와 `loading=false`가 된다.
- 실패 응답이면 `error`가 채워진다.
- `quote`가 바뀌면 다시 조회한다.
- 데스크톱 기본 선택용 helper가 `BTC/KRW`를 우선 선택한다.

예시:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { useMarketList } from './useMarketList'

describe('useMarketList', () => {
  it('KRW 목록을 조회한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ start: 0, limit: 50, total: 1, refreshed_at: '2026-03-17T12:00:00Z', items: [] }),
    }))

    const { result } = renderHook(() => useMarketList({ quote: 'KRW' }))

    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/hooks/useMarketList.test.tsx`  
Expected: 훅 또는 URL 함수 미구현으로 실패

- [ ] **Step 3: 최소 구현 작성**

구현 내용:

- `backend.ts`에 `getMarketsUrl(params)`를 추가한다.
- `useMarketList.ts`에서 `fetch(getMarketsUrl(...))`를 호출한다.
- `loading`, `error`, `items`, `refetch`를 반환한다.
- 응답은 `marketListMapper`를 통해 변환한다.
- 기본 선택 계산 helper를 훅 내부 또는 같은 파일에 추가한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/hooks/useMarketList.test.tsx`  
Expected: 훅 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/config/backend.ts frontend/src/features/market-chart/hooks/useMarketList.ts frontend/src/features/market-chart/hooks/useMarketList.test.tsx
git commit -m "feat(front): 시세 차트 마켓 목록 조회 훅 추가"
```

## Chunk 3: 데스크톱/모바일 UI 연결

### Task 3: 데스크톱 패널과 모바일 목록에 실제 API 적용

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 실패하는 UI 테스트 갱신**

테스트에서 아래를 먼저 고정한다.

- 데스크톱 패널은 로딩 상태를 보여준다.
- 조회 성공 후 실제 종목명이 렌더링된다.
- 데스크톱은 `BTC/KRW` 행이 기본 선택된다.
- 탭 클릭 시 `quote`가 바뀌고 새로운 요청이 나간다.
- 모바일 `/market-chart`도 같은 데이터로 목록을 보여준다.
- 실패 시 에러 문구와 재시도 버튼이 보인다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`  
Expected: 현재 패널이 정적 데이터 전제라 상태 검증에서 실패

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`  
Expected: 모바일 목록이 아직 플레이스홀더라 실패

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: 앱 라우팅 테스트가 실데이터 검증에서 실패

- [ ] **Step 3: 최소 구현 작성**

구현 내용:

- `MarketChartMarketListPanel.tsx`를 프레젠테이션 컴포넌트로 유지하되, `activeQuote`, `onQuoteChange`, `items`, `loading`, `error`, `onRetry`, `selectedMarketId`를 받도록 확장한다.
- `MarketChartDesktopLayout.tsx`에서 `useMarketList`를 사용하고 `BTC/KRW` 기본 선택을 적용한다.
- `MarketChartMobileListLayout.tsx`도 같은 훅을 사용하되 `selectedMarketId`는 넘기지 않는다.
- 로딩/에러/빈 결과 UI는 목록 영역 내부에서만 렌더링한다.
- 탭 클릭 시 `quote` 상태를 바꾸고 재조회한다.

- [ ] **Step 4: 테스트 재실행**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`  
Expected: 통과

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx`  
Expected: 통과

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: 통과

- [ ] **Step 5: 전체 검증**

Run: `pnpm test:run`  
Expected: 전체 테스트 통과

Run: `pnpm build`  
Expected: 빌드 통과

- [ ] **Step 6: 커밋**

```bash
git add frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx frontend/src/features/market-chart/components/MarketChartMobileListLayout.test.tsx frontend/src/app/App.test.tsx
git commit -m "feat(front): 시세 차트 마켓 목록 API 연결"
```

## 완료 기준

- 데스크톱 `시세 / 차트` 오른쪽 패널이 실제 `/api/v1/markets` 응답으로 렌더링된다.
- 모바일 `/market-chart`도 같은 API로 실제 목록을 렌더링한다.
- `원화 / BTC / USDT` 탭 전환 시 실제 `quote` 쿼리가 바뀐다.
- 데스크톱은 `BTC/KRW`를 기본 선택하고 모바일은 선택 상태를 두지 않는다.
- 로딩 / 에러 / 빈 결과가 목록 영역 안에서 처리된다.
- `pnpm test:run`, `pnpm build`가 모두 통과한다.
