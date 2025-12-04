# 실전같은 티켓팅 연습, Tickget

> 함께하는 티켓팅 연습 플랫폼

Tickget은 실제 티켓팅 환경을 시뮬레이션하여 사용자가 티켓팅 연습을 할 수 있는 웹 애플리케이션입니다. 여러 사용자가 동시에 참여하는 멀티플레이어 환경에서 실시간으로 좌석을 선택하고, 게임 결과를 분석하며, 개인 통계를 확인할 수 있는 플랫폼을 구축했습니다.

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [시스템 아키텍처](#시스템-아키텍처)
- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [배포](#배포)
- [문서](#문서)

## 🎯 프로젝트 개요

Tickget은 실제 티켓팅 사이트와 유사한 환경을 제공하여 사용자가 티켓팅 연습을 할 수 있는 플랫폼입니다. 

### 핵심 가치
- **실전 경험**: 실제 티켓팅 사이트와 유사한 UI/UX 제공
- **멀티플레이어**: 여러 사용자가 동시에 참여하는 경쟁 환경
- **AI 분석**: 게임 결과를 AI가 분석하여 개선점 제시
- **통계 분석**: 개인 성과를 시각화하여 추적

## 🏗️ 시스템 아키텍처

Tickget은 **MSA(Microservices Architecture)** 기반으로 구성되어 있으며, 다음과 같은 서비스들로 구성됩니다:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│              React + TypeScript + Vite                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP / WebSocket
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Room Server │  │ Ticketing    │  │ Auth Server  │       │
│  │ (Java)      │  │ Server       │  │ (Java)       │       │
│  └──────────────┘  │ (Java)       │  └──────────────┘       │
│         │          └──────────────┘         │                │
│         │                │                  │                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ User Server  │  │ Stats Server │  │ Search Server│       │
│  │ (Java)       │  │ (Java)       │  │ (Java)       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                │                  │                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Bot Server   │  │ Captcha      │  │ AI Services  │       │
│  │ (Go)         │  │ Server       │  │ (Python)     │       │
│  └──────────────┘  │ (Python)     │  └──────────────┘       │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
         │                │                  │
         ↓                ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Redis      │  │   Kafka      │  │   Minio       │
│   (캐시)      │  │   (이벤트)    │  │   (스토리지)   │
└──────────────┘  └──────────────┘  └──────────────┘
         │                │                  │
         ↓                ↓                  ↓
┌──────────────┐
│   MySQL      │
│   (데이터베이스)│
└──────────────┘
```

### 서비스별 역할

- **Frontend**: 사용자 인터페이스 및 실시간 통신
- **Room Server**: 방 관리, WebSocket 실시간 통신, 대기큐 알림
- **Ticketing Server**: 티켓팅 로직, 좌석 관리, 대기열 관리
- **Bot Server**: 자동화된 봇 티케팅 시스템
- **Auth Server**: 인증 및 권한 관리
- **User Server**: 사용자 정보 관리
- **Stats Server**: 통계 수집 및 분석
- **Search Server**: 검색 기능
- **Captcha Server**: 캡챠 생성 및 검증
- **AI Services**: 게임 결과 AI 분석, 좌석 맵 생성

## 🛠 기술 스택

### Frontend
- **React 19.2.0** - UI 라이브러리
- **TypeScript 5.9.3** - 타입 안정성
- **Vite 7.1.10** - 빌드 도구
- **Zustand 5.0.8** - 상태 관리
- **Material-UI 7.3.4** - UI 컴포넌트
- **Tailwind CSS 4.1.14** - 스타일링
- **WebSocket (STOMP)** - 실시간 통신
- **Recharts 3.3.0** - 데이터 시각화
- **Cypress 15.4.0** - E2E 테스트

### Backend (Java)
- **Java 21**
- **Spring Boot 3.5.7**
- **Spring Data JPA** - ORM
- **Spring WebSocket** - 실시간 통신
- **MySQL** - RDB
- **Redis** - 캐싱 및 세션 관리
- **Kafka** - 이벤트 기반 통신
- **Resilience4j** - 서킷 브레이커

### Backend (Go)
- **Go 1.25.3**
- **Gin** - 웹 프레임워크
- **Kafka (Sarama)** - 이벤트 처리
- **Minio** - 객체 스토리지

### Backend (Python)
- **Python 3.x**
- **FastAPI** - API 서버
- **Celery** - 비동기 작업
- **OpenCV** - 이미지 처리

### AI Services
- **Python 3.x**
- **LLM** - 게임 결과 분석
- **FastAPI** - API 서버

### Infrastructure
- **Docker** - 컨테이너화
- **Nginx** - 리버스 프록시
- **Kafka** - 메시지 브로커
- **Redis** - 캐시 및 세션 스토어
- **MySQL** - 관계형 데이터베이스
- **Minio** - 객체 스토리지

## ✨ 주요 기능

### 1. 티켓팅 연습
- 실시간 티켓팅 시뮬레이션
- 여러 사용자가 동시에 참여하는 멀티플레이어 환경
- WebSocket을 통한 실시간 좌석 상태 업데이트
- 좌석 선점 상태 처리 및 동기화

### 2. 공연장 지원
- **소규모 공연장**: 샤롯데시어터
- **중규모 공연장**: 올림픽홀
- **대규모 공연장**: 인스파이어 아레나
- AI 기반 공연장 TSX 생성

### 3. 예매 사이트 통합
- 익스터파크(Exterpark) 예매 시뮬레이션
- 워터멜론(Watermelon) 예매 시뮬레이션
- 캡챠 검증 시스템
- 예매 대기 페이지

### 4. 봇 시스템
- 난이도별 봇 레벨 시스템 (EASY, NORMAL, HARD)
- 지능형 좌석 선택 알고리즘
- Kafka 기반 대기큐 관리
- 최대 50,000개 동시 봇 실행

### 5. 실시간 통신
- WebSocket 기반 실시간 상태 동기화
- 대기열 실시간 업데이트
- 방 입장/퇴장 알림
- 중복 세션 방지

### 6. 통계 및 분석
- 개인 통계 및 랭킹
- 주간 랭킹 시스템
- AI 기반 게임 결과 분석
- 데이터 시각화 (Recharts)

### 7. 사용자 기능
- Google 소셜 로그인
- 프로필 이미지 관리
- 매칭 히스토리 조회
- 예매 내역 관리

## 📁 프로젝트 구조

```
Tickget/
├── Frontend/              # 프론트엔드
│   ├── src/
│   │   ├── app/          # 애플리케이션 설정
│   │   ├── components/   # 공통 컴포넌트
│   │   ├── features/     # 기능별 모듈
│   │   ├── pages/        # 페이지 컴포넌트
│   │   └── shared/       # 공유 리소스
│   └── package.json
│
├── Backend/               # 백엔드 서버들
│   ├── auth-server/      # 인증 서버 (Java)
│   ├── bot-server/       # 봇 서버 (Go)
│   ├── captcha-server/   # 캡챠 서버 (Python)
│   ├── room-server/      # 방 관리 서버 (Java)
│   ├── search-server/    # 검색 서버 (Java)
│   ├── stats-server/     # 통계 서버 (Java)
│   ├── ticketing-server/ # 티켓팅 서버 (Java)
│   └── user-server/      # 사용자 서버 (Java)
│
├── AI/                    # AI 서비스
│   ├── AI_analyst/        # AI 분석 서비스
│   └── seatmap_to_html/  # 좌석 맵 생성 서비스
│
├── docs/                  # 문서
│   ├── FRONTEND_README.md
│   ├── BOT_SERVER_README.md
│   └── ROOM_SERVER_README.md
│
├── Dockerfile             # 프론트엔드 Dockerfile
├── nginx.conf            # Nginx 설정
├── package.json          # 루트 package.json
└── README.md             # 이 파일
```

## 🚀 시작하기

### 필수 요구사항

- **Node.js 20 이상** (Frontend)
- **Java 21 이상** (Backend Java 서버들)
- **Go 1.25 이상** (Bot Server)
- **Python 3.x** (Captcha Server, AI Services)
- **Docker & Docker Compose** (인프라)
- **MySQL 8.0 이상**
- **Redis 7.0 이상**
- **Kafka 3.0 이상**
- **Minio**

### 로컬 개발 환경 설정

#### 1. 저장소 클론

```bash
git clone https://github.com/Tickget/Tickget.git
cd Tickget
```

#### 2. Frontend 실행

```bash
cd Frontend
npm install
npm run dev
```

Frontend는 `http://localhost:5173`에서 실행됩니다.

#### 3. Backend 서버 실행

각 서버는 독립적으로 실행할 수 있습니다:

**Room Server (Java)**
```bash
cd Backend/room-server
./gradlew bootRun
```

**Ticketing Server (Java)**
```bash
cd Backend/ticketing-server
./gradlew bootRun
```

**Bot Server (Go)**
```bash
cd Backend/bot-server
go run main.go
```

**Captcha Server (Python)**
```bash
cd Backend/captcha-server
pip install -r requirements.txt
python wsgi.py
```

#### 4. 인프라 실행 (Docker Compose)

```bash
# Kafka, Redis, MySQL, Minio 실행
docker-compose up -d
```

### 환경 변수 설정

각 서버는 `.env` 파일 또는 환경 변수를 통해 설정할 수 있습니다. 자세한 내용은 각 서버의 README를 참조하세요:

- [Frontend README](docs/FRONTEND_README.md)
- [Bot Server README](docs/BOT_SERVER_README.md)
- [Room Server README](docs/ROOM_SERVER_README.md)

## 🐳 배포

### Docker를 사용한 배포

#### Frontend 빌드 및 배포

```bash
docker build \
  --build-arg VITE_API_PREFIX_DEV=/api/v1/dev \
  --build-arg VITE_API_ORIGIN=https://tickget.kr \
  -t tickget-frontend .
```

```bash
docker run -d -p 80:80 tickget-frontend
```

#### Backend 서버 배포

각 서버는 독립적인 Dockerfile을 가지고 있습니다:

```bash
# Room Server
cd Backend/room-server
docker build -t tickget-room-server .
docker run -p 8080:8080 tickget-room-server

# Ticketing Server
cd Backend/ticketing-server
docker build -t tickget-ticketing-server .
docker run -p 8081:8081 tickget-ticketing-server

# Bot Server
cd Backend/bot-server
docker build -t tickget-bot-server .
docker run -p 8082:8082 tickget-bot-server
```

### 프로덕션 환경

프로덕션 환경에서는 다음을 고려해야 합니다:

- **로드 밸런싱**: Nginx를 통한 로드 밸런싱
- **데이터베이스**: MySQL 클러스터링
- **캐시**: Redis 클러스터
- **메시지 브로커**: Kafka 클러스터
- **모니터링**: 각 서버의 헬스 체크 엔드포인트 활용

## 📚 문서

각 서버 및 컴포넌트에 대한 상세 문서:

- [Frontend 문서](docs/FRONTEND_README.md) - 프론트엔드 상세 가이드
- [Bot Server 문서](docs/BOT_SERVER_README.md) - 봇 서버 아키텍처 및 API
- [Room Server 문서](docs/ROOM_SERVER_README.md) - 방 관리 서버 아키텍처 및 API

## 🧪 테스트

### Frontend E2E 테스트

```bash
cd Frontend
npm run cypress:open
```

### Backend 테스트

각 서버는 독립적인 테스트를 포함하고 있습니다:

```bash
# Java 서버
./gradlew test

# Go 서버
go test ./...
```

## 🔗 관련 링크

- [프로젝트 홈페이지](https://tickget.kr)
- [GitHub 저장소](https://github.com/Tickget)

## 👥 팀

- **기간**: 2025.10.10 ~ 11.30 (7주)
- **인원**: 7명
