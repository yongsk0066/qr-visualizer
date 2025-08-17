# QR Visualizer 다국어 지원 계획

## 개요

이 문서는 QR Visualizer의 국제화(i18n) 계획을 설명합니다. 기존 한국어 인터페이스를 유지하면서 영어 지원을 추가하는 것이 목표입니다.

## 아키텍처 결정사항

### 라우팅 전략: URL 기반 언어 선택

**경로 기반 다국어 지원**을 사용합니다:

- `/ko/*` - 한국어 버전 (기본값)
- `/en/*` - 영어 버전

**선택 이유:**

- SEO 친화적 (각 언어별 고유 URL)
- 공유 링크가 언어 설정을 유지
- GitHub Pages 정적 호스팅과 완벽 호환
- URL에서 언어를 명확히 표시

## 구현 방식

### 작업 구조

다국어 지원은 **계층적, 컴포넌트별** 접근 방식으로 구현됩니다:

```
1. QREncodingProcess
   ├── SettingsColumn
   ├── DataEncodingColumn
   ├── ErrorCorrectionColumn
   ├── MessageConstructionColumn
   ├── ModulePlacementColumn
   ├── MaskingColumn
   └── FinalGenerationColumn

2. QRDetectProcess
   ├── ImageInputColumn
   │   ├── FileInput
   │   ├── CameraInput
   │   └── VirtualCameraInput
   ├── GrayscaleColumn
   ├── BinarizationColumn
   ├── FinderDetectionColumn
   ├── RefinedHomographyColumn
   └── SamplingColumn

3. QRDecodeProcess
   ├── FormatExtractionColumn
   ├── VersionExtractionColumn
   ├── MaskRemovalColumn
   ├── DataReadingColumn
   ├── ErrorCorrectionColumn
   └── DataExtractionColumn
```

### 각 컴포넌트별 작업 프로세스

_알아둘것_

- 기존 프로젝트는 한국어 버전으로 되어있다.
- 한국어 버전임에도 영어가 쓰여도 이것을 한국어로 다시 바꿀 필요는 없음. 한국어 버전이라고 한국어만 쓰는 것은 아님. 기존 텍스트들은 그대로 보존하여 한국어 버전으로 분류

각 Column 컴포넌트에 대해:

1. **감사 단계**

   - 컴포넌트 내 모든 한국어 텍스트 식별
   - 번역이 필요한 모든 텍스트 식별
   - 포함 항목:
     - UI 레이블과 버튼
     - 에러 메시지
     - 툴팁과 도움말 텍스트
     - 기술적 설명
     - 디버그 정보

2. **번역 단계**

   - 식별된 텍스트의 영어 번역 생성(컴포넌트 단위로)
   - 기술적 정확성 유지
   - 최대한 원본 내용을 유지하면서 명확한 번역 제공

3. **구현 단계**

   - 각 컴포넌트에서 `t()` 헬퍼 함수 사용
   - 번역된 텍스트로 UI 업데이트

4. **테스트 단계**
   - Column 컴포넌트 단위의 작업이 끝나면, 해당 컬럼에 대해서 모든 요소들이 번역되었는지 재확인

## 기술 구현

### 정적 언어 감지 (훅 불필요)

React 훅이나 Context API 없이 **완전히 정적인** 접근 방식을 구현합니다:

#### 1. 전역 언어 설정

```typescript
// src/config/language.ts
export const LANG = window.location.pathname.startsWith("/en") ? "en" : "ko";

// 번역용 헬퍼 함수
export function t(ko: string, en: string): string {
  return LANG === "en" ? en : ko;
}
```

#### 2. 컴포넌트 구현 패턴

```typescript
// 컴포넌트당 한 번만 import
import { t } from "@/config/language";

function SomeColumn() {
  return (
    <div>
      <h2>{t("한국어 제목", "English Title")}</h2>
      <p>{t("한국어 설명", "English description")}</p>
    </div>
  );
}
```

#### 3. 언어 전환 버튼

```typescript
// 언어 전환 버튼 컴포넌트
function LanguageSwitch() {
  const isEnglish = window.location.pathname.startsWith("/en");
  const targetLang = isEnglish ? "ko" : "en";
  const targetLabel = isEnglish ? "한국어" : "English";

  const handleSwitch = () => {
    // URL의 언어 prefix를 교체하고 페이지 새로고침
    const newPath = window.location.pathname.replace(
      /^\/(en|ko)/,
      `/${targetLang}`
    );
    window.location.href = newPath;
  };

  return (
    <button onClick={handleSwitch} className="language-switch">
      {targetLabel}
    </button>
  );
}
```

#### 4. 라우터 설정

```typescript
// src/main.tsx 또는 App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 루트를 한국어 버전으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/ko" replace />} />

        {/* 언어 prefix가 있는 라우트 */}
        <Route path="/:lang/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 이 접근 방식의 주요 장점

1. **React 훅이나 Context 불필요**: 순수 정적 구현
2. **최소 번들 크기**: i18n 라이브러리 의존성 없음
3. **빠른 성능**: 페이지 로드 시 언어 한 번만 결정
4. **SEO 친화적**: 각 언어별 고유 URL
5. **간단한 구현**: `t()` 헬퍼 함수 하나만 필요
6. **타입 안전**: TypeScript 문자열 리터럴 지원

### 마이그레이션 전략

각 컴포넌트에서:

1. `t` 함수 import
2. 각 한국어 텍스트를 `t('한국어', 'English')`로 감싸기
3. 다른 구조적 변경 불필요

마이그레이션 예시:

```typescript
// 변경 전
<h2>1단계: 데이터 분석</h2>

