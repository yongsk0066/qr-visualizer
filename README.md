# QR Visualizer

<div align="center">
  <img src="src/assets/mascot.gif" width="240" height="240" alt="QR Visualizer Mascot">
  
  QR 코드 생성 및 디코딩 과정을 단계별로 시각화하여 교육하는 React 웹 애플리케이션입니다.
  
  🔗 **[Live Demo](https://yongsk0066.github.io/qr-visualizer/)**
</div>

## 📋 프로젝트 개요

**QR Visualizer**는 ISO/IEC 18004 표준을 따라 QR 코드가 어떻게 만들어지고 해석되는지 단계별로 보여주는 교육용 도구입니다.

### 주요 기능

- **Encoding Process**: QR 코드 생성 과정 7단계 시각화
- **Detection Process**: QR 코드 이미지 인식 과정 6단계 시각화
- **Decode Process**: QR 코드 데이터 디코딩 과정 6단계 시각화

## 🚀 기술 스택

- **Frontend**: React 19.1.0 with TypeScript
- **Build Tool**: Vite with experimental React Compiler
- **Styling**: Tailwind CSS 4.1.8
- **Package Manager**: Yarn Berry (4.9.2)
- **Testing**: Vitest 3.2.2 (380개 테스트)
- **Utilities**: @mobily/ts-belt (함수형 프로그래밍)
- **Computer Vision**: OpenCV.js (QR 검출 알고리즘)

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
│   ├── detect/            # Detection Process (이미지 → tri-state 행렬)
│   │   ├── image-processing/  # 이미지 처리
│   │   ├── binarization/      # 이진화
│   │   ├── finder-detection/  # Finder 패턴 검출
│   │   ├── homography/        # 원근 변환
│   │   ├── sampling/          # 모듈 샘플링
│   │   └── detectPipeline.ts  # Detection 파이프라인
│   ├── decode/            # Decode Process (tri-state → 데이터)
│   │   ├── format-extraction/    # 포맷 정보 추출
│   │   ├── version-extraction/   # 버전 정보 추출
│   │   ├── mask-removal/         # 마스크 패턴 제거
│   │   ├── data-reading/         # 데이터 모듈 읽기
│   │   ├── error-correction/     # Reed-Solomon 에러 정정
│   │   ├── data-extraction/      # 데이터 추출 및 디코딩
│   │   └── decodePipeline.ts     # Decode 파이프라인
│   └── types.ts           # 디코딩 관련 타입
├── components/            # UI 컴포넌트
│   ├── QREncodingProcess.tsx
│   ├── QRDetectProcess.tsx
│   ├── QRDecodeProcess.tsx
│   ├── encode/            # Encoding UI 컴포넌트
│   ├── detect/            # Detection UI 컴포넌트
│   └── decode/            # Decode UI 컴포넌트
└── shared/               # 공통 모듈 (타입, 상수, 유틸리티, 훅)
```

## 🚀 시작하기

### 요구사항

- Node.js 22 이상
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

## 🎨 주요 특징

- **교육적 시각화**: 각 단계별 상세한 시각적 피드백
- **실시간 처리**: 입력 변경 시 즉시 모든 단계 재계산
- **완벽한 표준 준수**: ISO/IEC 18004 표준 완벽 구현
- **다양한 입력 방식**: 텍스트 입력, 파일 업로드, 카메라, 3D 가상 카메라
- **상호작용적 UI**: 각 단계별 설명과 시각화 제공
- **모든 QR 버전 지원**: 버전 1-40까지 완벽 지원

## 🧪 테스트 현황

총 **346개** 테스트로 모든 QR 로직을 검증:

### 인코딩 테스트 (202개)

- 데이터 분석: 39개
- 데이터 인코딩: 21개
- 에러 정정: 37개
- 메시지 구성: 10개
- 모듈 배치: 77개
- 마스킹 패턴: 19개

### 디코딩 테스트 (75개)

- 이미지 처리 및 검출: 20개
- 포맷/버전 추출: 20개
- 마스크 제거 및 데이터 읽기: 21개
- 에러 정정 및 추출: 14개

### 통합 및 성능 테스트 (69개)

- 전체 파이프라인 테스트: 62개
- 성능 측정: 6개
- 유틸리티: 13개

## 🏗️ 구현 현황

### ✅ Encoding Process (완료)

모든 7단계 완전 구현:

1. 데이터 분석 및 모드 선택
2. 데이터 인코딩 (비트 스트림 생성)
3. Reed-Solomon 에러 정정
4. 최종 메시지 구성
5. 모듈 배치 (8개 세부 단계)
6. 마스킹 패턴 적용
7. 포맷/버전 정보 추가

### ✅ Detection Process (완료)

모든 6단계 완전 구현:

1. 이미지 입력 (파일 업로드, 카메라, 가상 카메라)
2. 그레이스케일 변환 (ITU-R BT.709 표준)
3. 이진화 (Sauvola 적응 임계값)
4. Finder 패턴 검출 (OpenCV.js 윤곽선 기반)
5. 원근 변환 (Homography with refinement)
6. 모듈 샘플링 (tri-state 행렬 생성)

### ✅ Decode Process (완료)

모든 6단계 완전 구현:

1. 포맷 정보 추출 (BCH 에러 정정 포함)
2. 버전 정보 추출 (v7+ QR 코드)
3. 마스크 패턴 제거 (8가지 패턴)
4. 데이터 모듈 읽기 (지그재그 패턴)
5. Reed-Solomon 에러 정정 (위치 매핑 수정)
6. 데이터 추출 (다중 모드 지원)

## 🆕 향후 추가 예정 기능

- **한글(Kanji) 모드 지원**: 현재 미구현된 한글 인코딩 모드 추가
- **ECI 모드 지원**: Extended Channel Interpretation 모드
- **Micro QR 코드**: 작은 크기의 QR 코드 형식 지원
- **자동 모드 감지**: 카메라 모드에서 자동 QR 코드 감지 및 디코딩
- **다국어 지원**: UI 및 설명 다국어화
- **QR 코드 생성 다운로드**: SVG/PNG 형식으로 QR 코드 다운로드

## 🤝 기여하기

이 프로젝트는 교육적 목적으로 만들어졌으며, 기여를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🎯 교육적 목표

이 프로젝트는 다음을 목표로 합니다:

- QR 코드의 내부 구조와 동작 원리 이해
- ISO/IEC 18004 표준의 실제 구현 방법 학습
- 컴퓨터 비전과 오류 정정 알고리즘 체험
- 단계별 시각화를 통한 직관적 학습

## 👥 만든 사람

- **Yongseok JANG** - [@yongsk0066](https://github.com/yongsk0066)

## 🙏 감사의 말

- QR 코드 표준을 만든 DENSO WAVE
- 오픈소스 커뮤니티
- 이 프로젝트를 사용하고 피드백을 주신 모든 분들

---

_QR Code is a registered trademark of DENSO WAVE INCORPORATED._
