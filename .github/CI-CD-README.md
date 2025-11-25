# TickGet CI/CD 파이프라인

GitHub Actions를 사용한 TickGet 마이크로서비스 플랫폼의 자동화된 지속적 통합 및 배포 파이프라인입니다.

## 개요

이 CI/CD 시스템은 자동으로:
1. 특정 서비스의 변경 사항 감지 (경로 기반 트리거)
2. ARM64 아키텍처용 Docker 이미지 빌드
3. Docker Hub에 이미지 푸시 (kkaebu 조직)
4. `tickget-k8s-manifests` 저장소의 Kubernetes 매니페스트 업데이트
5. ArgoCD를 통해 업데이트된 서비스를 클러스터에 배포

## 아키텍처

```
┌─────────────────┐
│  개발자         │
│  코드 푸시      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  GitHub Actions                     │
│  ┌──────────────────────────────┐  │
│  │ 1. 변경된 서비스 감지        │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │ 2. Docker 이미지 빌드(ARM64) │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │ 3. Docker Hub에 푸시         │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │ 4. K8s Manifest 저장소 업데이트│  │
│  └──────────┬───────────────────┘  │
└─────────────┼───────────────────────┘
              │
              ▼
┌──────────────────────────────┐
│  tickget-k8s-manifests 저장소│
│  (kustomization.yaml)        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  ArgoCD                      │
│  (동기화 & 배포)             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Kubernetes 클러스터 (K3s)   │
│  (롤링 업데이트)             │
└──────────────────────────────┘
```

## 지원 서비스

### 프로덕션 서비스 (dev + main 브랜치)

| 서비스 | 경로 | Docker 이미지 |
|--------|------|--------------|
| Frontend | `Frontend/**` | `kkaebu/tickget-frontend` |
| Auth Server | `Backend/auth-server/**` | `kkaebu/auth-server` |
| Room Server | `Backend/room-server/**` | `kkaebu/room-server` |
| Ticketing Server | `Backend/ticketing-server/**` | `kkaebu/ticketing-server` |
| Search Server | `Backend/search-server/**` | `kkaebu/search-server` |
| User Server | `Backend/user-server/**` | `kkaebu/user-server` |
| Stats Server | `Backend/stats-server/**` | `kkaebu/stats-server` |

### 개발 전용 서비스 (dev 브랜치만)

| 서비스 | 경로 | Docker 이미지 |
|--------|------|--------------|
| Bot Server | `Backend/bot-server/**` | `kkaebu/bot-server` |
| Captcha Server | `Backend/catpcha-server/**` | `kkaebu/captcha-server` |
| Seatmap Server | `AI/seatmap_to_html/**` | `kkaebu/seatmap-server` |
| Analyst Server | `AI/AI_analyst/**` | `kkaebu/analyst-server` |

## 브랜치 전략

| 브랜치 | 환경 | 이미지 태그 형식 | 네임스페이스 |
|--------|------|-----------------|-------------|
| `dev` | 개발 환경 | `dev-{short-sha}` | `dev` |
| `main` | 프로덕션 환경 | `prod-{short-sha}` | `prod` |

**태그 예시:**
- Dev: `dev-a1b2c3d` (7자리 커밋 SHA)
- Prod: `prod-e4f5g6h` (7자리 커밋 SHA)

## 동작 원리

### 1. 변경 감지

GitHub Actions는 경로 필터를 사용하여 어떤 서비스가 변경되었는지 감지합니다:

```yaml
on:
  push:
    branches:
      - dev
      - main
    paths:
      - 'Frontend/**'
      - '.github/workflows/frontend.yml'
```

**결과**: 변경된 서비스만 빌드 및 배포됩니다 (시간과 리소스 절약).

### 2. Docker 이미지 빌드

변경된 각 서비스에 대해:

1. **Docker Buildx 설정**: 멀티 플랫폼 빌드 지원
2. **Docker Hub 로그인**: `DOCKER_USERNAME`과 `DOCKER_PASSWORD` secrets 사용
3. **이미지 태그 결정**: 브랜치 이름과 커밋 SHA 기반
4. **ARM64용 빌드**: 타겟 플랫폼은 `linux/arm64` (AWS Graviton)
5. **Docker Hub에 푸시**: 생성된 태그로 이미지 푸시

**빌드 명령어 예시:**
```bash
docker buildx build \
  --platform linux/arm64 \
  --tag kkaebu/auth-server:dev-a1b2c3d \
  --push \
  ./Backend/auth-server
```

### 3. Kubernetes Manifest 업데이트

이미지 푸시 성공 후:

1. **k8s-manifest 저장소 클론**: `GH_PAT` secret으로 인증
2. **kustomization 파일 찾기**: `apps/{service}/overlays/{env}/kustomization.yaml`
3. **이미지 태그 업데이트**: `newTag` 필드를 새 태그로 교체
4. **커밋 및 푸시**: ArgoCD 동기화를 트리거하는 자동 커밋

