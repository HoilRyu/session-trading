# 대시보드 데스크톱 카드 와이어프레임 설계서

## 개요

- 작성일: 2026-03-18
- 대상 경로:
  - `frontend/src/pages/DashboardPage.tsx`
  - `frontend/src/features/navigation/DesktopRouteContent.tsx`
  - `frontend/src/features/dashboard/`
- 목적: 현재 플레이스홀더 상태인 `대시보드` 탭을 카드뷰 중심의 데스크톱 와이어프레임으로 교체해, 이후 실제 데이터와 기능을 얹기 전에도 정보 위계와 영역 구조가 읽히는 화면을 만든다.

## 목표

- 데스크톱 대시보드를 `카드 영역 구분` 중심의 와이어프레임으로 정의한다.
- 카드 안의 실제 콘텐츠를 확정하지 않은 상태에서도, 화면만 보고 `어디가 요약`, `어디가 핵심`, `어디가 보조`인지 읽히게 해야 한다.
- 현재 앱 셸과 충돌하지 않도록 좌측 사이드바는 유지하고, 우측 콘텐츠 영역 안에서만 구조를 재구성해야 한다.
- 이후 실제 데이터가 정해졌을 때 카드 이름과 내부 구성만 구체화하면 되도록, 중립적인 카드 라벨과 재사용 가능한 카드 규칙을 정의한다.

## 범위

- 데스크톱 `대시보드` 페이지의 카드형 레이아웃 구조 정의
- 카드 크기 위계와 그룹 배치 정의
- 카드 공통 구조 규칙 정의
- 와이어프레임용 중립 라벨 정의
- 기본 시각 규칙 정의

## 비범위

- 모바일 대시보드 레이아웃 설계
- 카드 안의 실제 데이터 항목 확정
- 백엔드 API 연결
- 차트, 투자 현황, 설정 탭의 정보 구조 변경
- 대시보드용 신규 상호작용 설계
- 전역 테마 시스템 개편

## 현재 상태

- 루트 라우팅은 [router.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/app/router.tsx)에서 `/dashboard`를 자식 라우트로 가진다.
- 현재 [DashboardPage.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/pages/DashboardPage.tsx)는 [DesktopRouteContent.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/features/navigation/DesktopRouteContent.tsx)를 그대로 사용한다.
- [DesktopRouteContent.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/features/navigation/DesktopRouteContent.tsx)는 `상단 영역 - 대시보드`, `콘텐츠 영역 - 대시보드` 두 개의 단순 플레이스홀더 블록만 렌더링한다.
- 현재 프로젝트의 데스크톱 셸은 [HomePage.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/pages/HomePage.tsx) 기준으로 `좌측 사이드바 + 우측 콘텐츠` 구조를 사용한다.

## 구현 경계

- 이번 구현에서 [DashboardPage.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/pages/DashboardPage.tsx)는 더 이상 [DesktopRouteContent.tsx](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/frontend/src/features/navigation/DesktopRouteContent.tsx)를 사용하지 않는다.
- `DesktopRouteContent`는 다른 플레이스홀더 페이지용 공용 블록으로 그대로 유지한다.
- 대시보드 전용 와이어프레임은 별도 `DashboardDesktopLayout` 계열 컴포넌트가 직접 렌더링한다.
- 즉, 공용 플레이스홀더 책임과 대시보드 실제 UI 책임을 분리하는 것이 이번 설계의 명시적 결정이다.

## 설계 결정

### 1. 대시보드는 “내용 확정 전 와이어프레임” 단계로 설계한다

이번 단계에서는 대시보드 안에 어떤 데이터를 넣을지 결정하지 않는다. 대신 카드의 위치, 크기, 위계만으로 화면 구조를 먼저 확정한다.

이 방향이 필요한 이유는 아래와 같다.

- 현재 대시보드는 사실상 빈 상태라, 정보 구조를 먼저 잡는 편이 구현 리스크가 낮다.
- 이후 실제 콘텐츠가 바뀌더라도 카드 레이아웃은 재사용할 가능성이 높다.
- `대시보드 = 요약/판단`, `시세 / 차트 = 탐색/분석`, `투자 현황 = 상태/성과`의 역할 분리를 유지하기 쉽다.

### 2. 전역 셸은 유지하고 우측 콘텐츠 영역만 재구성한다

대시보드는 새로운 전체 화면을 만들지 않는다. 기존 데스크톱 셸을 유지한 채, 우측 콘텐츠 영역 안에서만 카드 구조를 배치한다.

즉:

- 좌측 사이드바 유지
- `/dashboard` 라우트 유지
- 대시보드 내부 콘텐츠만 카드형 구조로 교체

이렇게 해야 다른 탭과의 구조 일관성이 유지되고, 구현 범위도 명확하게 닫힌다.

### 3. 전체 구조는 “균형형 + 비대칭 메인 강조”로 고정한다

검토한 방향 중 최종 선택은 `균형형`이며, 중단 핵심 구역은 `비대칭 유지`로 확정한다.

핵심 원칙:

