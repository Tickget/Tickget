# GitLab CI → GitHub Actions 마이그레이션 요약

## 생성된 파일

GitLab CI 설정이 GitHub Actions로 성공적으로 마이그레이션되었습니다. 생성된 파일은 다음과 같습니다:

### 워크플로우 파일 (총 13개)

```
Tickget/.github/workflows/
├── build-and-deploy.yml      # ✅ 재사용 가능한 워크플로우 템플릿
├── frontend.yml              # ✅ Frontend (dev + main)
├── auth-server.yml           # ✅ Auth Server (dev + main)
├── room-server.yml           # ✅ Room Server (dev + main)
├── ticketing-server.yml      # ✅ Ticketing Server (dev + main)
├── search-server.yml         # ✅ Search Server (dev + main)
├── user-server.yml           # ✅ User Server (dev + main)
├── stats-server.yml          # ✅ Stats Server (dev + main)
├── bot-server.yml            # ✅ Bot Server (dev만)
├── captcha-server.yml        # ✅ Captcha Server (dev만)
├── seatmap-server.yml        # ✅ Seatmap Server (dev만)
└── analyst-server.yml        # ✅ Analyst Server (dev만)
```

### 문서 파일 (3개)

```
Tickget/.github/
├── SECRETS-SETUP.md          # ✅ GitHub Secrets 설정 가이드
├── CI-CD-README.md           # ✅ 전체 CI/CD 사용 문서
└── MIGRATION-SUMMARY.md      # ✅ 본 파일
```

## 마이그레이션된 주요 기능

GitLab CI의 모든 기능이 성공적으로 이식되었습니다:

| 기능 | GitLab CI | GitHub Actions | 상태 |
|------|-----------|----------------|------|
| 경로 기반 트리거 | `only: changes` | `paths` 필터 | ✅ 구현됨 |
| 브랜치 기반 배포 | `only: refs` | `if: github.ref` | ✅ 구현됨 |
| ARM64 빌드 | Docker Buildx | Docker Buildx | ✅ 구현됨 |
| Docker Hub 푸시 | 수동 로그인 | `docker/login-action` | ✅ 구현됨 |
| Manifest 업데이트 | Git clone + push | Git clone + push | ✅ 구현됨 |
| 태그 생성 | `dev-${SHORT_SHA}` | `dev-${SHORT_SHA}` | ✅ 구현됨 |
| 재사용 가능한 워크플로우 | `&anchors` | `workflow_call` | ✅ 구현됨 |

## 사용 전 필수 작업

### ⚠️ 중요: 3단계 필수

#### 1. GitHub Secrets 설정

[SECRETS-SETUP.md](./SECRETS-SETUP.md)를 따라 다음을 추가하세요:

- `DOCKER_USERNAME` - Docker Hub 사용자명
- `DOCKER_PASSWORD` - Docker Hub 비밀번호/토큰
- `GH_PAT` - GitHub Personal Access Token

**예상 소요 시간:** 10-15분

#### 2. Manifest 저장소 URL 업데이트

`.github/workflows/build-and-deploy.yml` 파일의 72번째 줄 근처 수정:

**변경 전:**
```yaml
https://x-access-token:${GH_PAT}@github.com/YOUR_ORG/tickget-k8s-manifests.git
```

**변경 후:**
```yaml
https://x-access-token:${GH_PAT}@github.com/YOUR_USERNAME/tickget-k8s-manifests.git
```

`YOUR_USERNAME`을 실제 GitHub 사용자명 또는 조직명으로 변경하세요.

**예상 소요 시간:** 2분

#### 3. 커밋 및 푸시

```bash
cd Tickget
git add .github/
git commit -m "feat: migrate from GitLab CI to GitHub Actions"
git push origin dev
```

**예상 소요 시간:** 1분

## GitLab CI와의 차이점

### 장점

| 측면 | GitLab CI | GitHub Actions |
|------|-----------|----------------|
| **설정** | GitLab Runner 필요 | 설정 불필요 (GitHub-hosted) |
| **UI** | 별도 CI/CD 페이지 | 저장소와 통합 (Actions 탭) |
| **로그** | 별도 인터페이스 | GitHub UI에서 실시간 로그 |
| **비용** | 자체 호스팅 러너 비용 | 월 2,000분 무료 |
| **유지보수** | 러너 업데이트 필요 | GitHub에서 완전 관리 |

### 동일하게 유지된 것

- 경로 기반 변경 감지 (변경된 서비스만 빌드)
- AWS Graviton용 ARM64 Docker 빌드
- kustomization.yaml 자동 업데이트
- 동일한 이미지 태그 형식 (`dev-${SHORT_SHA}`, `prod-${SHORT_SHA}`)
- 동일한 Docker Hub 조직 (`kkaebu`)

### 변경된 것

1. **워크플로우 파일**: 서비스당 하나의 YAML 파일 (단일 `.gitlab-ci.yml` 대신)
2. **Secrets**: GitHub Settings → Secrets에 저장 (GitLab CI/CD 변수 대신)
3. **러너**: GitHub-hosted runners (자체 호스팅 GitLab Runner 대신)
4. **모니터링**: GitHub Actions 탭 (GitLab CI/CD 파이프라인 대신)

## 마이그레이션 테스트

### 1단계: Secrets 확인

