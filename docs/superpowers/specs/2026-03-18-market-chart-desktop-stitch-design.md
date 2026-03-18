# 시세 차트 데스크톱 Stitch 디자인 적용 설계서

## 개요

- 작성일: 2026-03-18
- 대상 경로: `frontend/src/features/market-chart/`
- 목적: 기존 데스크톱 `시세 / 차트` 탭에 Stitch `Market / Chart Dashboard` 시안의 기관형 다크 대시보드 톤과 구조를 적용한다.

## 목표

- 전역 레이아웃과 라우팅은 유지하고, 데스크톱 `시세 / 차트` 콘텐츠 영역만 재구성해야 한다.
- 기존 거래소 선택, quote 선택, 서버 정렬, 종목 선택, 무한 스크롤, TradingView 심볼 연동은 유지해야 한다.
- Stitch 시안의 핵심 구조인 `페이지 헤더`, `선택 마켓 요약 카드`, `차트 툴바 + 차트 패널`, `우측 마켓 패널`을 현재 코드베이스에 맞게 반영해야 한다.
- 우측 마켓 패널 비율은 현재 확인한 균형형 비율을 유지해야 한다.
- 새로 추가되는 인터벌 툴바는 실제 TradingView interval 설정과 연결돼야 한다.

## 범위

- 데스크톱 `시세 / 차트` 레이아웃 구조 변경
- 다크 테마 색상/배경/패널 계층 적용
- 선택 마켓 요약 카드 추가
- 차트 툴바와 인터벌 상태 추가
- TradingView 위젯에 interval 전달
- 우측 마켓 목록 패널 및 행 스타일 재구성
- 관련 프론트 테스트 갱신 및 추가

## 비범위

- 모바일 `/market-chart` 레이아웃 변경
- 전역 사이드바 재디자인
- 백엔드 API 변경
- 검색 기능 추가
- 거래 실행 버튼 기능 추가
- 신규 차트 지표 기능 추가
- 전역 다크 테마 시스템 개편

## 설계 결정

### 1. 전역 셸은 유지하고 탭 내부만 Stitch 구조로 바꾼다

현재 `HomePage`는 데스크톱에서 좌측 사이드바와 우측 콘텐츠 영역을 나누는 전역 셸 역할을 한다. 이번 작업은 이 전역 구조를 유지한 채, `MarketChartDesktopLayout` 내부만 Stitch 시안에 맞게 바꾼다.

즉:

- 좌측 사이드바는 유지
- `/market-chart` 라우트는 유지
- `MarketChartPage -> MarketChartDesktopLayout` 연결은 유지
- `MarketChartDesktopLayout` 내부에서만 대시보드형 레이아웃 적용

이렇게 하면 시안 재현도를 확보하면서도 현재 프로젝트의 정보 구조와 라우팅 책임이 깨지지 않는다.

### 2. 적용 방향은 “균형형”으로 고정한다

검토한 세 가지 방향 중 최종 선택은 `균형형 적용`이다.

핵심 원칙:

- 시안의 시각 톤은 충분히 가져온다.
- 현재 코드의 기능 연결은 최대한 유지한다.
- 전역 셸과 충돌할 수 있는 중복 헤더/검색/실행 흐름은 축소한다.

따라서 레이아웃은 아래처럼 구성한다.

```text
MarketChartDesktopLayout
├─ 페이지 헤더
├─ 선택 마켓 요약 카드
├─ 메인 2열 콘텐츠
│  ├─ 차트 툴바 + TradingView 차트
│  └─ 마켓 목록 패널
```

### 3. 상단 플레이스홀더는 제거하고 실제 헤더와 요약 카드로 대체한다

현재 레이아웃은 `상단 영역 - 시세 / 차트`라는 플레이스홀더 블록을 먼저 렌더링한다. 이 블록은 삭제한다.

대신 상단에는 다음 두 레이어를 둔다.

- 페이지 헤더
  - 제목: `Market / Chart`
  - 설명: 현재 탭의 역할을 짧게 설명
  - 거래소 상태와 충돌하지 않는 선에서 최소한의 메타 정보 배치
- 선택 마켓 요약 카드
  - 선택 종목명
  - 거래소명 + 거래쌍
  - 현재가
  - 전일대비
  - 거래대금 또는 거래량 표시

헤더와 요약 카드는 Stitch 시안의 정보 계층을 가져오되, 현재 실제 데이터로 채울 수 있는 값만 노출한다.

### 4. 요약 카드와 차트는 같은 선택 상태를 공유한다

