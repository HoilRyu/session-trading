# 대시보드 모바일 카드 와이어프레임 설계서

## 개요

- 작성일: 2026-03-18
- 대상 경로:
  - `frontend/src/pages/HomePage.tsx`
  - `frontend/src/features/dashboard/`
  - `frontend/src/features/navigation/navigationItems.ts`
- 목적: 현재 모바일에서 단순 플레이스홀더로 남아 있는 `대시보드` 탭을 카드뷰 중심의 모바일 와이어프레임으로 교체해, 데스크톱 대시보드와 같은 정보 흐름을 유지하면서도 모바일 탭 앱 구조에 맞는 세로 스캔 화면을 만든다.

## 목표

- 모바일 대시보드를 `데스크톱 축약형` 카드 와이어프레임으로 정의한다.
- 카드 안의 실제 데이터를 정하지 않은 상태에서도 `요약 -> 핵심 -> 비교/확장` 흐름이 읽혀야 한다.
- 현재 모바일 셸의 `앱바 + 콘텐츠 슬롯 + 하단 탭 + 더보기 패널` 구조를 유지해야 한다.
- 데스크톱 대시보드와 같은 카드 이름과 위계를 유지하되, 모바일에서는 세로 스크롤과 1열 중심 배치에 맞게 재구성해야 한다.

## 범위

- 모바일 `대시보드` 탭의 카드형 레이아웃 구조 정의
- 모바일 스크롤 정책 정의
- 모바일 카드 그룹과 배치 규칙 정의
- 데스크톱 대시보드와의 대응 관계 정의
- 구현 경계와 컴포넌트 구조 제안

## 비범위

- 데스크톱 대시보드 레이아웃 변경
- 카드 안의 실제 데이터 항목 확정
- 대시보드 API 연결
- 모바일 앱바, 하단 탭, 더보기 패널의 전역 구조 변경
- 가로 캐러셀, 스와이프 인터랙션, 신규 제스처 설계
- 투자 현황, 시세/차트, 설정의 모바일 구조 변경

## 현재 상태

- 모바일 전역 셸은 [HomePage.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/pages/HomePage.tsx) 안에서 `상단 앱바 -> 메인 콘텐츠 -> 하단 탭` 구조로 고정돼 있다.
- 현재 모바일 메인 콘텐츠는 `/market-chart`일 때만 [MarketChartMobileListLayout.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/features/market-chart/components/MarketChartMobileListLayout.tsx)를 렌더링하고, 나머지 라우트는 `콘텐츠 영역 - ...` 플레이스홀더 블록을 사용한다.
- 모바일 primary 탭 구성은 [navigationItems.ts](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/features/navigation/navigationItems.ts) 기준으로 `대시보드 / 투자 현황 / 시세 / 차트`이며, `설정`은 더보기 패널에 있다.
- 데스크톱 대시보드 방향은 [2026-03-18-dashboard-desktop-wireframe-design.md](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/docs/superpowers/specs/2026-03-18-dashboard-desktop-wireframe-design.md)에서 `요약 4 / 메인 1+2 / 비교 3 / 와이드 2` 구조로 이미 정의됐다.

## 구현 경계

- 모바일 대시보드는 [HomePage.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/pages/HomePage.tsx)의 모바일 콘텐츠 슬롯 안에서만 구현한다.
- 상단 앱바, 하단 탭, 더보기 패널 구조는 유지한다.
- `/market-chart`만 별도 모바일 레이아웃을 가지는 현재 패턴을 따라, `/dashboard`도 모바일에서만 별도 대시보드 레이아웃을 렌더링하는 분기를 추가하는 방향이 적합하다.
- 데스크톱 대시보드 구조는 유지하고, 모바일은 그 흐름을 축약해서 보여주는 별도 레이아웃으로 구현한다.
- [DashboardPage.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/pages/DashboardPage.tsx)는 데스크톱 전용 엔트리로 유지하고, 이번 모바일 설계의 수정 대상에서 제외한다.
- 즉, 모바일 `/dashboard` 렌더링은 `DashboardPage`와 분리해 `HomePage` 모바일 콘텐츠 슬롯 분기에서만 처리해야 한다.

