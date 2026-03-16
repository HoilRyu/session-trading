# 데이터베이스 Docker 구성 설계서

## 개요

- 작성일: 2026-03-16
- 대상 경로: 루트 `docker-compose.yml`, `database/Dockerfile`
- 목적: 루트 Compose 진입점에서 TimescaleDB 기반 데이터베이스 컨테이너를 실행할 수 있는 최소 개발 환경을 구성하기

## 목표

- 루트 경로에서 `docker compose up db`로 데이터베이스를 실행할 수 있다.
- 데이터베이스 이미지는 `database/Dockerfile`에서 빌드한다.
- 추후 `backend`, `frontend` Dockerfile을 추가해 동일 Compose에서 함께 실행할 수 있는 구조를 유지한다.
- 데이터 초기화와 스키마 생성 책임은 이번 범위에서 제외하고, 추후 `backend`가 담당한다.

## 범위

- 루트 `docker-compose.yml` 생성
- `database/Dockerfile` 생성
- TimescaleDB 기반 이미지 선택
- 로컬 개발용 포트, 볼륨, 헬스체크 구성

## 비범위

- `initdb` 스크립트 작성
- 데이터베이스 스키마 생성
- Timescale extension 활성화 SQL 작성
- `backend`, `frontend` 서비스 추가
- 운영 배포용 보안 설정

## 설계 결정

### 1. 이미지 선택

- 베이스 이미지는 `timescale/timescaledb:2.25.2-pg17` non-HA 이미지를 기본값으로 사용한다.
- 이유는 실시간 가격과 차트 데이터가 시계열 중심이기 때문이다.
- 고가용성 이미지는 현재 로컬 개발 환경 범위에 비해 과하므로 제외한다.
- 추후 업그레이드나 실험을 위해 Docker build ARG로 베이스 이미지를 교체할 수 있게 둔다.

### 2. Docker 구성 방식

- 루트 `docker-compose.yml`에서 `db` 서비스만 우선 정의한다.
- `db` 서비스는 루트에서 직접 이미지를 참조하지 않고 `database/Dockerfile`을 빌드해서 사용한다.
- 이렇게 하면 추후 `backend`, `frontend`도 각 폴더의 Dockerfile을 기준으로 대칭 구조를 유지할 수 있다.

### 3. 환경 변수 전략

- Compose 파일은 `${VAR:-default}` 형식의 기본값을 사용한다.
- 이번 범위에서는 `.env` 파일을 강제하지 않는다.
- 기본값은 로컬 개발용이며, 추후 실제 환경에서는 별도 환경 변수로 덮어쓴다.

### 4. 저장소와 네트워크

- 데이터는 Docker named volume에 저장한다.
- 로컬 접근만 허용하도록 포트는 `127.0.0.1`에 바인딩한다.
- 별도 커스텀 네트워크는 지금 단계에서 만들지 않는다.
- 추후 Compose 서비스가 늘어나면 기본 네트워크를 공유하도록 둔다.

### 5. 상태 확인

- `pg_isready` 기반 헬스체크를 추가한다.
- 추후 `backend`가 추가되면 `depends_on: condition: service_healthy`로 DB 준비 완료 이후 시작할 수 있다.

## 데이터 흐름

1. 사용자가 루트에서 `docker compose up db`를 실행한다.
2. Compose가 `database/Dockerfile`을 빌드해 DB 이미지를 준비한다.
3. TimescaleDB 컨테이너가 PostgreSQL 프로세스를 실행한다.
4. 컨테이너가 기동되면 `pg_isready`로 상태를 확인한다.
5. 추후 `backend`는 같은 Compose 네트워크에서 `db:5432`로 접속한다.

## 오류 처리

- 포트 충돌이 있으면 Compose가 기동 단계에서 실패한다.
- 인증 정보가 잘못되면 헬스체크가 실패한다.
- 데이터 볼륨 문제는 named volume 재생성으로 분리 대응할 수 있다.

## 검증 기준

- `docker compose config`가 성공한다.
- `docker compose up -d db`가 성공한다.
- `docker compose ps db`에서 서비스가 실행 상태로 보인다.
- `docker compose exec db pg_isready -U <user> -d <db>`가 성공한다.

## 가정

- Docker와 Docker Compose 플러그인이 로컬에 설치되어 있다.
- 현재 단계는 로컬 개발 환경 준비가 목적이다.
- 데이터베이스 초기화와 스키마 관리는 이후 `backend`에서 담당한다.
