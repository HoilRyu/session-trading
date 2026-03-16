# 백엔드 DB 연결 설계서

## 개요

- 작성일: 2026-03-16
- 대상 경로: `backend/`
- 목적: `FastAPI` 백엔드에 PostgreSQL 연결 설정과 연결 확인 구조를 추가하기

## 목표

- `backend/.env` 기반으로 PostgreSQL 접속 정보를 관리한다.
- 애플리케이션 시작 시 데이터베이스 연결 가능 여부를 확인한다.
- 헬스체크 응답에 데이터베이스 상태를 포함한다.
- 이후 모델, 리포지토리, 쿼리 로직을 확장할 수 있는 최소 연결 구조를 만든다.

## 범위

- DB 환경변수 구조 정의
- `SQLAlchemy` async 기반 엔진과 세션 팩토리 구성
- 앱 시작 시 DB ping 확인
- `/health` 응답에 DB 상태 반영
- DB 연결 관련 테스트 추가
- `.env.example` 예시 갱신

## 비범위

- ORM 모델 정의
- 마이그레이션 도구 도입
- 예시 테이블 생성
- 실제 비즈니스 쿼리 구현
- 커넥션 풀 튜닝

## 설계 결정

### 1. 환경변수 정책

- DB 접속 정보는 `backend/.env`에서 관리한다.
- 예시 값은 `backend/.env.example`에만 기록한다.
- 루트 [`.gitignore`](/Users/ryuhoil/syncthing/workspace/01_Projects/session-trading/.gitignore)에는 `.env`, `.env.*`, `!.env.example` 규칙이 이미 있어 `backend/.env`는 커밋되지 않는다.

이번 작업에서 사용할 환경변수는 아래처럼 통일한다.

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

### 2. 연결 방식

- `FastAPI`의 현재 구조와 이후 실시간 처리 확장을 고려해 `SQLAlchemy` async 엔진을 사용한다.
- PostgreSQL 드라이버는 `asyncpg`를 사용한다.
- 접속 문자열은 설정 클래스에서 조합해 `database_url` 형태로 노출한다.

이 선택은 지금 단계에서 모델이 없어도 연결 관리 코드가 이후 ORM 확장으로 자연스럽게 이어지도록 한다.

### 3. 프로젝트 구조

기존 구조에 아래 파일을 추가한다.

```text
backend/
  app/
    db/
      __init__.py
      session.py
```

- `app/db/session.py`: async engine, async session factory, DB ping 함수만 담당한다.
- `app/db/__init__.py`: DB 패키지 시작점만 담당한다.
- `app/core/config.py`: DB 관련 환경변수와 `database_url` 조합만 추가한다.
- `app/main.py`: 앱 시작 시 DB 연결 확인만 추가한다.
- `app/api/routes/health.py`: DB 상태를 포함한 헬스체크 응답만 담당한다.

이번 단계에서는 리포지토리, 모델, 마이그레이션 레이어를 만들지 않는다.

### 4. 앱 시작 동작

- 앱 시작 시 DB ping을 한 번 실행한다.
- ping 실패 시 서버 시작을 실패시켜 문제를 빠르게 드러낸다.
- ping 방식은 `SELECT 1` 같은 최소 쿼리로 제한한다.

이 정책은 프런트엔드가 서버를 정상 상태로 신뢰하기 전에 DB 연결 준비가 되었는지 확인하게 해준다.

### 5. 헬스체크 응답

- 기존 `/health` 응답에 `database` 필드를 추가한다.
- DB 연결이 가능하면 `database: "ok"`를 반환한다.
- DB ping 실패 시 `/health`는 503 상태 코드를 반환한다.

최소 응답 예시는 아래 수준으로 유지한다.

```json
{
  "status": "ok",
  "service": "session-trading-backend",
  "environment": "local",
  "database": "ok"
}
```

### 6. 테스트 전략

- DB 연결 함수는 실제 로컬 PostgreSQL에 의존하지 않도록 테스트에서 대체 가능한 단위로 둔다.
- `health` 라우트 테스트는 DB ping 함수를 monkeypatch 또는 dependency replacement 방식으로 대체해 검증한다.
- 테스트 범위는 다음으로 제한한다.
  - 정상 상태에서 `/health`가 `database: "ok"`를 포함하는지 확인
  - DB ping 실패 시 `/health`가 503을 반환하는지 확인
  - 설정 클래스가 `database_url`을 올바르게 조합하는지 확인

### 7. 의존성 추가

- 런타임 의존성에 아래를 추가한다.
  - `sqlalchemy`
  - `asyncpg`

이번 단계에서는 `alembic`, `psycopg`, `sqlmodel`은 도입하지 않는다.

## 데이터 흐름

1. 서버가 시작되면 설정 클래스가 `.env`에서 DB 접속 정보를 읽는다.
2. `session.py`가 async engine을 초기화한다.
3. 앱 startup 과정에서 ping 함수가 DB 연결을 확인한다.
4. `/health` 요청이 오면 다시 ping을 수행해 현재 DB 상태를 응답에 포함한다.

## 오류 처리

- 앱 시작 시 DB 연결 실패는 예외를 그대로 드러내 서버 시작을 막는다.
- `/health`에서 DB ping 실패 시 503과 함께 상태 메시지를 반환한다.
- 민감 정보는 응답 본문이나 로그에 포함하지 않는다.

## 검증 기준

아래 조건을 만족하면 이번 작업은 완료로 본다.

- `backend/.env.example`에 DB 예시 값이 반영된다.
- `backend/.env`를 기준으로 DB 접속 문자열이 조합된다.
- 서버 시작 시 DB 연결 확인이 수행된다.
- `/health` 응답이 DB 상태를 포함한다.
- 테스트 명령이 통과한다.

## 구현 시 유의사항

- 현재 단계에서는 모델이나 마이그레이션을 미리 도입하지 않는다.
- DB 연결 정보는 반드시 환경변수에서만 읽는다.
- 테스트가 실제 로컬 DB 상태에 불필요하게 종속되지 않도록 설계한다.

## 가정

- 로컬 PostgreSQL은 `127.0.0.1:5432`에서 실행 중이다.
- 데이터베이스 이름과 계정 정보는 아래와 같다.
  - `DB_NAME=session_trading`
  - `DB_USER=session_trading`
  - `DB_PASSWORD=session_trading`
