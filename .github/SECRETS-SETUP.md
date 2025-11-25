# GitHub Secrets 설정 가이드

이 가이드는 CI/CD 파이프라인에 필요한 GitHub Secrets 설정 방법을 설명합니다.

## 필요한 Secrets

GitHub Actions 워크플로우를 실행하려면 다음 secrets를 설정해야 합니다:

| Secret 이름 | 설명 | 예시 값 |
|-------------|------|---------|
| `DOCKER_USERNAME` | Docker Hub 사용자명 | `kkaebu` |
| `DOCKER_PASSWORD` | Docker Hub 비밀번호 또는 액세스 토큰 | `your-docker-hub-password` |
| `GH_PAT` | k8s-manifest 저장소 접근용 GitHub Personal Access Token | `ghp_xxxxxxxxxxxxx` |

## 설정 방법

### 1. GitHub Personal Access Token (GH_PAT) 생성

`GH_PAT` 토큰은 `tickget-k8s-manifests` 저장소에 새로운 이미지 태그를 자동으로 업데이트하는 데 사용됩니다.

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) 이동
   - 또는 직접 방문: https://github.com/settings/tokens

2. "Generate new token" → "Generate new token (classic)" 클릭

3. 토큰 설정:
   - **Note**: `Tickget CI/CD - k8s manifest updates`
   - **Expiration**: 적절한 만료 기간 선택 (90일 이상 권장)
   - **Scopes**: 다음 항목 선택:
     - ✅ `repo` (프라이빗 저장소의 전체 제어)
       - 포함 항목: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

4. "Generate token" 클릭 후 **토큰을 즉시 복사** (다시 표시되지 않습니다)

### 2. Docker Hub 인증 정보 준비

이미지를 푸시하려면 Docker Hub 인증 정보가 필요합니다:

1. **Username**: Docker Hub 사용자명 (예: `kkaebu`)

2. **Password**:
   - 옵션 1: Docker Hub 비밀번호 사용
   - 옵션 2 (권장): 액세스 토큰 생성
     - https://hub.docker.com/settings/security 이동
     - "New Access Token" 클릭
     - 설명 입력 (예: "GitHub Actions CI/CD")
     - "Generate" 클릭 후 토큰 복사

### 3. GitHub 저장소에 Secrets 추가

1. GitHub 저장소로 이동: `https://github.com/YOUR_USERNAME/Tickget`

2. **Settings → Secrets and variables → Actions** 메뉴로 이동

3. 각 secret에 대해 "New repository secret" 클릭:

   **Secret 1: DOCKER_USERNAME**
   - Name: `DOCKER_USERNAME`
   - Value: `kkaebu` (또는 본인의 Docker Hub 사용자명)
   - "Add secret" 클릭

   **Secret 2: DOCKER_PASSWORD**
   - Name: `DOCKER_PASSWORD`
   - Value: Docker Hub 비밀번호 또는 액세스 토큰
   - "Add secret" 클릭

   **Secret 3: GH_PAT**
   - Name: `GH_PAT`
   - Value: 1단계에서 생성한 GitHub Personal Access Token
   - "Add secret" 클릭

### 4. Kubernetes Manifest 저장소 URL 업데이트

워크플로우를 사용하기 전에 재사용 가능한 워크플로우에서 k8s-manifest 저장소 URL을 업데이트해야 합니다:

1. `.github/workflows/build-and-deploy.yml` 파일 열기

2. 72번째 줄 근처에서 다음 라인 찾기:
   ```yaml
   https://x-access-token:${GH_PAT}@github.com/YOUR_ORG/tickget-k8s-manifests.git
   ```

3. `YOUR_ORG`를 실제 GitHub 조직명 또는 사용자명으로 변경:
   ```yaml
   https://x-access-token:${GH_PAT}@github.com/YOUR_USERNAME/tickget-k8s-manifests.git
   ```

4. 변경사항 커밋 및 푸시

## 설정 확인

Secrets 설정 후 올바르게 구성되었는지 확인할 수 있습니다:

1. **Settings → Secrets and variables → Actions** 이동

2. 다음 3개의 secrets가 표시되어야 합니다:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `GH_PAT`

3. 값은 숨겨져서 `***`로 표시됩니다

## CI/CD 파이프라인 테스트

Secrets가 올바르게 작동하는지 테스트하는 방법:

1. 임의의 서비스에 작은 변경 추가 (예: `Frontend/README.md`에 주석 추가)

2. `dev` 브랜치에 커밋 및 푸시:
   ```bash
   git add Frontend/README.md
   git commit -m "test: trigger CI/CD pipeline"
   git push origin dev
   ```

3. GitHub 저장소의 "Actions" 탭으로 이동

4. 변경된 서비스에 대한 워크플로우 실행 확인 (예: "Frontend CI/CD")

5. 워크플로우 로그에서 다음 사항 확인:
   - Docker 로그인 성공
   - 이미지 빌드 및 푸시 성공
   - K8s manifest 업데이트 커밋 성공

## 문제 해결

### Docker 로그인 실패

**에러**: `Error: Cannot perform an interactive login from a non TTY device`

**해결 방법**:
- `DOCKER_USERNAME`과 `DOCKER_PASSWORD`가 올바르게 설정되었는지 확인
- Docker Hub 비밀번호를 사용하는 경우 액세스 토큰 생성 시도
- 비밀번호에 이스케이프가 필요한 특수 문자가 포함되지 않았는지 확인

### GitHub 토큰 권한 거부

**에러**: `remote: Permission to tickget-k8s-manifests.git denied`

**해결 방법**:
- `GH_PAT`에 `repo` 스코프가 활성화되었는지 확인
- 토큰이 만료되지 않았는지 확인
- 토큰 소유자가 k8s-manifest 저장소에 쓰기 권한이 있는지 확인

### Kustomization 파일을 찾을 수 없음

**에러**: `❌ Kustomization file not found: apps/SERVICE_NAME/overlays/ENV/kustomization.yaml`

**해결 방법**:
- k8s-manifest 저장소가 올바른 디렉토리 구조를 가지고 있는지 확인
- 브랜치 이름이 일치하는지 확인 (`dev` 또는 `master`)
- 워크플로우의 서비스 이름이 디렉토리 이름과 일치하는지 확인

## 보안 모범 사례

1. **Git에 secrets를 커밋하지 않기**: 민감한 데이터는 항상 GitHub Secrets 사용

2. **Docker Hub 액세스 토큰 사용**: 비밀번호보다 액세스 토큰 사용 권장

3. **토큰 만료 설정**: GitHub PAT에 합리적인 만료 날짜 설정

4. **정기적인 토큰 교체**: 보안 강화를 위해 주기적으로 토큰 업데이트

5. **토큰 범위 제한**: GitHub PAT에 필요한 권한만 부여

6. **액세스 로그 검토**: GitHub와 Docker Hub의 액세스 로그 주기적으로 확인

## 추가 자료

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [GitHub 암호화된 Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Hub 액세스 토큰](https://docs.docker.com/docker-hub/access-tokens/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