**커밋 메시지 예시:**
```
[CI] Update auth-server image tag to dev-a1b2c3d (commit: a1b2c3d)
```

### 4. ArgoCD 배포

ArgoCD가 자동으로:
1. manifest 저장소 변경 감지
2. 애플리케이션 상태 동기화
3. Kubernetes에서 롤링 업데이트 수행
4. 트래픽을 라우팅하기 전에 헬스 체크 검증

## 설정 방법

### 사전 요구사항

1. TickGet 코드베이스가 있는 GitHub 저장소
2. `tickget-k8s-manifests` 저장소 접근 권한
3. `kkaebu` 조직 접근 권한이 있는 Docker Hub 계정
4. Kubernetes 클러스터에 ArgoCD 설치

### 1단계: GitHub Secrets 설정

[Secrets 설정 가이드](./SECRETS-SETUP.md)를 따라 다음을 설정하세요:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `GH_PAT`

### 2단계: Manifest 저장소 URL 업데이트

`.github/workflows/build-and-deploy.yml` 편집 (약 72번째 줄):

```yaml
# YOUR_ORG를 실제 GitHub 조직/사용자명으로 변경
git clone --depth 1 --branch $BRANCH \
  https://x-access-token:${GH_PAT}@github.com/YOUR_ORG/tickget-k8s-manifests.git
```

예시:
```yaml
git clone --depth 1 --branch $BRANCH \
  https://x-access-token:${GH_PAT}@github.com/h2sorginal/tickget-k8s-manifests.git
```

### 3단계: 워크플로우 커밋 및 푸시

```bash
cd Tickget
git add .github/
git commit -m "feat: add GitHub Actions CI/CD workflows"
git push origin dev
```

### 4단계: 파이프라인 테스트

파이프라인을 테스트하기 위한 변경:

```bash
# 예시: Frontend README 업데이트
echo "# Test CI/CD" >> Frontend/README.md
git add Frontend/README.md
git commit -m "test: trigger frontend CI/CD"
git push origin dev
```

GitHub → Actions 탭으로 이동하여 워크플로우 실행을 모니터링하세요.

## 사용법

### 빌드 트리거

**자동 트리거**: `dev` 또는 `main` 브랜치에 코드 푸시

```bash
# 예시: room-server 업데이트
cd Backend/room-server
# ... 변경 작업 ...
git add .
git commit -m "fix: resolve WebSocket connection issue"
git push origin dev
```

**결과**: `room-server`만 빌드 및 배포됩니다 (다른 서비스는 영향 없음).

### 수동 트리거 (필요시)

GitHub Actions UI에서 수동으로 워크플로우를 트리거할 수 있습니다:

1. **Actions → 워크플로우 선택 (예: "Auth Server CI/CD")** 이동
2. **Run workflow** 클릭
3. 브랜치 선택: `dev` 또는 `main`
4. **Run workflow** 클릭

### 배포 모니터링

**GitHub Actions:**
- 워크플로우 상태 확인: `https://github.com/YOUR_USERNAME/Tickget/actions`
- 에러 확인을 위한 빌드 로그 체크

**ArgoCD:**
- 애플리케이션 상태 확인: `https://argocd.tickget.kr`
- 동기화 진행 상황 및 헬스 상태 모니터링

**Kubernetes:**
```bash
# 배포 상태 확인
kubectl get pods -n dev
kubectl rollout status deployment room-server-deployment -n dev

# Pod 로그 확인
kubectl logs -n dev -l app=room-server --tail=100 -f
```

## 워크플로우 파일

### 재사용 가능한 워크플로우

- **파일**: `.github/workflows/build-and-deploy.yml`
- **용도**: 모든 서비스가 사용하는 공유 빌드 로직
- **파라미터**: `service_name`, `service_path`, `docker_image`, `environment`

### 서비스별 워크플로우

각 서비스는 자체 워크플로우 파일을 가집니다:

```
.github/workflows/
├── build-and-deploy.yml       # 재사용 가능한 템플릿
├── frontend.yml               # Frontend 서비스
├── auth-server.yml            # Auth server
├── room-server.yml            # Room server
├── ticketing-server.yml       # Ticketing server
├── search-server.yml          # Search server
├── user-server.yml            # User server
├── stats-server.yml           # Stats server
├── bot-server.yml             # Bot server (dev만)
├── captcha-server.yml         # Captcha server (dev만)
├── seatmap-server.yml         # Seatmap server (dev만)
└── analyst-server.yml         # Analyst server (dev만)
```

## 문제 해결

### 빌드 실패: Docker 로그인 에러

**문제**: `Error: Cannot perform an interactive login from a non TTY device`

**해결 방법**:
1. GitHub Secrets에서 Docker Hub 인증 정보 확인
2. `DOCKER_USERNAME`과 `DOCKER_PASSWORD`가 올바르게 설정되었는지 확인
3. 비밀번호 대신 Docker Hub 액세스 토큰 사용 시도

