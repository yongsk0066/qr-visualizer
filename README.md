# QR Visualizer

QR 코드 생성 및 디코딩 과정을 단계별로 시각화하여 교육하는 React 웹 애플리케이션입니다.

## 📋 프로젝트 개요

**QR Visualizer**는 ISO/IEC 18004 표준을 따라 QR 코드가 어떻게 만들어지고 해석되는지 단계별로 보여주는 교육용 도구입니다.

### 주요 기능
- **Encoding Process**: QR 코드 생성 과정 7단계 시각화
- **Detection Process**: QR 코드 이미지 인식 과정 7단계 시각화 (개발 중)

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
├── qr-encode/              # QR 코드 인코딩 로직
│   ├── analysis/           # 1단계: 데이터 분석
│   ├── encoding/           # 2단계: 데이터 인코딩
│   ├── error-correction/   # 3단계: 에러 정정
│   ├── message-construction/ # 4단계: 메시지 구성
│   ├── module-placement/   # 5단계: 모듈 배치 (8개 세부 단계)
│   ├── masking/           # 6단계: 마스킹 패턴
│   ├── final-generation/  # 7단계: 최종 QR 생성
│   └── qrPipeline.ts      # 전체 파이프라인 통합
├── qr-decode/             # QR 코드 디코딩 로직
│   ├── detect/            # Detection Process
│   │   ├── detector/      # 이미지 처리 알고리즘
│   │   └── detectPipeline.ts
│   └── types.ts           # 디코딩 관련 타입
├── components/            # UI 컴포넌트
│   ├── QREncodingProcess.tsx
│   ├── QRDetectProcess.tsx
│   ├── encode/            # Encoding UI 컴포넌트
│   └── detect/            # Detection UI 컴포넌트
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

## 🏗️ 현재 개발 중

### Detection Process (구현 중)
- ✅ Step 1: 이미지 입력 (파일 업로드, 드래그앤드롭)
- ✅ Step 2: 그레이스케일 변환 (히스토그램 시각화)
- ✅ Step 3: 이진화 (Sauvola 적응 임계값)
- ⏳ Step 4: Finder 패턴 검출
- ⏳ Step 5: 원근 변환 (Homography)
- ⏳ Step 6: 모듈 샘플링
- ⏳ Step 7: Tri-state 행렬 생성

## 🆕 향후 추가 예정 기능

- **Decode Process**: Tri-state 행렬에서 원본 데이터 복원
- **한글(Kanji) 모드 지원**: 현재 미구현된 한글 인코딩 모드 추가
- **Micro QR 코드**: 작은 크기의 QR 코드 형식 지원
- **실시간 카메라 입력**: 웹캠을 통한 실시간 QR 인식
- **다국어 지원**: UI 및 설명 다국어화

## 📄 라이선스

MIT License

---

_QR Code is a registered trademark of DENSO WAVE INCORPORATED._
