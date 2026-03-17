# 시세 차트 데스크톱 TradingView 위젯 설계서

## 개요

- 작성일: 2026-03-17
- 대상 경로: `frontend/src/features/market-chart/components/MarketChartDesktopLayout.tsx`
- 목적: 데스크톱 `시세 / 차트` 화면의 차트 영역에 TradingView `Advanced Chart` 위젯을 임시로 붙여, `UPBIT:BTCKRW` 차트를 실제로 표시할 수 있게 한다.

## 목표

- 데스크톱 `시세 / 차트`의 차트 영역에서 TradingView 차트가 실제로 렌더링된다.
- 심볼은 임시로 `UPBIT:BTCKRW`에 고정한다.
- 상단 정보 영역과 마켓 목록 영역은 현재 레이아웃 플레이스홀더를 유지한다.

## 범위

- 데스크톱 `시세 / 차트` 차트 영역에 TradingView 위젯 연결
- TradingView 스크립트 주입용 전용 컴포넌트 분리
- 최소 옵션만 사용한 임시 고정 차트 구성
- 테스트에서 스크립트 주입과 차트 컨테이너 렌더링 확인

## 비범위

- 모바일 차트 화면 적용
- 심볼 변경 기능
- 거래소 전환 기능
- 로딩/에러 상태 UI
- TradingView Charting Library 도입
- 자체 캔들 데이터 공급

## 설계 결정

### 1. 적용 범위 제한

이번 단계는 데스크톱 `시세 / 차트` 화면의 차트 영역에만 위젯을 붙인다.

- 데스크톱 `시세 / 차트`: TradingView 위젯 적용
- 모바일 `시세 / 차트`: 기존 모바일 목록 화면 유지
- 상단 정보 영역: 플레이스홀더 유지
- 마켓 목록 영역: 플레이스홀더 유지

이 제한은 현재 목적이 `차트가 실제로 보이는지 확인`하는 것이기 때문이다. 주변 레이아웃까지 동시에 바꾸지 않는다.

### 2. 위젯 방식 선택

TradingView `Advanced Chart widget`를 사용한다.

선정 이유:
- 현재 목표인 `임시 고정 차트 표시`에 충분하다.
- React 컴포넌트 안에서 스크립트 주입만으로 붙일 수 있다.
- 나중에 심볼, 인터벌, 테마 같은 옵션을 확장하기 쉽다.

이번 단계에서는 TradingView `Charting Library`는 사용하지 않는다. 그 방식은 라이선스와 제어 범위를 더 고려해야 하고, 현재 범위를 넘어선다.

### 3. 컴포넌트 분리

권장 구조는 아래와 같다.

```text
MarketChartDesktopLayout
├─ 상단 영역
├─ 왼쪽 메인 컬럼
│  ├─ 거래소 선택 + 현재가/요약 정보 영역
│  └─ TradingViewAdvancedChart
└─ 마켓 목록 영역
```

`TradingViewAdvancedChart`는 다음만 담당한다.

- TradingView 스크립트 삽입
- 위젯 컨테이너 마운트
- 고정 심볼 설정

즉, 레이아웃 파일 안에 스크립트 삽입 로직을 직접 넣지 않고, 전용 컴포넌트로 분리한다.

### 4. 심볼과 옵션

현재 심볼은 아래처럼 고정한다.

- `symbol: "UPBIT:BTCKRW"`

초기 옵션은 최소만 사용한다.

- `autosize: true`
- `symbol: "UPBIT:BTCKRW"`
- `interval: "60"`
- `theme: "light"`
- `style: "1"`
- `locale: "kr"`
- `allow_symbol_change: false`
- `calendar: false`

이는 공식 TradingView 위젯 문서와 심볼 형식 문서를 기준으로 한 설정이다.

### 5. 테스트 방향

테스트는 실제 외부 TradingView 차트 렌더링까지 검증하지 않는다. 대신 다음만 검증한다.

- TradingView 위젯 컨테이너가 렌더링된다.
- 스크립트 엘리먼트가 생성된다.
- 스크립트에 `UPBIT:BTCKRW`와 주요 설정이 포함된다.

외부 스크립트 실행 자체를 테스트에 의존하지 않는 이유는 네트워크와 제3자 스크립트에 테스트를 종속시키지 않기 위해서다.

## 검증 기준

아래 조건을 만족하면 이번 작업은 완료로 본다.

- 데스크톱 `/market-chart`에서 차트 영역에 TradingView 차트가 보인다.
- 차트는 `UPBIT:BTCKRW` 기준으로 고정 표시된다.
- 상단 정보 영역과 마켓 목록 영역은 기존 레이아웃을 유지한다.
- 모바일 `/market-chart` 목록 화면에는 영향이 없다.
- `pnpm test:run`, `pnpm build`가 통과한다.

## 구현 시 유의사항

- 스크립트 중복 삽입을 피해야 한다.
- React 언마운트 시 컨테이너를 정리해 위젯 중복 렌더링을 막아야 한다.
- 이번 단계에서는 위젯이 보이기만 하면 충분하므로 로딩/에러 UI는 넣지 않는다.

## 가정

- TradingView 위젯 스크립트 접근이 가능한 환경에서 테스트한다.
- TradingView가 `UPBIT:BTCKRW` 심볼을 지원한다.
- 임시 고정 심볼은 이후 마켓 목록 연결 단계에서 동적으로 바뀔 수 있다.
