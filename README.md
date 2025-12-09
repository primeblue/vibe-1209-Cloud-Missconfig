# ☁️ Cloud Misconfig Checker

**클라우드 설정 오류를 자동으로 분석하고 개선안을 제시하는 웹 애플리케이션**

바이브코딩 입문자를 위한 교육용 도구로, AWS, GCP, Azure 클라우드 설정 파일의 보안 취약점을 탐지하고 개선 방안을 제공합니다.

---

## 📋 목차

- [주요 기능](#-주요-기능)
- [빠른 시작](#-빠른-시작)
- [프로젝트 구조](#-프로젝트-구조)
- [분석 기능 상세](#-분석-기능-상세)
- [UI/UX 특징](#-uiux-특징)
- [보안 고려사항](#️-보안-고려사항)
- [사용 방법](#-사용-방법)
- [배포 가이드](#-배포-가이드)
- [기술 스택](#-기술-스택)
- [개발 가이드](#-개발-가이드)

---

## 🎯 주요 기능

### 1. 다중 클라우드 지원
- **AWS**: S3 버킷 정책, IAM 정책 분석
- **GCP**: 서비스 계정, IAM 바인딩, Storage 설정 분석
- **Azure**: NSG (Network Security Group), Storage Account, Key Vault 분석

### 2. 다양한 입력 방식
- **📁 파일 업로드**: JSON/YAML 파일 직접 업로드
- **✏️ 텍스트 입력**: JSON/YAML 텍스트를 직접 입력하여 분석
- **📚 샘플 파일**: 실습용 샘플 설정 파일 제공 (4종)

### 3. 2단계 분석 시스템

#### 1차 필터링 (정규식 기반)
- 브라우저에서 즉시 실행 (서버 불필요)
- **40개 이상의 보안 패턴** 자동 탐지
- 심각도별 분류 및 정렬 (Critical → High → Medium → Low)
- 실시간 결과 표시

#### 2차 LLM 심층 분석
- OpenAI GPT API를 통한 상세 분석
- 위험도 평가 (High/Medium/Low)
- 주요 문제 설정 목록화
- 잠재적 위협 시나리오 제시
- **개선된 보안 설정 자동 생성** (패치된 JSON 다운로드 가능)

### 4. 직관적인 UI
- **2단 레이아웃**: 왼쪽 원본 정책 뷰어, 오른쪽 분석 결과 패널
- **심각도별 색상 구분**: Critical(빨강) → High(주황) → Medium(노랑) → Low(초록)
- **요약 통계**: 각 심각도별 발견된 문제 개수 표시
- **반응형 디자인**: 다양한 화면 크기 지원

### 5. 교육 친화적 구성
- 초급자도 이해하기 쉬운 설명
- 실습용 샘플 파일 제공
- 개선된 설정 파일 다운로드 기능
- 단계별 가이드 제공

---

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 16.x 이상
- npm 또는 yarn
- OpenAI API 키 (LLM 분석 기능 사용 시)

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd vibe-1209-Cloud_missconfig

# 의존성 설치
npm install
```

### 2. 환경 변수 설정

#### 로컬 개발 환경

`.env` 파일을 생성하고 OpenAI API 키를 설정하세요:

```bash
# env.example 파일을 참고하여 .env 파일 생성
# Windows PowerShell
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

> ⚠️ **참고**: 로컬 개발 시 Vercel CLI를 사용하여 서버리스 함수를 테스트할 수 있습니다.
> Vercel Functions는 서버 사이드에서 실행되므로 로컬에서는 `vercel dev` 명령어를 사용하세요.

#### Vercel 프로덕션 배포

Vercel 대시보드에서 환경 변수를 설정하세요:

1. Vercel 대시보드 접속
2. 프로젝트 선택 > **Settings** > **Environment Variables**
3. 다음 환경 변수 추가:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `your-actual-openai-api-key`
   - **Environment**: Production, Preview, Development 모두 선택
4. **Save** 클릭

> ✅ **보안**: Vercel Functions를 통해 API 키가 서버 사이드에서만 사용되므로 클라이언트에 노출되지 않습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

### 4. 빌드

#### 테스트 빌드
```bash
npm run build
npm run preview
```

#### 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

---

## 📁 프로젝트 구조

```
cloud-misconfig-checker/
├── api/                            # Vercel Serverless Functions
│   └── analyze.js                 # OpenAI API 호출 (서버 사이드)
├── public/
│   └── samples/                    # 실습용 샘플 파일
│       ├── s3-public-bucket.json    # AWS S3 공개 버킷 예제
│       ├── iam-admin-policy.json    # AWS IAM 관리자 정책 예제
│       ├── gcp-service-account.json # GCP 서비스 계정 예제
│       └── azure-nsg-open.json     # Azure NSG 열린 규칙 예제
├── src/
│   ├── components/                 # React 컴포넌트
│   │   ├── FileUpload.jsx          # 파일 업로드 및 텍스트 입력 컴포넌트
│   │   ├── FileUpload.css
│   │   ├── PolicyViewer.jsx        # 원본 정책 뷰어 컴포넌트
│   │   ├── PolicyViewer.css
│   │   ├── AnalysisPanel.jsx      # 분석 결과 표시 컴포넌트
│   │   └── AnalysisPanel.css
│   ├── utils/                      # 유틸리티 함수
│   │   ├── misconfigFilter.js      # 정규식 기반 1차 필터링 로직
│   │   └── llmAnalyzer.js          # Vercel Function 호출 (클라이언트)
│   ├── styles/                     # 전역 CSS 스타일
│   │   ├── index.css               # 기본 스타일
│   │   └── App.css                 # 앱 메인 스타일
│   ├── App.jsx                     # 메인 앱 컴포넌트
│   └── main.jsx                    # React 진입점
├── .env.example                    # 환경 변수 예제 파일
├── .gitignore                      # Git 무시 파일 목록
├── vercel.json                     # Vercel 배포 설정
├── index.html                      # HTML 진입점
├── package.json                    # 프로젝트 의존성 및 스크립트
├── vite.config.js                  # Vite 빌드 설정
├── README.md                       # 프로젝트 문서
├── SECURITY_ANALYSIS.md            # 보안 분석 리포트
└── DEPLOYMENT.md                   # 배포 가이드
```

---

## 🔍 분석 기능 상세

### 1차 필터링 (정규식 기반) - 40개 이상 패턴 탐지

브라우저에서 즉시 실행되는 고도화된 필터링 시스템입니다. 서버 없이 클라이언트에서만 동작하여 빠르고 안전합니다.

#### AWS S3 (8개 패턴)
- ✅ Public-read/Public-read-write ACL
- ✅ `*` Principal (모든 사용자 접근 허용)
- ✅ `0.0.0.0/0` 또는 `::/0` IP 범위
- ✅ 암호화 비활성화
- ✅ 버전 관리 비활성화
- ✅ CORS 과도한 설정 (모든 Origin 허용)
- ✅ 조건부 제한 없는 버킷 정책
- ✅ 로깅 비활성화

#### AWS IAM (9개 패턴)
- ✅ `Action: *` (모든 권한 허용)
- ✅ `Resource: *` (모든 리소스 접근)
- ✅ 관리자 정책 (Action: *, Resource: *)
- ✅ PassRole 과도한 권한
- ✅ AssumeRole 취약점 (조건부 제한 없음)
- ✅ NotAction 사용 (예상치 못한 권한)
- ✅ 조건부 제한 없음
- ✅ 권한 경계 없음
- ✅ MFA 요구사항 없음

#### GCP (7개 패턴)
- ✅ Owner/Editor 역할 (과도한 권한)
- ✅ allUsers/allAuthenticatedUsers (공개 접근)
- ✅ 서비스 계정 키 노출 (Critical)
- ✅ 기본 서비스 계정 사용
- ✅ 과도한 역할 바인딩
- ✅ Storage 버킷 공개 접근
- ✅ VPC 방화벽 규칙 과도 (0.0.0.0/0)

#### Azure (9개 패턴)
- ✅ `*` Source Address
- ✅ `0.0.0.0/0` 또는 `::/0` IP 범위
- ✅ Storage Account 공개 액세스
- ✅ Key Vault 과도한 권한
- ✅ RBAC 과도한 권한 (Owner/Contributor)
- ✅ NSG 모든 포트 허용
- ✅ 모든 프로토콜 허용
- ✅ 우선순위 미설정
- ✅ 방향성 없는 규칙

#### 일반 보안 취약점 (7개 패턴)
- ✅ 하드코딩된 자격증명 (Critical)
- ✅ AWS Access Key 노출 (Critical)
- ✅ Private Key 노출 (Critical)
- ✅ JWT 토큰 노출
- ✅ 데이터베이스 연결 문자열 노출
- ✅ 주석 내 민감한 정보
- ✅ 다수의 하드코딩된 IP 주소

**심각도 분류**: Critical → High → Medium → Low (자동 정렬)

### LLM 심층 분석

OpenAI GPT-4o-mini API를 활용한 지능형 분석 시스템입니다.

#### 분석 항목
1. **위험도 평가**: High / Medium / Low
2. **주요 문제 설정**: 발견된 Misconfiguration 목록
3. **잠재적 위협**: 실제 사고로 이어질 수 있는 시나리오
4. **개선된 설정**: 패치된 JSON 설정 파일 자동 생성

#### 토큰 최적화
- `gpt-4o-mini` 모델 사용 (비용 절감)
- `max_tokens: 2000` 제한
- 효율적인 프롬프트 구조

---

## 🎨 UI/UX 특징

### 레이아웃
- **2단 구성**: 
  - 왼쪽: 원본 정책 뷰어 (JSON/YAML 포맷팅 표시)
  - 오른쪽: 분석 결과 패널 (필터링 결과 + LLM 분석)

### 입력 방식
- **탭 기반 전환**: 파일 업로드 ↔ 텍스트 입력
- **실시간 분석**: 텍스트 입력 시 자동으로 1차 필터링 실행
- **샘플 템플릿**: 빠른 테스트를 위한 예제 로드 버튼

### 시각적 피드백
- **심각도 배지**: 각 문제의 심각도를 색상으로 표시
- **요약 통계**: Critical/High/Medium/Low별 개수 표시
- **호버 효과**: 인터랙티브한 사용자 경험
- **로딩 상태**: 분석 중 상태 표시

### 반응형 디자인
- 데스크톱: 2단 레이아웃
- 태블릿/모바일: 1단 레이아웃 (세로 스크롤)

---

## 🛡️ 보안 고려사항

### React2Shell 취약점 (CVE-2025-55182)

✅ **현재 프로젝트는 React2Shell 취약점의 영향을 받지 않습니다.**

**이유**:
- React 버전: **18.2.0** (취약점은 React 19에만 영향)
- Next.js 미사용 (Vite + React만 사용)
- React Server Components (RSC) 미사용

**참고**: [Vercel React2Shell Security Bulletin](https://vercel.com/kb/bulletin/react2shell)

### 일반 보안

#### API 키 보호
- ✅ **Vercel Functions 사용**: API 키가 서버 사이드에서만 사용됨 (프로덕션 환경)
- ✅ `.env` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않음
- ✅ Vercel 대시보드에서 환경 변수 관리 (프로덕션)
- ⚠️ **로컬 개발**: Vercel CLI (`vercel dev`) 사용 시 서버 사이드에서 실행됨

#### 데이터 처리
- ✅ 모든 분석은 브라우저에서 실행 (1차 필터링)
- ✅ 업로드된 파일은 서버로 전송되지 않음
- ⚠️ LLM 분석 시 설정 내용이 OpenAI API로 전송됨
- ⚠️ **민감한 정보가 포함된 실제 설정 파일은 업로드하지 마세요**

#### XSS 및 코드 인젝션 방지
- ✅ `dangerouslySetInnerHTML` 미사용
- ✅ 안전한 렌더링 방식 사용 (`JSON.stringify`)
- ✅ 입력 검증 및 에러 처리 적절히 구현

#### 샘플 파일
- ✅ 교육 목적으로만 사용되는 샘플 파일
- ✅ 실제 자격증명이나 키는 포함되지 않음

### 상세 보안 분석

자세한 보안 분석 리포트는 [`SECURITY_ANALYSIS.md`](./SECURITY_ANALYSIS.md)를 참조하세요.

**보안 점수**: 9.2/10 (양호)

---

## 🧪 사용 방법

### 기본 워크플로우

1. **개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **입력 방식 선택**
   - **파일 업로드**: "📁 파일 업로드" 탭에서 파일 선택 또는 샘플 파일 로드
   - **텍스트 입력**: "✏️ 텍스트 입력" 탭에서 JSON/YAML 텍스트 직접 입력

3. **1차 필터링 결과 확인** (자동 실행)
   - 심각도별로 정렬된 문제 목록 확인
   - 각 문제의 설명 및 위치 확인

4. **LLM 심층 분석 실행**
   - "🤖 LLM 분석 시작" 버튼 클릭
   - 분석 완료까지 대기 (약 5-10초)

5. **분석 결과 확인**
   - 위험도 평가 확인
   - 주요 문제 설정 목록 확인
   - 잠재적 위협 시나리오 확인
   - 개선된 보안 설정 다운로드

### 텍스트 입력 예시

#### JSON 형식
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
```

#### YAML 형식 (기본 구조 지원)
```yaml
Version: "2012-10-17"
Statement:
  - Effect: Allow
    Action: "*"
    Resource: "*"
```

### 샘플 파일 사용

1. "📁 파일 업로드" 탭 선택
2. 하단의 샘플 파일 버튼 클릭:
   - **AWS S3 (Public)**: 공개 접근이 허용된 S3 버킷 정책
   - **AWS IAM (Admin)**: 모든 권한을 허용하는 관리자 정책
   - **GCP Service Account**: 과도한 권한이 부여된 서비스 계정
   - **Azure NSG (Open)**: 모든 IP를 허용하는 네트워크 보안 그룹

---

## 📦 배포 가이드

### Vercel 배포 (권장)

#### 1. Vercel CLI 설치 및 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel
```

#### 2. 환경 변수 설정

Vercel 대시보드에서 환경 변수를 설정하세요:

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 이동
4. 다음 환경 변수 추가:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `your-actual-openai-api-key`
   - **Environment**: Production, Preview, Development 모두 선택
5. **Save** 클릭

> ✅ **보안 개선**: Vercel Functions를 통해 API 키가 서버 사이드에서만 사용되므로 클라이언트에 노출되지 않습니다.

#### 3. 로컬에서 Vercel Functions 테스트 (선택사항)

로컬 개발 환경에서 Vercel Functions를 테스트하려면:

```bash
# Vercel CLI로 로컬 서버 실행
vercel dev
```

이 명령어는 Vercel Functions를 포함한 전체 애플리케이션을 로컬에서 실행합니다.

### Netlify 배포

```bash
# 빌드
npm run build

# Netlify CLI 설치 및 배포
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

환경 변수는 Netlify 대시보드에서 설정

### 기타 정적 호스팅

1. 프로젝트 빌드:
   ```bash
   npm run build
   ```

2. `dist/` 폴더의 내용을 호스팅 서비스에 업로드:
   - GitHub Pages
   - AWS S3 + CloudFront
   - Azure Static Web Apps
   - 기타 정적 호스팅 서비스

3. 환경 변수 설정:
   - 빌드 시점에 환경 변수가 번들에 포함되므로 주의 필요
   - 프로덕션에서는 프록시 서버 사용 권장

---

## 🔧 기술 스택

### 프론트엔드
- **React 18.2.0**: UI 라이브러리
- **Vite 5.0.8**: 빌드 도구 및 개발 서버
  - 빠른 HMR (Hot Module Replacement)
  - 최적화된 프로덕션 빌드

### 스타일링
- **Vanilla CSS**: 외부 의존성 없는 순수 CSS
- 모던 CSS 기능 활용 (Grid, Flexbox, CSS Variables)

### API 연동
- **OpenAI GPT-4o-mini API**: LLM 분석 엔진
  - 토큰 소모량 최적화
  - 효율적인 프롬프트 구조

### 개발 도구
- **ESLint**: 코드 품질 관리 (선택사항)
- **Git**: 버전 관리

---

## 💻 개발 가이드

### 코드 구조

#### 컴포넌트 계층
```
App.jsx
├── FileUpload.jsx (입력 처리)
├── PolicyViewer.jsx (원본 표시)
└── AnalysisPanel.jsx (결과 표시)
    ├── 1차 필터링 결과
    └── LLM 분석 결과
```

#### 유틸리티 함수
- `misconfigFilter.js`: 정규식 기반 패턴 매칭
- `llmAnalyzer.js`: OpenAI API 호출 및 응답 처리

### 새로운 패턴 추가하기

`src/utils/misconfigFilter.js` 파일에 새로운 탐지 패턴을 추가할 수 있습니다:

```javascript
// 예시: 새로운 패턴 추가
if (/새로운_패턴_정규식/.test(contentStr)) {
  issues.push({
    type: '새로운 문제 유형',
    description: '문제 설명',
    location: '발견 위치',
    severity: 'High' // Critical, High, Medium, Low
  })
}
```

### 스타일 커스터마이징

각 컴포넌트의 CSS 파일을 수정하여 스타일을 변경할 수 있습니다:
- `src/components/*.css`: 컴포넌트별 스타일
- `src/styles/*.css`: 전역 스타일

---

## 📊 성능 최적화

### 토큰 소모량 절감
- ✅ `gpt-4o-mini` 모델 사용 (비용 효율적)
- ✅ `max_tokens: 2000` 제한
- ✅ 효율적인 프롬프트 구조

### 브라우저 성능
- ✅ 1차 필터링은 클라이언트에서만 실행 (서버 불필요)
- ✅ React 최적화 (불필요한 리렌더링 방지)
- ✅ Vite 빌드 최적화

---

## 🐛 알려진 제한사항

1. **YAML 파싱**: 기본적인 YAML 구조만 지원 (복잡한 YAML은 JSON으로 변환 권장)
2. **LLM 분석**: OpenAI API 키 필요, 인터넷 연결 필요
3. **클라이언트 사이드 API 호출**: 프로덕션 환경에서는 프록시 서버 사용 권장

---

## 🤝 기여

버그 리포트, 기능 제안, 개선 사항은 이슈로 등록해주세요.

### 기여 방법
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

## 🙏 감사의 말

- 바이브코딩 커뮤니티
- OpenAI GPT API
- React 및 Vite 개발팀

---

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for 바이브코딩 입문자**