## 설계 결정

### 1. 모바일 대시보드는 “데스크톱 축약형”으로 간다

모바일 대시보드는 데스크톱의 단순 축소판이 아니라, 데스크톱의 정보 위계를 유지한 채 모바일 세로 스캔 패턴으로 다시 배치한 화면으로 정의한다.

선택한 이유는 아래와 같다.

- 사용자에게 이미 익숙해진 데스크톱 대시보드의 카드 이름과 흐름을 유지할 수 있다.
- 모바일에서도 `대시보드 = 요약/판단`이라는 역할이 흐려지지 않는다.
- 완전히 다른 정보 구조를 만들지 않아도 돼서 이후 모바일 구현과 유지보수가 단순해진다.

### 2. 모바일은 “요약 우선”으로 시작한다

모바일에서 첫 화면 상단에는 `Summary 4개`가 먼저 보여야 한다. 그 아래에 `Primary Panel`이 오고, 이후 보조/비교/확장 카드가 이어지는 순서를 유지한다.

즉, 모바일의 첫 스캔 흐름은 아래와 같다.

- Summary 4개
- Primary Panel
- Side Panel A/B
- Compare A/B/C
- Wide Panel A/B

이 순서를 선택한 이유는 다음과 같다.

- 모바일 대시보드는 짧게 보고 이동하는 primary 탭 역할을 한다.
- 첫 화면에서 `요약 카드`가 먼저 보여야 대시보드 느낌이 살아난다.
- 대표 카드가 너무 먼저 오면 모바일에서는 “단일 상세 카드 화면”처럼 보일 위험이 있다.

### 3. 전체 구조는 1열 중심이지만 일부 비교 카드는 2열을 허용한다

모바일 권장 배치는 아래와 같다.

```text
Dashboard Mobile
├─ Summary Grid (2 x 2)
├─ Primary Panel
├─ Side Panel A
├─ Side Panel B
├─ Compare Row
│  ├─ Compare A
│  └─ Compare B
├─ Compare C
├─ Wide Panel A
└─ Wide Panel B
```

와이어프레임 예시는 아래와 같다.

```text
┌──────────────┬──────────────┐
│ Summary 01   │ Summary 02   │
├──────────────┼──────────────┤
│ Summary 03   │ Summary 04   │
└──────────────┴──────────────┘

┌──────────────────────────────┐
│ Primary Panel                │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Side Panel A                 │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Side Panel B                 │
└──────────────────────────────┘

┌──────────────┬──────────────┐
│ Compare A    │ Compare B    │
└──────────────┴──────────────┘

┌──────────────────────────────┐
│ Compare C                    │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Wide Panel A                 │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Wide Panel B                 │
└──────────────────────────────┘
```

이 구조의 의도는 아래와 같다.

- Summary는 모바일에서도 빠른 훑기에 적합하게 2x2로 묶는다.
- Primary는 대표 카드이므로 전체 폭을 사용한다.
- Side Panels는 Primary 아래에서 세로 스택으로 안정적으로 연결한다.
- Compare는 정보량이 너무 길지 않도록 상위 2개만 2열로 묶고, 나머지 1개는 전체 폭으로 내린다.
- Wide는 모바일에서는 세로 스택으로 마무리한다.

### 4. 모바일 스크롤은 “콘텐츠 슬롯 내부 스크롤”로 고정한다

모바일은 전체 페이지를 같이 스크롤하지 않고, 앱바와 하단 탭 사이의 콘텐츠 슬롯 안에서만 스크롤해야 한다.

정책:

