# 시세 차트 마켓 목록 UI 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 `시세 / 차트`의 오른쪽 마켓 목록 영역을 업비트 근접형 고밀도 리스트 패널로 바꿔, 현재는 정적인 목업 데이터로 구조를 확인할 수 있게 만들기

**Architecture:** 마켓 목록은 `행 컴포넌트`와 `패널 컴포넌트`로 분리하고, 현재 단계에서는 백엔드 API 대신 전용 목업 데이터 파일을 사용한다. 표시 규칙은 행 컴포넌트 안에 고정해 `display_name_ko -> display_name_en -> base_asset` 우선순위와 `base_asset/quote_asset` 심볼 조합을 테스트로 먼저 잠근다. 데스크톱 레이아웃은 기존 차트 중심 구조를 유지한 채 오른쪽 플레이스홀더만 새 패널로 교체한다.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## 파일 구조

- Create: `frontend/src/features/market-chart/marketList.types.ts`
  - 마켓 목록 목업과 컴포넌트가 함께 쓰는 타입만 정의한다.
- Create: `frontend/src/features/market-chart/mockMarketListItems.ts`
  - 현재 단계에서 사용할 데스크톱 마켓 목록 목업 데이터를 정의한다.
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListRow.tsx`
  - 단일 마켓 행 렌더링과 이름/심볼 표시 규칙을 담당한다.
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListRow.test.tsx`
  - 표시 우선순위와 선택 상태를 검증한다.
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`
  - 상단 탭, 컬럼 헤더, 스크롤 리스트 조합만 담당한다.
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`
  - 탭, 헤더, 리스트 구조를 검증한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
  - 오른쪽 `마켓 목록 영역` 플레이스홀더를 새 패널 컴포넌트로 교체한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
  - 플레이스홀더 대신 실제 패널 UI가 렌더링되는지 검증한다.
- Modify: `frontend/src/app/App.test.tsx`
  - 데스크톱 `시세 / 차트` 화면에서 새 마켓 목록 패널이 보이는지 검증한다.

## Chunk 1: 마켓 목록 행 표시 규칙 고정

### Task 1: 단일 행 컴포넌트 TDD

**Files:**
- Create: `frontend/src/features/market-chart/marketList.types.ts`
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListRow.test.tsx`
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListRow.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`MarketChartMarketListRow` 테스트에서 아래를 검증한다.

- `display_name_ko`가 있으면 1줄째에 한글명이 보인다.
- `display_name_ko`가 없고 `display_name_en`만 있으면 영문명이 보인다.
- 둘 다 없으면 `base_asset`가 보인다.
- 2줄째 심볼은 항상 `base_asset/quote_asset` 형식으로 보인다.
- 선택된 행은 `data-selected=\"true\"`와 연한 배경 클래스가 적용된다.

예시 골격:

```tsx
import { render, screen } from '@testing-library/react'

import { MarketChartMarketListRow } from './MarketChartMarketListRow'

describe('MarketChartMarketListRow', () => {
  it('종목명 우선순위와 심볼 줄을 렌더링한다', () => {
    render(
      <MarketChartMarketListRow
        item={{
          marketListingId: 1,
          baseAsset: 'BTC',
          quoteAsset: 'KRW',
          displayNameKo: '비트코인',
          displayNameEn: 'Bitcoin',
          tradePrice: '109,131,000',
          changeRate: '-0.84%',
          volumeText: '422,181백만',
        }}
        isSelected
      />,
    )

    expect(screen.getByText('비트코인')).toBeInTheDocument()
    expect(screen.getByText('BTC/KRW')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListRow.test.tsx`  
Expected: 컴포넌트 또는 타입 파일이 없어 실패

- [ ] **Step 3: 최소 구현 작성**

구현 내용:

- `marketList.types.ts`에 행 렌더링용 타입을 정의한다.
- `MarketChartMarketListRow.tsx`에 단일 행 컴포넌트를 추가한다.
- 종목명은 `displayNameKo ?? displayNameEn ?? baseAsset` 순서로 계산한다.
- 심볼은 `${baseAsset}/${quoteAsset}` 형식으로 표시한다.
- 선택 상태는 `data-selected`와 연한 배경 클래스로 표현한다.
- 숫자 컬럼은 오른쪽 정렬하고, 이름 영역은 2줄 구조로 둔다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListRow.test.tsx`  
Expected: 해당 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/marketList.types.ts frontend/src/features/market-chart/components/MarketChartMarketListRow.tsx frontend/src/features/market-chart/components/MarketChartMarketListRow.test.tsx
git commit -m "feat(front): 시세 차트 마켓 목록 행 컴포넌트 추가"
```