현재 `MarketChartDesktopLayout`는 `selectedMarketId`를 기준으로 차트 심볼을 결정한다. 이 구조는 유지하되, 같은 선택 상태를 요약 카드에서도 사용한다.

동작 규칙:

- 목록에서 종목 선택
  - `selectedMarketId` 변경
  - 요약 카드 값 갱신
  - TradingView 심볼 갱신
- 목록이 바뀌어 현재 선택 종목이 사라진 경우
  - 기존 기본 선택 규칙으로 대체
- 초기 로드 시
  - 기존 `getDefaultSelectedMarketId` 규칙 유지

즉, 요약 카드와 차트는 같은 데이터 원본을 보고 움직여야 한다.

### 5. 차트 툴바는 실제로 동작하는 인터벌 제어만 포함한다

Stitch 시안에는 `1H / 4H / 1D / 1W` 인터벌 탭과 부가 액션이 있다. 이번 작업에서는 “실제로 동작하는 것만 노출” 원칙을 적용한다.

포함:

- `1H`
- `4H`
- `1D`
- `1W`

비포함:

- 검색 입력
- Execute Trade 버튼
- 가짜 fullscreen / camera 액션
- 구현되지 않은 indicators 액션

이유:

- 요청 범위는 데스크톱 시세/차트 탭 디자인 적용이지 신규 기능 추가가 아니다.
- 비동작 UI를 넣으면 사용자가 실제 기능으로 오해할 수 있다.

### 6. TradingView 위젯은 symbol과 interval을 함께 받도록 확장한다

현재 `TradingViewAdvancedChart`는 `symbol`만 입력받고 interval은 `'60'`으로 고정돼 있다. 이를 확장해 `interval`도 props로 받도록 바꾼다.

권장 매핑:

- `1H` -> `'60'`
- `4H` -> `'240'`
- `1D` -> `'1D'`
- `1W` -> `'1W'`

동작 규칙:

- 종목 변경 시 위젯 재생성
- 인터벌 변경 시 위젯 재생성
- 기본 인터벌은 `1H`

이 변경은 실제 UI 상호작용과 차트 결과가 연결되는 최소 범위의 기능 확장이다.

### 7. 우측 마켓 목록 패널은 다크 패널로 재구성하되 현재 기능을 유지한다

`MarketChartMarketListPanel`은 구조적으로는 유지하되 다크 대시보드 패널로 바꾼다.

유지할 기능:

- quote 탭
- 서버 정렬
- 스크롤 기반 추가 로드
- 에러/재시도
- 선택 행 강조

변경할 표현:

- 배경색과 패널 계층
- 헤더와 탭의 타이포/색상
- 선택 행 강조 방식
- 리스트 밀도와 수치 가독성

행 컴포넌트인 `MarketChartMarketListRow`도 같은 방향으로 재스타일링한다.

핵심 표현 규칙:

- 상승: 한국식 기준에 맞는 빨강 계열
- 하락: 파랑 계열
- 보합: 중립 회색
- 수치 컬럼은 `tabular-nums` 유지

### 8. 새 스타일은 공용 전역 테마가 아니라 시세/차트 범위 안에서 닫는다

이번 작업은 전역 테마 개편이 아니다. 따라서 색상과 톤은 `market-chart` 기능 범위 안에서 재사용 가능한 정도까지만 도입한다.

가능한 방식:

- Tailwind 유틸리티 클래스 직접 사용
- 필요 시 작은 상수/맵 추가

피해야 할 것:

- 앱 전체에 영향을 주는 루트 CSS 변수 대량 추가
- 다른 페이지까지 강제로 맞추는 공용 다크 테마 작업

## 컴포넌트 구조

권장 구조:

```text
frontend/src/features/market-chart/components/
├─ MarketChartDesktopLayout.tsx
├─ MarketChartSelectionSummary.tsx
├─ MarketChartPanelHeader.tsx
├─ MarketChartIntervalToolbar.tsx
├─ MarketChartMarketListPanel.tsx
├─ MarketChartMarketListRow.tsx
└─ TradingViewAdvancedChart.tsx
```

역할:

- `MarketChartDesktopLayout`
  - 상태 관리
  - 레이아웃 조합
  - 선택 마켓/차트 interval 계산
- `MarketChartSelectionSummary`
  - 선택 종목 핵심 수치 표현
- `MarketChartPanelHeader`
  - 페이지 타이틀과 설명
- `MarketChartIntervalToolbar`
  - 인터벌 선택 UI
- `TradingViewAdvancedChart`
  - symbol + interval 기반 위젯 렌더링
- `MarketChartMarketListPanel`
  - 우측 패널 조립
- `MarketChartMarketListRow`
  - 각 종목 행 렌더링