- 상단 앱바는 고정
- 하단 탭은 고정
- 모바일 대시보드 콘텐츠 영역만 세로 스크롤
- `HomePage`의 `h-screen` 기반 셸은 유지

이 결정이 필요한 이유는 아래와 같다.

- 현재 모바일 앱 구조가 이미 탭 앱 형태로 고정돼 있다.
- 전체 페이지 스크롤로 바꾸면 앱바와 하단 탭의 역할이 흐려진다.
- `/market-chart` 모바일 레이아웃도 콘텐츠 슬롯 중심 구조와 잘 맞는다.

구현 시 원칙:

- 모바일 대시보드 루트는 `min-h-0 flex-1 overflow-y-auto` 계열 구조를 가져야 한다.
- 내부 카드 간격은 유지하되, 스크롤은 카드 내부가 아니라 콘텐츠 컬럼 전체에서 발생해야 한다.

### 5. 카드 위계는 유지하되 모바일 높이로 다시 최적화한다

모바일 카드도 데스크톱과 같은 공통 골격을 유지한다.

기본 카드 구조:

- 상단 라벨
- 중앙 본문 영역
- 하단 보조 영역

하지만 모바일에서는 아래처럼 높이를 해석한다.

- Summary: 낮고 빠르게 읽히는 비율
- Primary: 가장 크고 한 번에 시선이 모여야 하는 비율
- Side: Primary 아래에서 자연스럽게 이어지는 중간 높이
- Compare: 2열에서도 답답하지 않게 유지되는 낮은 중간 높이
- Wide: 긴 호흡의 정보 슬롯처럼 보이는 전체 폭 카드

즉 모바일은 카드 종류는 많아도, 읽는 리듬은 `짧게 -> 크게 -> 보조 -> 마무리`로 단순해야 한다.

모바일 권장 최소 높이는 아래처럼 고정한다.

- Summary: `min-h-[5.5rem]`
- Primary: `min-h-[11rem]`
- Side: `min-h-[6.5rem]`
- Compare: `min-h-[6rem]`
- Wide: `min-h-[6.5rem]`

이 수치는 모바일 테스트와 구현에서 공통 기준으로 사용한다.

### 6. 카드 라벨은 데스크톱과 같은 중립 라벨을 유지한다

모바일도 도메인 이름을 먼저 확정하지 않는다. 데스크톱과 같은 중립 라벨을 재사용한다.

권장 라벨:

- `Summary 01`
- `Summary 02`
- `Summary 03`
- `Summary 04`
- `Primary Panel`
- `Side Panel A`
- `Side Panel B`
- `Compare A`
- `Compare B`
- `Compare C`
- `Wide Panel A`
- `Wide Panel B`

이렇게 해야 데스크톱/모바일 대응 관계가 명확하게 유지된다.

### 7. 모바일은 데스크톱보다 단순하지만 카드 수는 유지한다

이번 단계에서는 모바일 카드 수를 줄이지 않는다. 대신 레이아웃만 세로 스캔 중심으로 바꾼다.

즉:

- 데스크톱의 `4 / 1+2 / 3 / 2` 흐름 유지
- 모바일에서는 `2x2 / 1 / 1 / 2 / 1 / 1 / 1` 수준으로 재배치
- 카드 삭제나 통합은 하지 않음

이 결정은 “나중에 필요하면 더 단순화”할 수는 있지만, 현재 단계에서는 데스크톱과 모바일의 정보 구조를 먼저 맞추는 쪽이 더 안정적이기 때문이다.

### 8. 시각 규칙은 데스크톱과 같은 톤을 유지하되 밀도를 낮춘다

모바일은 데스크톱보다 카드 간격과 패딩이 조금 더 촘촘해질 수 있지만, 전체 톤은 유지해야 한다.

권장 시각 규칙:

- `slate` 중심 중성 톤 유지
- 큰 라운드 카드 유지
- Primary 카드만 다크 톤 강조 가능
- Summary/Side/Compare/Wide는 밝은 카드층 사용
- 강한 테두리보다 얕은 보더와 부드러운 그림자 사용

