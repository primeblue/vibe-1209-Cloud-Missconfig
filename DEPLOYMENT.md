# 🚀 배포 가이드

## Vercel 배포 (권장)

### 1. 사전 준비

- Vercel 계정 생성: [vercel.com](https://vercel.com)
- OpenAI API 키 준비

### 2. 프로젝트 배포

#### 방법 1: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 디렉토리에서 실행
vercel

# 배포 과정:
# 1. Vercel 계정 로그인
# 2. 프로젝트 이름 설정
# 3. 배포 설정 확인
```

#### 방법 2: GitHub 연동 (권장)

1. GitHub에 프로젝트 푸시
2. Vercel 대시보드에서 **Add New Project** 클릭
3. GitHub 저장소 선택
4. 빌드 설정 자동 감지 (Vite 프로젝트)
5. **Deploy** 클릭

### 3. 환경 변수 설정

**중요**: Vercel Functions를 사용하므로 `OPENAI_API_KEY` 환경 변수를 설정해야 합니다.

#### Vercel 대시보드에서 설정

1. 프로젝트 대시보드 접속
2. **Settings** 탭 클릭
3. **Environment Variables** 메뉴 선택
4. 다음 환경 변수 추가:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `your-actual-openai-api-key`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
5. **Save** 클릭

#### Vercel CLI로 설정

```bash
# 환경 변수 추가
vercel env add OPENAI_API_KEY

# 값 입력 프롬프트에서 API 키 입력
# Environment 선택: Production, Preview, Development
```

### 4. 배포 확인

배포가 완료되면:

1. Vercel이 자동으로 URL 제공 (예: `your-project.vercel.app`)
2. 브라우저에서 접속하여 테스트
3. "🤖 LLM 분석 시작" 버튼 클릭하여 API 연동 확인

### 5. 로컬에서 Vercel Functions 테스트

로컬 개발 환경에서 Vercel Functions를 테스트하려면:

```bash
# Vercel CLI로 로컬 서버 실행
vercel dev

# 이 명령어는:
# - Vite 개발 서버 실행
# - Vercel Functions 실행
# - 환경 변수 자동 로드
```

접속: `http://localhost:3000`

---

## 배포 후 확인 사항

### ✅ 체크리스트

- [ ] 환경 변수 `OPENAI_API_KEY` 설정 완료
- [ ] 프로덕션 URL에서 앱 정상 작동 확인
- [ ] LLM 분석 기능 정상 작동 확인
- [ ] API 키가 클라이언트에 노출되지 않음 확인 (개발자 도구 Network 탭)

### 🔍 API 키 노출 확인 방법

1. 브라우저 개발자 도구 열기 (F12)
2. **Network** 탭 선택
3. "🤖 LLM 분석 시작" 버튼 클릭
4. `/api/analyze` 요청 확인
5. **Request Headers**에서 `Authorization` 헤더가 **없는지** 확인
   - ✅ 없음: 정상 (서버 사이드에서만 사용)
   - ❌ 있음: 문제 (클라이언트에 노출됨)

---

## 문제 해결

### 문제: "서버 설정 오류: OpenAI API 키가 설정되지 않았습니다"

**해결 방법**:
1. Vercel 대시보드에서 환경 변수 확인
2. `OPENAI_API_KEY`가 올바르게 설정되었는지 확인
3. 모든 환경(Production, Preview, Development)에 설정되었는지 확인
4. 환경 변수 변경 후 재배포 필요할 수 있음

### 문제: CORS 오류

**해결 방법**:
- Vercel Functions는 자동으로 CORS를 처리합니다
- `api/analyze.js`에 CORS 헤더가 포함되어 있습니다

### 문제: 함수 타임아웃

**해결 방법**:
- `vercel.json`에서 `maxDuration`이 30초로 설정되어 있습니다
- 필요시 더 늘릴 수 있지만 Vercel 무료 플랜은 최대 10초입니다

---

## 보안 고려사항

### ✅ 구현된 보안 기능

1. **API 키 서버 사이드 보호**
   - Vercel Functions를 통해 API 키가 클라이언트에 노출되지 않음
   - 환경 변수는 Vercel 서버에서만 접근 가능

2. **CORS 설정**
   - 적절한 CORS 헤더 설정
   - OPTIONS 요청 처리

3. **에러 처리**
   - 민감한 정보가 에러 메시지에 포함되지 않도록 처리

### ⚠️ 추가 권장 사항

1. **Rate Limiting**: Vercel Pro 플랜에서 제공하는 Rate Limiting 사용 고려
2. **API 키 로테이션**: 정기적으로 API 키 변경
3. **모니터링**: Vercel Analytics로 API 호출 모니터링

---

## 참고 자료

- [Vercel Functions 문서](https://vercel.com/docs/functions)
- [Vercel 환경 변수 설정](https://vercel.com/docs/environment-variables)
- [Vercel CLI 문서](https://vercel.com/docs/cli)