- 상단은 빠르게 훑는 요약 영역이어야 한다.
- 중단에는 시선이 가장 먼저 머무는 대표 구역이 있어야 한다.
- 하단으로 갈수록 비교형 또는 확장형 카드가 자연스럽게 이어져야 한다.

따라서 전체 구조는 아래와 같이 정의한다.

```text
Dashboard
├─ Header
├─ Summary Cards (4)
├─ Main Section
│  ├─ Primary Panel
│  └─ Side Panels (2 stacked)
├─ Compare Cards (3)
└─ Wide Panels (2)
```

### 4. 데스크톱 레이아웃 배치는 아래 순서를 따른다

권장 와이어프레임 배치는 아래와 같다.

```text
┌──────────────────────────────────────────────────────────────┐
│ Dashboard Header                                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Summary 01   │ Summary 02   │ Summary 03   │ Summary 04   │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌──────────────────────────────────────┬───────────────────────┐
│ Primary Panel                        │ Side Panel A          │
│                                      ├───────────────────────┤
│                                      │ Side Panel B          │
└──────────────────────────────────────┴───────────────────────┘

┌───────────────────┬───────────────────┬──────────────────────┐
│ Compare A         │ Compare B         │ Compare C            │
└───────────────────┴───────────────────┴──────────────────────┘

┌──────────────────────────────┬───────────────────────────────┐
│ Wide Panel A                 │ Wide Panel B                  │
└──────────────────────────────┴───────────────────────────────┘
```

레이아웃 의도는 아래와 같다.

- 헤더는 페이지 제목과 향후 보조 액션이 들어갈 얕은 상단 띠 역할을 한다.
- Summary Cards는 짧게 읽고 넘어가는 요약 정보 슬롯이다.
- Primary Panel은 대시보드의 대표 영역으로, 시선이 가장 먼저 모여야 한다.
- Side Panels는 핵심 영역 옆에서 보완 정보를 받는 위치다.
- Compare Cards는 나란히 비교해야 하는 정보에 적합한 구역이다.
- Wide Panels는 가로로 넓게 써야 하는 정보 또는 로그형 정보에 적합한 구역이다.

### 5. 비율은 균형형이지만 메인 구역이 분명히 커야 한다

세부 구현 수치는 변경될 수 있지만, 아래 비율 원칙은 유지한다.

- Header: 낮고 넓은 1행
- Summary Cards: 4등분
- Main Section: `1.6fr / 0.9fr` 수준의 좌우 비율
- Compare Cards: 3등분
- Wide Panels: 2등분

이 비율이 필요한 이유는 아래와 같다.

- Summary 영역은 수평 훑기에 적합해야 하므로 과도하게 높아지면 안 된다.
- Main Section은 대표 카드가 분명히 커야 대시보드 중심축이 생긴다.
- 하단 카드들은 메인보다 덜 강하지만, 너무 작으면 실제 확장 시 활용도가 떨어진다.

### 5-1. 데스크톱 대시보드는 세로 스크롤을 허용한다

이번 구조는 `4 / 1+2 / 3 / 2`의 다단 카드 구성이므로, 한 화면 고정형보다 `세로 스크롤 허용`이 더 적합하다.

정책:

- 우측 콘텐츠 영역은 자연 높이로 확장한다.
- 페이지 전체는 세로 스크롤을 허용한다.
- 카드 높이는 화면에 억지로 맞추기 위해 과도하게 압축하지 않는다.
- `Primary Panel`이 가장 크다는 위계는 유지하되, 전체 화면을 한 viewport에 억지로 가두지 않는다.

이 결정으로 구현 시 CSS 전략은 아래를 따른다.

- 고정 viewport 높이 기반의 복잡한 분할 대신 자연스러운 블록 흐름을 사용한다.
- 최소 높이는 카드별 위계 표현에 필요한 수준만 사용한다.
- overflow는 특수 내부 스크롤 패널이 아니라 페이지 스크롤을 기본으로 한다.

### 6. 카드 시스템은 공통 골격을 가지되 높이로 중요도를 표현한다

모든 카드는 서로 다른 콘텐츠를 담더라도 공통 구조를 가진다.

기본 카드 구조:

- 상단 라벨
- 중앙 본문 영역
- 하단 보조 영역

이번 와이어프레임 단계에서는 본문에 실제 데이터 대신 `영역명`만 배치한다. 카드의 역할 차이는 내부 기능이 아니라 `크기`, `위치`, `높이`로 먼저 표현한다.

권장 규칙:

- Summary Cards는 낮고 단단한 비율
- Primary Panel은 가장 크고 가장 강한 시선 집중
- Side Panels는 보조지만 독립된 카드감 유지
- Compare Cards는 동일 밀도로 반복 가능해야 함
- Wide Panels는 높이는 낮되 가로 사용성이 좋아야 함

### 7. 카드 이름은 도메인 확정 전까지 중립 라벨을 사용한다

이번 단계에서는 `시장`, `포지션`, `알림`처럼 도메인 의미를 미리 박지 않는다. 대신 구조 검증에 적합한 중립 라벨을 사용한다.

권장 라벨:

- `Dashboard Header`
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

이 방식의 장점은 아래와 같다.