즉 모바일은 새로운 스타일을 만드는 것이 아니라, 데스크톱 대시보드 톤을 작은 화면용으로 정리하는 작업이어야 한다.

## 컴포넌트 구조 제안

권장 구조:

```text
frontend/src/features/dashboard/
├─ components/
│  ├─ DashboardDesktopLayout.tsx
│  ├─ DashboardMobileLayout.tsx
│  └─ DashboardWireframeCard.tsx
└─ constants/
   ├─ dashboardWireframe.ts
   └─ dashboardMobileWireframe.ts
```

역할:

- `DashboardMobileLayout`
  - 모바일 카드 배치와 스크롤 컨테이너 조립
- `DashboardWireframeCard`
  - 데스크톱/모바일 공통 카드 표현 재사용
- `dashboardWireframe.ts`
  - 공통 카드 라벨, ID, tone 같은 공통 메타데이터 재사용
- `dashboardMobileWireframe.ts`
  - 모바일 전용 카드 순서, 그룹 배치, 최소 높이 정의

즉:

- 공통 파일은 `라벨/ID/톤`까지만 공유
- 모바일 전용 파일은 `모바일 순서/높이`
- 데스크톱 전용 배치와 높이는 데스크톱 구현 쪽 책임

이번 모바일 설계는 데스크톱과 공통 라벨과 카드 뼈대를 공유하되, 배치와 높이까지 한 파일에 과하게 묶지 않는 것이 핵심이다.

## 상태와 데이터 흐름

이번 단계에서 모바일 대시보드는 실제 데이터를 소유하지 않는다. 따라서 초기 구현은 정적인 와이어프레임 렌더링으로 시작한다.

초기 흐름:

```text
HomePage 모바일 렌더링
→ 현재 경로가 /dashboard 인지 확인
→ DashboardMobileLayout 렌더링
→ 고정된 카드 메타데이터 순회
→ 콘텐츠 슬롯 내부에서 세로 스크롤
```

중요한 점:

- 데스크톱은 `DashboardPage`가 직접 레이아웃을 렌더링할 수 있지만
- 모바일은 `HomePage`가 콘텐츠 슬롯을 직접 제어하므로
- `/dashboard` 모바일 분기는 `HomePage` 안에서 처리하는 것이 자연스럽다
- `DashboardPage`에 모바일 조건 분기를 추가하지 않는다

## 검증 기준

모바일 와이어프레임 구현이 완료되면 아래 조건을 만족해야 한다.

- 모바일에서 `Summary 4개`가 첫 구역에 2x2로 보여야 한다.
- `Primary Panel`은 Summary 아래에 전체 폭으로 보여야 한다.
- `Side Panel A/B`는 Summary 아래에서 세로 스택으로 보여야 한다.
- `Compare A/B`는 2열, `Compare C`는 전체 폭으로 보여야 한다.
- `Wide Panel A/B`는 하단에서 세로 스택으로 보여야 한다.
- `Summary`는 `min-h-[5.5rem]`, `Primary`는 `min-h-[11rem]`, `Side`는 `min-h-[6.5rem]`, `Compare`는 `min-h-[6rem]`, `Wide`는 `min-h-[6.5rem]`를 가져야 한다.
- 앱바와 하단 탭은 유지되고, 대시보드 콘텐츠만 내부 스크롤해야 한다.
- `/market-chart` 모바일 레이아웃과 충돌하지 않아야 한다.

## 향후 확장 메모

- 실제 데이터가 정해지면 카드 라벨을 도메인 이름으로 바꾼다.
- 필요하면 이후 단계에서 모바일 카드 수를 줄이거나 더 단순화할 수 있다.
- 하지만 이번 단계에서는 데스크톱과 모바일의 정보 흐름 대응 관계를 먼저 맞추는 것이 우선이다.