`PanelHeader`와 `IntervalToolbar`는 너무 커지지 않으면 단일 파일 내부 보조 컴포넌트로 남겨도 된다. 다만 테스트와 가독성이 급격히 나빠지면 분리한다.

## 상태와 데이터 흐름

### 데스크톱 초기 진입

```text
MarketChartDesktopLayout 마운트
→ useMarketList 호출
→ 목록 수신
→ getDefaultSelectedMarketId로 기본 종목 선택
→ 선택 종목 요약 카드 렌더링
→ TradingViewAdvancedChart(symbol, interval='60') 렌더링
```

### 종목 선택

```text
사용자 행 클릭
→ selectedMarketId 변경
→ selectedMarket 재계산
→ summary 재계산
→ chart symbol 재계산
```

### 인터벌 변경

```text
사용자 인터벌 버튼 클릭
→ activeInterval 상태 변경
→ TradingViewAdvancedChart interval 변경
→ 위젯 재생성
```

### quote / 거래소 변경

```text
사용자 거래소 또는 quote 변경
→ 목록 재조회
→ 선택 종목 재설정
→ summary / chart symbol 동기화
```

## 예외 및 오류 처리

- 목록 로딩 중:
  - 요약 카드는 빈 상태 또는 플레이스홀더 값 표시
  - 우측 패널은 기존 로딩 메시지 유지
- 목록 에러:
  - 우측 패널 재시도 UI 유지
  - 선택 마켓이 없으면 요약 카드는 `-` 기반 안전한 기본값 표시
- 지원하지 않는 quote:
  - 기존 `getDefaultQuoteForExchange` 규칙 유지
- 선택 종목 없음:
  - 대표 마켓 기본 텍스트 유지
  - 차트는 거래소 기본 심볼 사용

## 테스트 기준

아래를 테스트로 고정한다.

- `MarketChartDesktopLayout`가 기존 플레이스홀더 대신 새 헤더/요약/차트/우측 패널 구조를 렌더링한다.
- 선택 종목이 바뀌면 요약 카드의 종목명, 거래쌍, 현재가가 함께 바뀐다.
- 선택 종목이 바뀌면 TradingView에 전달되는 심볼이 바뀐다.
- 인터벌 버튼 클릭 시 TradingView에 전달되는 interval이 바뀐다.
- 거래소 변경 시 목록 조회와 기본 차트 심볼 규칙이 유지된다.
- quote 탭, 정렬 버튼, 추가 로딩 메시지, 선택 행 강조가 새 다크 레이아웃에서도 동작한다.
- `MarketChartMarketListRow`가 상승/하락/보합에 맞는 색상 클래스를 적용한다.
- `TradingViewAdvancedChart`가 `symbol`과 `interval`을 포함한 설정으로 위젯을 생성한다.

## 구현 시 주의점

- 디자인 시안에 있는 비동작 UI를 그대로 복제하지 않는다.
- 전역 레이아웃 파일인 `HomePage`는 이번 범위에서 수정하지 않는다.
- 모바일 관련 테스트가 깨지지 않도록 데스크톱 전용 변경만 분리한다.
- 흰 카드 기준 기대값을 가진 기존 테스트는 구조 변경을 반영해 고친다.
- 접근성을 위해 인터벌 버튼과 선택 행은 현재처럼 명확한 role/label을 유지한다.

## 파일 영향 예상

- 수정:
  - `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
  - `frontend/src/features/market-chart/components/TradingViewAdvancedChart.tsx`
  - `frontend/src/features/market-chart/components/MarketChartMarketListPanel.tsx`
  - `frontend/src/features/market-chart/components/MarketChartMarketListRow.tsx`
  - `frontend/src/features/market-chart/components/MarketChartDesktopLayout.test.tsx`
  - `frontend/src/features/market-chart/components/TradingViewAdvancedChart.test.tsx`
  - `frontend/src/features/market-chart/components/MarketChartMarketListPanel.test.tsx`
  - `frontend/src/features/market-chart/components/MarketChartMarketListRow.test.tsx`
- 추가 가능:
  - `frontend/src/features/market-chart/components/MarketChartSelectionSummary.tsx`
  - `frontend/src/features/market-chart/components/MarketChartIntervalToolbar.tsx`

## 성공 기준

- 데스크톱 `시세 / 차트` 탭이 Stitch 시안과 유사한 기관형 다크 대시보드 인상을 준다.
- 기존 시세/차트 핵심 기능이 유지된다.
- 인터벌 툴바가 실제 차트와 연결된다.
- 테스트가 새 구조를 기준으로 통과한다.
