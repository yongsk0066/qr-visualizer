# QR Visualizer

QR 코드 생성 과정을 단계별로 시각화하여 교육하는 React 웹 애플리케이션입니다.

## 📋 프로젝트 개요

**QR Visualizer**는 ISO/IEC 18004 표준을 따라 QR 코드가 어떻게 만들어지는지 7단계에 걸쳐 보여주는 교육용 도구입니다.

## 🚀 기술 스택

- **Frontend**: React 19.1.0 with TypeScript
- **Build Tool**: Vite with experimental React Compiler
- **Styling**: Tailwind CSS 4.1.8
- **Package Manager**: Yarn Berry (4.9.2)
- **Testing**: Vitest 3.2.2 (362개 테스트)
- **Utilities**: @mobily/ts-belt (함수형 프로그래밍)

## 📁 프로젝트 구조

```
src/
├── qr/                     # QR 코드 생성 로직
│   ├── analysis/           # 1단계: 데이터 분석
│   ├── encoding/           # 2단계: 데이터 인코딩
│   ├── error-correction/   # 3단계: 에러 정정
│   ├── message-construction/ # 4단계: 메시지 구성
│   ├── module-placement/   # 5단계: 모듈 배치 (8개 세부 단계)
│   ├── masking/           # 6단계: 마스킹 패턴
│   ├── final-generation/  # 7단계: 최종 QR 생성
│   └── qrPipeline.ts      # 전체 파이프라인 통합
├── components/            # UI 컴포넌트 (7개 컬럼)
└── shared/               # 공통 모듈 (타입, 상수, 유틸리티, 훅)
```

## 🚀 시작하기

### 요구사항

- Node.js 18 이상
- Yarn Berry (4.9.2)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/yongsk0066/qr-visualizer.git
cd qr-visualizer

# 의존성 설치
yarn install

# 개발 서버 시작 (http://localhost:5173)
yarn dev
```

### 기타 명령어

```bash
# 프로덕션 빌드
yarn build

# 테스트 실행
yarn test

# 린팅 실행
yarn lint

# TypeScript 타입 검사
yarn tsc --build

# 프로덕션 빌드 미리보기
yarn preview
```

## 🧪 테스트 현황

총 **362개** 테스트로 모든 QR 로직을 검증:

### 단위 테스트 (230개)

- 39개 데이터 분석 테스트
- 21개 데이터 인코딩 테스트
- 37개 에러 정정 테스트
- 10개 메시지 구성 테스트
- 77개 모듈 배치 테스트 (8개 세부 단계별, BCH 유틸리티 포함)
- 27개 마스킹 패턴 및 패널티 테스트
- 6개 성능 테스트

### 통합 테스트 (132개)

- 전체 QR 파이프라인 테스트
- 버전 1-40 전체 커버리지
- 에러 정정 레벨 (L, M, Q, H) 검증
- ISO/IEC 18004 표준 예제 검증

## 🆕 향후 추가 예정 기능

- **QR 코드 디코딩**: QR 코드를 역으로 해독하는 과정 시각화
- **한글(Kanji) 모드 지원**: 현재 미구현된 한글 인코딩 모드 추가
- **Micro QR 코드**: 작은 크기의 QR 코드 형식 지원
- **다국어 지원**: UI 및 설명 다국어화

## 📄 라이선스

MIT License

---

_QR Code is a registered trademark of DENSO WAVE INCORPORATED._