// 변경 후
<h2>{t('1단계: 데이터 분석', 'Step 1: Data Analysis')}</h2>
```

## 범위

### 포함 범위

- 세 가지 주요 프로세스의 모든 사용자 대면 텍스트
- Column 제목과 설명
- 기술적 설명
- 에러 메시지
- 버튼 레이블
- 샘플 데이터 레이블

### 제외 범위 (1단계)

- 코드 주석
- 콘솔 로그
- 테스트 파일
- 문서 파일 (이 계획 제외)
- 변수명

## 예상 작업 시간

컴포넌트 수 기준:

- **QREncodingProcess**: 7개 컬럼 × ~2시간 = 14시간
- **QRDetectProcess**: 6개 컬럼 × ~2시간 = 12시간
- **QRDecodeProcess**: 6개 컬럼 × ~2시간 = 12시간
- **공통 컴포넌트 및 라우팅**: 8시간
- **테스트 및 개선**: 8시간

**총 예상**: ~54시간

## 진행 상황 체크리스트

### 🔧 인프라 설정

- [x] `src/config/language.ts` 파일 생성 ✅
- [x] `t()` 헬퍼 함수 구현 ✅
- [x] React Router 언어 prefix 설정 (`/:lang/*`) ✅
- [x] 루트 경로 → `/ko` 리다이렉트 설정 ✅
- [ ] 언어 전환 버튼 컴포넌트 생성
- [x] GitHub Pages 라우팅 설정 ✅

### 📝 QREncodingProcess (2/7)

- [x] **SettingsColumn** - 입력 설정 UI ✅
- [x] **DataEncodingColumn** - 데이터 인코딩 시각화 ✅
- [ ] **ErrorCorrectionColumn** - 에러 정정 시각화
- [ ] **MessageConstructionColumn** - 메시지 구성 시각화
- [ ] **ModulePlacementColumn** - 모듈 배치 시각화
- [ ] **MaskingColumn** - 마스킹 시각화
- [ ] **FinalGenerationColumn** - 최종 생성 시각화

### 📸 QRDetectProcess (0/6)

- [ ] **ImageInputColumn** - 이미지 입력
  - [ ] FileInput 서브컴포넌트
  - [ ] CameraInput 서브컴포넌트
  - [ ] VirtualCameraInput 서브컴포넌트
- [ ] **GrayscaleColumn** - 그레이스케일 변환
- [ ] **BinarizationColumn** - 이진화
- [ ] **FinderDetectionColumn** - Finder 패턴 검출
- [ ] **RefinedHomographyColumn** - 원근 변환
- [ ] **SamplingColumn** - 모듈 샘플링

### 🔍 QRDecodeProcess (0/6)

- [ ] **FormatExtractionColumn** - 포맷 정보 추출
- [ ] **VersionExtractionColumn** - 버전 정보 추출
- [ ] **MaskRemovalColumn** - 마스크 패턴 제거
- [ ] **DataReadingColumn** - 데이터 모듈 읽기
- [ ] **ErrorCorrectionColumn** - 에러 정정
- [ ] **DataExtractionColumn** - 데이터 추출

### 🎯 공통 컴포넌트

- [ ] **App.tsx** - 메인 헤더 및 푸터
- [ ] **ProcessingWrapper.tsx** - 프로세스 래퍼
- [ ] **BitStreamViewer.tsx** - 비트스트림 뷰어
- [ ] **샘플 데이터** - 각종 예제 텍스트

### ✅ 테스트 및 검증

- [ ] 한국어 경로 (`/ko`) 정상 작동
- [ ] 영어 경로 (`/en`) 정상 작동
- [ ] 언어 전환 버튼 작동
- [ ] 모든 한국어 텍스트 영어 번역 확인
- [ ] 기술 용어 정확성 검증
- [ ] 반응형 UI 확인

### 📊 진행률

- **총 컴포넌트**: 19개 메인 + 3개 서브 + 4개 공통 = 26개
- **완료**: 7개 (인프라 5개 + SettingsColumn 1개 + DataEncodingColumn 1개)
- **진행률**: 26.9%

## 성공 기준

- [ ] 세 가지 프로세스 모두 영어로 완전 번역
- [ ] URL 라우팅을 통한 언어 전환 작동
- [ ] 영어 모드에서 한국어 텍스트가 보이지 않음
- [ ] 번역의 기술적 정확성 유지
- [ ] 교육적 가치 보존
- [ ] 기존 한국어 인터페이스 기능 저하 없음

## 다음 단계

1. 라우팅 인프라 설정
2. language.ts 파일 생성
3. QREncodingProcess부터 시작
4. 위에 명시된 대로 컬럼별 진행
5. 각 프로세스 철저히 테스트
6. 적절한 라우팅 설정으로 GitHub Pages 배포

## 참고사항

- 한국어 인터페이스는 변경 없음 (번역 파일로 추출하지 않음)
- 영어 번역은 컴포넌트 내부에 인라인으로 작성
- 직역보다 교육적 명확성에 중점
- 기술 용어는 업계 표준을 따름