## Chunk 2: 마켓 목록 패널 조합

### Task 2: 탭, 헤더, 스크롤 리스트 패널 추가

**Files:**
- Create: `frontend/src/features/market-chart/mockMarketListItems.ts`
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`
- Create: `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`MarketChartMarketListPanel` 테스트에서 아래를 검증한다.

- 상단 탭이 `원화`, `BTC`, `USDT` 3개만 보인다.
- 컬럼 헤더가 `종목명`, `현재가`, `전일대비`, `거래대금`으로 보인다.
- 리스트 컨테이너가 독립 스크롤(`overflow-y-auto`) 구조를 가진다.
- 전달한 아이템 수만큼 `MarketChartMarketListRow`가 렌더링된다.
- 선택된 항목이 하나 보인다.

예시 골격:

```tsx
import { render, screen } from '@testing-library/react'

import { MarketChartMarketListPanel } from './MarketChartMarketListPanel'

describe('MarketChartMarketListPanel', () => {
  it('탭, 헤더, 리스트를 렌더링한다', () => {
    render(
      <MarketChartMarketListPanel
        activeQuote="KRW"
        selectedMarketId={1}
        items={[/* 테스트용 2개 아이템 */]}
      />,
    )

    expect(screen.getByRole('tab', { name: '원화' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'BTC' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'USDT' })).toBeInTheDocument()
    expect(screen.getByText('종목명')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`  
Expected: 패널 컴포넌트가 없어 실패

- [ ] **Step 3: 최소 구현 작성**

구현 내용:

- `mockMarketListItems.ts`에 현재 데스크톱 패널에서 쓸 정적 아이템 목록을 만든다.
- `MarketChartMarketListPanel.tsx`에 상단 탭, 컬럼 헤더, 스크롤 리스트를 추가한다.
- 현재 활성 탭은 `KRW`만 고정해도 된다.
- 탭은 실제 인터랙션 없이 표시만 하고, `aria-selected`로 활성 상태를 드러낸다.
- 리스트는 `MarketChartMarketListRow`를 재사용해 렌더링한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`  
Expected: 해당 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/mockMarketListItems.ts frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx
git commit -m "feat(front): 시세 차트 마켓 목록 패널 추가"
```

## Chunk 3: 데스크톱 레이아웃에 연결

### Task 3: 오른쪽 마켓 목록 플레이스홀더 교체

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 기존 테스트를 먼저 갱신**

`MarketChartDesktopLayout.test.tsx`와 `App.test.tsx`에서 기존 `마켓 목록 영역` 플레이스홀더 텍스트 대신 실제 패널 UI를 검증하도록 바꾼다.

검증 포인트:

- `원화`, `BTC`, `USDT` 탭이 보인다.
- `종목명`, `현재가`, `전일대비`, `거래대금` 헤더가 보인다.
- 샘플 종목 예를 들어 `비트코인`, `BTC/KRW`가 보인다.
- 선택된 행이 하나 렌더링된다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`  
Expected: 아직 플레이스홀더가 남아 있어 탭/헤더 검증이 실패

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: 데스크톱 `시세 / 차트` 라우팅 테스트가 새 패널 검증에서 실패

- [ ] **Step 3: 최소 구현 작성**

구현 내용:

- `MarketChartDesktopLayout.tsx`에서 오른쪽 `마켓 목록 영역` 블록을 제거한다.
- 대신 `MarketChartMarketListPanel`을 렌더링한다.
- 목업 데이터와 기본 선택 마켓은 데스크톱 레이아웃에서 전달한다.
- 왼쪽 차트/상단 정보 영역과 전체 비율은 그대로 유지한다.

- [ ] **Step 4: 테스트 재실행**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`  
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
git add frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx frontend/src/app/App.test.tsx
git commit -m "feat(front): 시세 차트 데스크톱 마켓 목록 연결"
```

## 완료 기준

- 데스크톱 `시세 / 차트` 오른쪽 패널이 고밀도 리스트형 마켓 목록으로 보인다.
- 상단 탭은 `원화 / BTC / USDT`만 보인다.
- 컬럼 헤더는 `종목명 / 현재가 / 전일대비 / 거래대금`으로 표시된다.
- 각 행은 `종목명 1줄 + 심볼 1줄 + 숫자 컬럼 3개` 구조를 가진다.
- 선택된 행은 전체 연한 배경으로 강조된다.
- `pnpm test:run`, `pnpm build`가 모두 통과한다.