- 카드 용도가 바뀌어도 레이아웃 검증 결과는 유지된다.
- 구현 초반에 불필요한 도메인 고정을 피할 수 있다.
- 사용자 검토 시 “무엇을 담을지”보다 “어떻게 읽히는지”에 집중할 수 있다.

### 8. 시각 규칙은 “떠 있는 카드”보다 “정돈된 정보 블록”에 가깝게 간다

대시보드는 과장된 장식보다 정보 블록의 정돈감이 우선이다.

권장 시각 규칙:

- 페이지 배경은 한 단계 밝은 중성 톤 사용
- 카드는 배경보다 약간 더 또렷하게 떠 보이게 구성
- 구분은 강한 선보다 얕은 보더와 부드러운 그림자 사용
- 공통 라운드 계열을 유지하되 Primary Panel이 가장 존재감 있게 보여야 함
- 텍스트는 `작은 라벨 + 큰 영역명` 중심으로 단순하게 유지

이 규칙은 현재 프로젝트가 이미 사용 중인 `slate` 중심 톤, 큰 라운드, 카드형 블록 감각과도 충돌이 적다.

## 컴포넌트 구조 제안

권장 구조:

```text
frontend/src/features/dashboard/
├─ components/
│  ├─ DashboardDesktopLayout.tsx
│  ├─ DashboardSectionHeader.tsx
│  ├─ DashboardWireframeCard.tsx
│  └─ DashboardWireframeGrid.tsx
└─ constants/
   └─ dashboardWireframe.ts
```

역할:

- `DashboardDesktopLayout`
  - 전체 데스크톱 레이아웃 조합
- `DashboardSectionHeader`
  - 상단 헤더 표현
- `DashboardWireframeCard`
  - 공통 카드 틀 표현
- `DashboardWireframeGrid`
  - 요약/메인/비교/와이드 섹션 배치
- `dashboardWireframe.ts`
  - 카드 라벨과 영역 메타데이터 관리

이번 단계는 와이어프레임 성격이 강하므로, 카드 타입을 지나치게 세분화하지 않는 것이 좋다.

이번 구현에서 반드시 필요한 파일:

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/features/dashboard/components/DashboardDesktopLayout.tsx`
- `frontend/src/features/dashboard/components/DashboardWireframeCard.tsx`
- `frontend/src/features/dashboard/constants/dashboardWireframe.ts`

필요 시 분리 가능한 후보:

- `DashboardSectionHeader.tsx`
- `DashboardWireframeGrid.tsx`

즉, 초기 구현은 최소 파일 수로 시작하고, JSX 밀도나 테스트 가독성이 실제로 나빠질 때만 추가 분리한다.

## 상태와 데이터 흐름

이번 설계 단계에서 대시보드는 실제 데이터를 소유하지 않는다. 따라서 초기 구현은 정적인 와이어프레임 렌더링으로 시작한다.

초기 흐름:

```text
DashboardPage 렌더링
→ DashboardDesktopLayout 렌더링
→ 고정된 카드 메타데이터 순회
→ 와이어프레임 카드 배치
```

이후 실제 데이터가 도입되면 아래 원칙을 따른다.

- 레이아웃 컴포넌트는 영역 구조를 유지한다.
- 카드 내부만 실제 데이터 카드로 단계적으로 교체한다.
- `Primary`, `Summary`, `Compare`, `Wide`의 구조적 역할은 유지한다.

## 검증 기준

와이어프레임 구현이 완료되면 아래 조건을 만족해야 한다.

- 데스크톱에서 한 화면만 봐도 카드 위계가 명확하게 읽혀야 한다.
- Primary Panel이 자연스럽게 화면의 중심으로 인식돼야 한다.
- 카드 안의 실제 내용이 없어도 화면이 허전한 플레이스홀더처럼 보이지 않아야 한다.
- Summary, Main, Compare, Wide 구역이 시각적으로 분리돼야 한다.
- 기존 좌측 사이드바와 충돌하지 않고 우측 콘텐츠 영역 안에 안정적으로 들어와야 한다.
- 세로 스크롤이 허용된 상태에서 카드가 비정상적으로 찌그러지지 않아야 한다.

권장 테스트 범위:

- 대시보드에서 `4 / 1+2 / 3 / 2` 카드 그룹이 렌더링되는지 확인
- 기존 데스크톱 셸의 좌측 사이드바가 그대로 유지되는지 확인
- `DashboardPage`가 `DesktopRouteContent` 대신 대시보드 전용 레이아웃을 렌더링하는지 확인

## 향후 확장 메모

- 모바일 설계는 이번 문서 범위에서 제외하며, 데스크톱 구조가 확정된 후 별도 문서로 진행한다.
- 실제 카드 콘텐츠가 정해지면 중립 라벨을 도메인 이름으로 교체한다.
- 이번 구현에서는 `4 / 1+2 / 3 / 2` 구성을 고정값으로 본다.
- 이후 데이터 성격에 따라 카드 개수 조정은 가능하지만, `요약 -> 핵심 -> 비교/확장`의 읽기 순서는 유지하는 것이 좋다.
