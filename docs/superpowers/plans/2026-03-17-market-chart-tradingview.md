# 시세 차트 데스크톱 TradingView 위젯 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 데스크톱 `시세 / 차트`의 차트 영역에 `UPBIT:BTCKRW` 고정 TradingView 위젯을 실제로 렌더링하기

**Architecture:** TradingView 스크립트 주입과 위젯 컨테이너 마운트는 `TradingViewAdvancedChart` 전용 컴포넌트로 분리한다. `MarketChartDesktopLayout`는 차트 플레이스홀더 대신 해당 컴포넌트를 렌더링하고, 테스트는 외부 차트 렌더링이 아니라 스크립트 삽입과 설정 문자열이 맞는지 검증한다.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library, TradingView Widget

---

## 파일 구조

- Create: `frontend/src/features/market-chart/components/TradingViewAdvancedChart.tsx`
  - TradingView 위젯 컨테이너와 스크립트 주입만 담당한다.
- Create: `frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx`
  - 스크립트 생성과 `UPBIT:BTCKRW` 설정을 검증한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
  - 차트 플레이스홀더를 전용 TradingView 컴포넌트로 교체한다.
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
  - `차트 영역` 텍스트 대신 차트 컨테이너가 렌더링되는지 검증한다.
- Modify: `frontend/src/app/App.test.tsx`
  - 데스크톱 `시세 / 차트` 화면에서 차트 영역이 여전히 노출되는지 테스트를 조정한다.

## Chunk 1: TradingView 전용 컴포넌트 추가

### Task 1: 위젯 스크립트 주입 컴포넌트 TDD

**Files:**
- Create: `frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx`
- Create: `frontend/src/features/market-chart/components/TradingViewAdvancedChart.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

아래를 검증하는 테스트를 작성한다.

- 차트 컨테이너가 렌더링된다.
- `script` 엘리먼트가 생성된다.
- 스크립트 내용에 `UPBIT:BTCKRW`가 포함된다.
- 스크립트 `src`가 TradingView 공식 위젯 경로다.

예시:

```tsx
import { render, screen } from '@testing-library/react'

import { TradingViewAdvancedChart } from './TradingViewAdvancedChart'

describe('TradingViewAdvancedChart', () => {
  it('UPBIT:BTCKRW 위젯 스크립트를 주입한다', () => {
    render(<TradingViewAdvancedChart />)

    expect(screen.getByTestId('tradingview-chart-container')).toBeInTheDocument()

    const script = document.querySelector(
      'script[src=\"https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js\"]',
    )

    expect(script).not.toBeNull()
    expect(script?.textContent).toContain('UPBIT:BTCKRW')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx`  
Expected: 컴포넌트 파일이 없어 실패

- [ ] **Step 3: 최소 구현 작성**

전용 컴포넌트를 추가한다.

구현 원칙:
- `useEffect`에서 TradingView 스크립트를 생성해 컨테이너에 삽입한다.
- 스크립트 경로는 공식 `embed-widget-advanced-chart.js`를 사용한다.
- 설정은 `UPBIT:BTCKRW` 고정이다.
- 테스트 가능하도록 바깥 컨테이너에 `data-testid`를 둔다.
- 언마운트 시 컨테이너를 비운다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx`  
Expected: 해당 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/features/market-chart/components/TradingViewAdvancedChart.tsx frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx
git commit -m "feat(front): 시세 차트 TradingView 위젯 컴포넌트 추가"
```

## Chunk 2: 데스크톱 차트 영역 연결

### Task 2: `MarketChartDesktopLayout`에 TradingView 적용

**Files:**
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
- Modify: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: 기존 테스트를 먼저 갱신**

`MarketChartDesktopLayout.test.tsx`와 `App.test.tsx`에서 더 이상 `차트 영역` 텍스트를 직접 찾지 않고, 아래를 검증하도록 바꾼다.

- `TradingViewAdvancedChart` 컨테이너가 렌더링된다.
- `거래소 선택 + 현재가/요약 정보 영역`
- `마켓 목록 영역`

예시:

```tsx
expect(screen.getByTestId('tradingview-chart-container')).toBeInTheDocument()
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test:run -- frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`  
Expected: 아직 차트 플레이스홀더가 남아 있어 새 검증이 실패

Run: `pnpm test:run -- frontend/src/app/App.test.tsx`  
Expected: 데스크톱 `시세 / 차트` 라우팅 검증이 실패

- [ ] **Step 3: 최소 구현 작성**

`MarketChartDesktopLayout.tsx`에서 `차트 영역` 플레이스홀더를 `TradingViewAdvancedChart`로 교체한다.

구현 원칙:
- 차트 칸 높이와 배경 컨테이너는 유지
- 내부에 위젯 컴포넌트가 꽉 차게 렌더링
- 상단 정보 영역과 마켓 목록 영역은 유지

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
git commit -m "feat(front): 시세 차트 데스크톱 TradingView 위젯 연결"
```

## 완료 기준

- 데스크톱 `/market-chart`에서 TradingView 차트가 보인다.
- 위젯 심볼은 `UPBIT:BTCKRW`로 고정된다.
- 상단 정보 영역과 마켓 목록 영역은 기존 그대로 유지된다.
- 모바일 `/market-chart` 목록 화면은 그대로 유지된다.
- `pnpm test:run`, `pnpm build`가 모두 통과한다.