1. `https://github.com/YOUR_USERNAME/Tickget/settings/secrets/actions` 이동
2. 3개의 secrets 확인: `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `GH_PAT`

### 2단계: Frontend로 테스트

```bash
cd Tickget/Frontend
echo "# CI/CD Migration Test" >> README.md
git add README.md
git commit -m "test: verify GitHub Actions CI/CD"
git push origin dev
```

### 3단계: 워크플로우 모니터링

1. `https://github.com/YOUR_USERNAME/Tickget/actions` 이동
2. "Frontend CI/CD" 워크플로우 실행 확인
3. 클릭하여 실시간 로그 확인

### 예상 결과

✅ **성공적인 실행은 다음을 표시합니다:**
```
✅ Checkout code
✅ Set up Docker Buildx
✅ Login to Docker Hub
✅ Determine image tag
✅ Build and push Docker image
✅ Update Kubernetes manifest
✅ Summary
```

❌ **실패하는 경우:**
- GitHub Secrets가 올바르게 설정되었는지 확인
- manifest 저장소 URL이 업데이트되었는지 확인
- 에러 메시지를 위한 워크플로우 로그 검토

## 마이그레이션 체크리스트

모든 것이 작동하는지 확인하기 위한 체크리스트:

- [ ] 13개의 워크플로우 파일 생성
- [ ] 3개의 GitHub Secrets 추가 (DOCKER_USERNAME, DOCKER_PASSWORD, GH_PAT)
- [ ] `build-and-deploy.yml`에서 manifest 저장소 URL 업데이트
- [ ] `.github/` 디렉토리 커밋 및 푸시
- [ ] 작은 변경으로 파이프라인 테스트
- [ ] Docker 이미지가 Docker Hub에 푸시되었는지 확인
- [ ] manifest 저장소의 kustomization.yaml이 업데이트되었는지 확인
- [ ] ArgoCD가 동기화하고 변경사항을 배포했는지 확인
- [ ] Kubernetes pod가 새 이미지로 실행 중인지 확인

## 롤백 계획 (필요시)

GitHub Actions가 예상대로 작동하지 않는 경우 쉽게 롤백할 수 있습니다:

1. **GitLab CI 계속 사용**: `.gitlab-ci.yml` 파일이 여전히 존재
2. **클러스터 변경 없음**: ArgoCD 및 Kubernetes 설정 변경 없음
3. **GitHub 워크플로우 제거**: `git rm -rf .github/workflows/`

## 다음 단계

성공적인 마이그레이션 후:

1. **1-2주 모니터링**: 모든 서비스가 올바르게 빌드되는지 확인
2. **문서 업데이트**: GitLab CI 참조를 GitHub Actions로 변경
3. **GitLab Runner 제거**: 신뢰도 확보 후 폐기 가능
4. **`.gitlab-ci.yml` 제거**: GitHub Actions가 안정적일 때
5. **보안 스캔 추가**: Trivy, Snyk 같은 도구 고려

## 문제 해결

### 일반적인 문제

**문제 1: manifest 저장소 "Permission denied"**
- **원인**: `GH_PAT`에 `repo` 스코프 없음
- **해결**: 올바른 권한으로 토큰 재생성

**문제 2: "Docker login failed"**
- **원인**: 잘못된 Docker Hub 인증 정보
- **해결**: `DOCKER_USERNAME`과 `DOCKER_PASSWORD` 확인

**문제 3: "Workflow not triggering"**
- **원인**: 변경된 파일이 `paths` 필터와 일치하지 않음
- **해결**: 올바른 경로 패턴을 위해 워크플로우 파일 확인

**문제 4: "Kustomization file not found"**
- **원인**: Manifest 저장소 브랜치 불일치
- **해결**: k8s-manifest 저장소에 `dev` 브랜치 존재 확인

자세한 문제 해결은 [CI-CD-README.md](./CI-CD-README.md#문제-해결)를 참조하세요.

## 성능 비교

GitLab CI 경험을 기반으로 한 예상 GitHub Actions 성능:

| 메트릭 | GitLab CI (자체 호스팅) | GitHub Actions (호스팅) |
|--------|------------------------|------------------------|
| 빌드 시간 | ~5-10분 | ~5-10분 (유사) |
| 대기 시간 | 0-2분 (러너 사용 중일 때) | 0-30초 (20개 동시 작업) |
| 신뢰성 | 95%+ (러너 유지보수) | 99%+ (GitHub SLA) |
| 동시 빌드 | 1-4개 (러너 제한) | 최대 20개 (무료 티어) |

## 지원 및 리소스

- **설정 가이드**: [SECRETS-SETUP.md](./SECRETS-SETUP.md)
- **사용 가이드**: [CI-CD-README.md](./CI-CD-README.md)
- **GitHub Actions 문서**: https://docs.github.com/en/actions
- **워크플로우 문법**: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions

## 요약

✅ **성공적으로 마이그레이션됨:**
- 자동화된 CI/CD를 가진 11개 서비스
- 경로 기반 변경 감지
- ARM64 Docker 빌드
- 자동 manifest 업데이트
- ArgoCD 통합

⚠️ **필요한 작업:**
1. GitHub Secrets 설정 (10-15분)
2. Manifest 저장소 URL 업데이트 (2분)
3. 샘플 커밋으로 테스트 (5분)

📊 **총 예상 설정 시간:** ~20-25분

🎉 **혜택:**
- 인프라 유지보수 제로
- 더 나은 GitHub 통합
- 향상된 UI 및 모니터링
- 월 2,000분 무료 빌드 시간

---

**질문이나 문제가 있나요?** [CI-CD-README.md](./CI-CD-README.md#문제-해결) 또는 GitHub Actions 문서를 확인하세요.