### 빌드 실패: Manifest 저장소 권한 거부

**문제**: `remote: Permission to tickget-k8s-manifests.git denied`

**해결 방법**:
1. `GH_PAT`에 `repo` 스코프가 있는지 확인
2. 토큰이 만료되지 않았는지 확인
3. 토큰 소유자가 k8s-manifest 저장소에 쓰기 권한이 있는지 확인

### 배포 중단: ArgoCD 동기화 안 됨

**문제**: ArgoCD가 "OutOfSync" 상태지만 배포하지 않음

**해결 방법**:
1. ArgoCD 애플리케이션 설정 확인 (auto-sync 활성화?)
2. ArgoCD UI에서 수동으로 sync 트리거
3. manifest 저장소가 올바른 브랜치를 가지고 있는지 확인 (dev vs master)
4. Kubernetes 이벤트 확인: `kubectl get events -n dev --sort-by='.lastTimestamp'`

### Kubernetes의 이미지 Pull 에러

**문제**: `ErrImagePull` 또는 `ImagePullBackOff`

**해결 방법**:
1. Docker Hub에 이미지가 존재하는지 확인: `docker pull kkaebu/SERVICE_NAME:TAG`
2. kustomization.yaml의 이미지 태그가 빌드된 이미지와 일치하는지 확인
3. Kubernetes 노드가 Docker Hub에 접근할 수 있는지 확인 (방화벽 차단 없음)

### 경로 필터가 트리거되지 않음

**문제**: 코드를 변경했지만 워크플로우가 실행되지 않음

**해결 방법**:
1. 파일 경로가 워크플로우 `paths` 필터와 일치하는지 확인
2. 올바른 브랜치에 푸시했는지 확인 (`dev` 또는 `main`)
3. 워크플로우 에러가 있는지 "Actions" 탭 확인

## 성능 최적화

### Docker 빌드 캐시

GitHub Actions는 빌드 속도 향상을 위해 빌드 캐시를 사용합니다:

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

**결과**: 후속 빌드는 이전 빌드의 레이어를 재사용합니다.

### 병렬 빌드

여러 서비스가 병렬로 빌드될 수 있습니다:
- 각 서비스는 자체 워크플로우를 가짐
- GitHub Actions는 최대 20개의 동시 작업 실행 (무료 티어)

### 빌드 시간 예상

| 서비스 타입 | 첫 빌드 | 캐시된 빌드 |
|------------|---------|-------------|
| Frontend (React) | ~5-8분 | ~2-4분 |
| Backend (Java) | ~8-12분 | ~3-6분 |
| Backend (Go) | ~3-5분 | ~1-2분 |
| AI (Python) | ~4-7분 | ~2-3분 |

## 보안 고려사항

1. **Secrets 보호**:
   - 워크플로우 출력에서 secrets를 절대 로깅하거나 노출하지 않음
   - 모든 민감한 데이터에 GitHub Secrets 사용

2. **이미지 스캔**:
   - 보안 스캔 추가 고려 (예: Trivy, Snyk)
   - 이미지를 푸시하기 전에 취약점 스캔

3. **액세스 제어**:
   - `GH_PAT` 스코프를 필요한 권한으로만 제한
   - 다른 저장소에 대해 별도의 토큰 사용

4. **브랜치 보호**:
   - `main`에 브랜치 보호 규칙 활성화
   - 병합 전 풀 리퀘스트 리뷰 필수화

## GitLab CI에서의 마이그레이션

이 CI/CD 시스템은 GitLab CI 설정의 직접 포팅입니다:

| GitLab CI | GitHub Actions |
|-----------|----------------|
| `.gitlab-ci.yml` | `.github/workflows/*.yml` |
| `GITLAB_ACCESS_TOKEN` | `GH_PAT` |
| GitLab Runner | GitHub-hosted runners |
| `only: changes` | `paths` 필터 |
| `before_script` | 재사용 가능한 워크플로우 |

**주요 차이점:**
- GitHub Actions는 YAML 워크플로우 파일 사용 (서비스당 하나)
- GitHub-hosted runners (자체 호스팅 설정 불필요)
- 워크플로우 실행 모니터링을 위한 더 나은 UI

## 추가 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Docker Buildx 문서](https://docs.docker.com/buildx/working-with-buildx/)
- [Kustomize 문서](https://kustomize.io/)
- [ArgoCD 문서](https://argo-cd.readthedocs.io/)
- [TickGet 프로젝트 문서](../README.md)

## 지원

문제나 질문이 있는 경우:
1. GitHub Actions 탭에서 워크플로우 로그 확인
2. ArgoCD 애플리케이션 상태 검토
3. Kubernetes pod 로그 및 이벤트 확인
4. 위의 문제 해결 섹션 참조

## 라이선스

TickGet 프로젝트의 일부 (SSAFY 13기, Team A209)
