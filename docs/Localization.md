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

각 Column 컴포넌트에 대해:

1. **감사 단계**
   - 컴포넌트 내 모든 한국어 텍스트 식별
   - 번역이 필요한 모든 텍스트 문서화
   - 포함 항목:
     - UI 레이블과 버튼
     - 에러 메시지
     - 툴팁과 도움말 텍스트
     - 기술적 설명
     - 디버그 정보

2. **번역 단계**
   - 식별된 텍스트의 영어 번역 생성
   - 기술적 정확성 유지
   - 교육적 성격의 설명 보존

3. **구현 단계**
   - 언어 전환 로직 구현
   - 한국어 텍스트는 하드코딩 유지 (변경 없음)
   - 영어 텍스트는 경로 기반 조건부 렌더링

## 기술 구현

### 정적 언어 감지 (훅 불필요)

React 훅이나 Context API 없이 **완전히 정적인** 접근 방식을 구현합니다:

#### 1. 전역 언어 설정
```typescript
// src/config/language.ts
export const LANG = window.location.pathname.startsWith('/en') ? 'en' : 'ko';

// 번역용 헬퍼 함수
export function t(ko: string, en: string): string {
  return LANG === 'en' ? en : ko;
}
```

#### 2. 컴포넌트 구현 패턴
```typescript
// 컴포넌트당 한 번만 import
import { t } from '@/config/language';

function SomeColumn() {
  return (
    <div>
      <h2>{t('한국어 제목', 'English Title')}</h2>
      <p>{t('한국어 설명', 'English description')}</p>
    </div>
  );
}
```

#### 3. 언어 전환 버튼
```typescript
// 언어 전환 버튼 컴포넌트
function LanguageSwitch() {
  const isEnglish = window.location.pathname.startsWith('/en');
  const targetLang = isEnglish ? 'ko' : 'en';
  const targetLabel = isEnglish ? '한국어' : 'English';
  
  const handleSwitch = () => {
    // URL의 언어 prefix를 교체하고 페이지 새로고침
    const newPath = window.location.pathname.replace(/^\/(en|ko)/, `/${targetLang}`);
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
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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