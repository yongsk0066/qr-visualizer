# QR 디코딩 구현 계획

## 1. 프로젝트 개요

QR Visualizer의 디코딩 기능을 추가하여, QR 코드 이미지를 입력받아 원본 데이터로 복원하는 과정을 단계별로 시각화합니다.

### 1.1 목표
- 라이브러리 없이 순수 JavaScript/TypeScript로 QR 코드 디코딩 구현
- **두 개의 독립적인 프로세스**: DetectProcess(이미지→행렬)와 DecodeProcess(행렬→데이터)
- 각 프로세스별 7단계 UI 구조로 과정 시각화
- 손상되거나 로고가 삽입된 QR 코드도 처리 가능한 견고한 시스템

### 1.2 핵심 원칙
- **프로세스 분리**: DetectProcess와 DecodeProcess를 완전히 독립적으로 구현
- **계층 분리**: Detector(이미지→행렬) / Decoder(행렬→데이터) / UI 완전 분리
- **Tri-state 행렬**: 불확실한 모듈은 -1로 표시하여 디코더에서 복구
- **단계별 시각화**: 각 처리 단계의 중간 결과를 실시간으로 표시

## 2. 아키텍처 설계

### 2.1 전체 구조
```
src/
├── qr-encode/              # QR Encoding Process (기존)
│   └── ...                 # 인코딩 관련 모듈들
│
├── qr-decode/
│   ├── detect/             # DetectProcess: 이미지 → tri-state 행렬
│   │   ├── detector/
│   │   │   ├── imageProcessor.ts    # 그레이스케일, 정규화
│   │   │   ├── binarization.ts      # Sauvola 적응 임계값
│   │   │   ├── finderDetection.ts   # Finder 패턴 검출
│   │   │   ├── homography.ts        # 원근 변환
│   │   │   └── sampling.ts          # 모듈 샘플링
│   │   └── detectPipeline.ts        # Detection 파이프라인
│   │
│   ├── decode/             # DecodeProcess: tri-state 행렬 → 원본 데이터
│   │   ├── decoder/
│   │   │   ├── formatInfo.ts        # 포맷 정보 추출
│   │   │   ├── versionInfo.ts       # 버전 정보 추출
│   │   │   ├── dataExtraction.ts    # 데이터 비트 추출
│   │   │   ├── errorCorrection.ts   # Reed-Solomon 복구
│   │   │   └── dataDecoding.ts      # 비트→텍스트 변환
│   │   └── decodePipeline.ts        # Decoding 파이프라인
│   │
│   └── types.ts            # 공통 타입 정의
│
├── components/
│   ├── QREncodingProcess.tsx    # Encoding 프로세스 UI
│   ├── QRDetectProcess.tsx      # Detection 프로세스 UI
│   ├── QRDecodeProcess.tsx      # Decoding 프로세스 UI (TODO)
│   │
│   ├── encode/              # Encoding UI 컴포넌트
│   │   └── ... (8개 컬럼 컴포넌트)
│   │
│   ├── detect/              # Detection UI 컴포넌트
│   │   ├── ImageInputColumn.tsx      # 1단계: 이미지 입력
│   │   ├── GrayscaleColumn.tsx       # 2단계: 그레이스케일 변환
│   │   ├── BinarizationColumn.tsx    # 3단계: 이진화
│   │   ├── FinderDetectionColumn.tsx # 4단계: Finder 패턴 검출 (TODO)
│   │   ├── HomographyColumn.tsx      # 5단계: 원근 변환 (TODO)
│   │   ├── SamplingColumn.tsx        # 6단계: 모듈 샘플링 (TODO)
│   │   └── MatrixOutputColumn.tsx    # 7단계: Tri-state 행렬 출력 (TODO)
│   │
│   └── decode/              # Decoding UI 컴포넌트 (TODO)
│       ├── MatrixInputColumn.tsx     # 1단계: 행렬 입력
│       ├── FormatInfoColumn.tsx      # 2단계: 포맷 정보 추출
│       ├── DataExtractionColumn.tsx  # 3단계: 데이터 추출
│       ├── ErrorAnalysisColumn.tsx   # 4단계: 에러 분석
│       ├── CorrectionColumn.tsx      # 5단계: 에러 정정
│       ├── DecodingColumn.tsx        # 6단계: 데이터 디코딩
│       └── ResultColumn.tsx          # 7단계: 최종 결과
```

### 2.2 데이터 플로우

#### 2.2.1 DetectProcess 데이터 플로우
```typescript
interface DetectPipelineResult {
  imageProcessing: ImageProcessingResult | null;
  binarization: BinarizationResult | null;
  finderDetection: FinderDetectionResult | null;
  homography: HomographyResult | null;
  sampling: SamplingResult | null;
  triStateMatrix: TriStateQR | null;
}
```

#### 2.2.2 DecodeProcess 데이터 플로우
```typescript
interface DecodePipelineResult {
  matrixInput: TriStateQR | null;
  formatInfo: FormatInfoResult | null;
  dataExtraction: ExtractionResult | null;
  errorAnalysis: ErrorAnalysisResult | null;
  correction: CorrectionResult | null;
  decoding: DecodingResult | null;
  finalResult: FinalResult | null;
}
```

## 3. DetectProcess 단계 상세 설계

### 3.1 Step 1: 이미지 입력 및 전처리 ✅
```typescript
interface ImageProcessingResult {
  original: ImageData;
  grayscale: Uint8Array;
  normalized: Float32Array;  // 광도 정규화
  blurred: Float32Array;     // 가우시안 블러
}
```
**구현 완료**:
- 파일 업로드 및 드래그앤드롭 지원
- 테스트용 샘플 이미지 자동 로드
- 이미지 크기 및 메타데이터 표시

### 3.2 Step 2: 그레이스케일 변환 ✅
```typescript
interface GrayscaleResult {
  grayscale: Uint8Array;
  statistics: {
    min: number;
    max: number;
    mean: number;
    histogram: number[];
  };
}
```
**구현 완료**:
- ITU-R BT.709 표준 luma 계수 적용
- 실시간 히스토그램 시각화
- 통계 정보 계산 (최소/최대/평균)

### 3.3 Step 3: 이진화 (Sauvola 적응 임계값) ✅
```typescript
interface BinarizationResult {
  binary: Uint8Array;        // 0/1 이진 이미지
  threshold: Float32Array;   // Sauvola 임계값 맵
  parameters: {
    windowSize: number;      // 31px (최적화)
    k: number;              // 0.2 (최적화)
  };
}
```
**구현 완료**:
- Sauvola 적응 임계값 알고리즘
- 적분 이미지를 통한 O(1) 지역 통계 계산
- 임계값 맵 시각화 토글 기능

### 3.4 Step 4: Finder 패턴 검출 ✅
```typescript
interface FinderDetectionResult {
  candidates: Pattern[];     // 1:1:3:1:1 비율 후보
  selected: [Point, Point, Point];  // 최종 3점
  scanLines: {
    horizontal: RunLength[];
    vertical: RunLength[];
  };
}
```
**구현 완료**:
- 라인 스캔 알고리즘 (수평/수직)
- 1:1:3:1:1 비율 검증 (50% 허용 오차)
- 개선된 3점 선택 (각도 검증)
- 서브픽셀 정확도의 중심점 검출
- 시각적 패턴 하이라이팅

### 3.5 Step 5: 원근 변환 (Homography)
```typescript
interface HomographyResult {
  transform: Float64Array;   // 3x3 변환 행렬
  corners: [Point, Point, Point, Point];
  version: number;          // 타이밍 패턴으로 추정
}
```

### 3.6 Step 6: 모듈 샘플링
```typescript
interface SamplingResult {
  size: number;             // 모듈 수 (21~177)
  samplingGrid: Point[][];  // 샘플링 좌표
  confidence: number[][];   // 각 모듈 신뢰도
}
```

### 3.7 Step 7: Tri-state 행렬 생성
```typescript
interface TriStateQR {
  size: number;             // 모듈 수 (21~177)
  matrix: (-1|0|1)[][];     // tri-state 행렬
  finder: [Point, Point, Point];  // 디버깅용
  statistics: {
    black: number;          // 0의 개수
    white: number;          // 1의 개수
    unknown: number;        // -1의 개수
  };
}
```

## 4. DecodeProcess 단계 설계

### 4.1 Step 1: Tri-state 행렬 입력
```typescript
interface MatrixInputResult {
  matrix: TriStateQR;
  validation: {
    isValid: boolean;
    detectedVersion: number;
    errors: string[];
  };
}
```

### 4.2 Step 2: 포맷/버전 정보 추출
```typescript
interface FormatInfoResult {
  errorLevel: ErrorCorrectionLevel;
  maskPattern: number;
  version: number;
  formatBits: string;      // 15비트
  versionBits?: string;    // 18비트 (버전 7+)
}
```

### 4.3 Step 3: 데이터 비트 추출
```typescript
interface DataExtractionResult {
  maskedData: number[];    // 마스크 제거 전
  unmaskedData: number[];  // 마스크 제거 후
  erasures: number[];      // -1 위치 인덱스
  bitStream: string;       // 전체 비트스트림
}
```

### 4.4 Step 4: 에러 분석
```typescript
interface ErrorAnalysisResult {
  totalCodewords: number;
  dataCodewords: number;
  ecCodewords: number;
  erasureCount: number;
  errorCapacity: number;
  isRecoverable: boolean;
}
```

### 4.5 Step 5: 에러 정정
```typescript
interface CorrectionResult {
  correctedData: number[];
  errorPositions: number[];
  correctionSuccess: boolean;
  syndromes: number[];
}
```

### 4.6 Step 6: 데이터 디코딩
```typescript
interface DecodingResult {
  mode: QRMode;
  characterCount: number;
  decodedText: string;
  segments: DecodedSegment[];
}
```

### 4.7 Step 7: 최종 결과
```typescript
interface FinalResult {
  success: boolean;
  data: string;
  metadata: {
    version: number;
    errorLevel: ErrorCorrectionLevel;
    maskPattern: number;
    mode: QRMode;
  };
  confidence: number;
}

```

## 5. UI/UX 설계

### 5.1 전체 레이아웃
```
App.tsx
├── QREncodingProcess (기존)
├── QRDetectProcess   (새로 추가)
└── QRDecodeProcess   (새로 추가)
```

### 5.2 DetectProcess UI
- QREncodingProcess와 동일한 7컬럼 그리드 구조
- 각 단계별 시각화 캔버스
- 실시간 처리 상태 표시

#### 5.2.1 DetectProcess 시각화 요소
1. **이미지 입력**: 원본 이미지 표시, 파일 업로드/드래그앤드롭
2. **그레이스케일**: 변환된 흑백 이미지, 히스토그램
3. **이진화**: Sauvola 결과, 임계값 맵
4. **Finder 검출**: 후보 패턴 표시, 최종 3점 하이라이트
5. **원근 변환**: 변환 격자 오버레이, 추정 버전
6. **샘플링**: 샘플링 포인트 표시, 신뢰도 맵
7. **행렬 출력**: Tri-state 행렬 시각화 (-1은 회색)

### 5.3 DecodeProcess UI
- 동일한 7컬럼 그리드 구조
- DetectProcess의 출력을 입력으로 받음

#### 5.3.1 DecodeProcess 시각화 요소
1. **행렬 입력**: Tri-state 행렬 표시, 통계 정보
2. **포맷 정보**: BCH 디코딩 과정, 추출된 메타데이터
3. **데이터 추출**: 마스크 제거 전/후 비교
4. **에러 분석**: Erasure 위치 표시, 복구 가능성
5. **에러 정정**: Reed-Solomon 과정, 수정된 위치
6. **데이터 디코딩**: 모드별 디코딩 과정
7. **최종 결과**: 복원된 텍스트, 성공/실패 상태

### 5.4 주요 기능
- 프로세스 전환 탭/라우팅
- 샘플 이미지 제공 (정상/손상/로고 QR)
- 각 단계 디버그 뷰
- 처리 시간 표시
- DetectProcess → DecodeProcess 자동 연결 옵션

## 6. 성능 목표

- 1080×1080 이미지: < 20ms
- 2160×2160 이미지: < 50ms
- 메모리 사용: < 50MB
- 60fps 실시간 처리 가능

## 7. 구현 우선순위

### Phase 1: DetectProcess 구현 (진행 중)
1. ✅ 프로젝트 구조 설정 및 라우팅
2. ✅ 이미지 입력 UI 컴포넌트 (드래그앤드롭, 샘플 이미지)
3. ✅ 그레이스케일/이진화 구현 (ITU-R BT.709, Sauvola 알고리즘)
4. ✅ Finder 패턴 검출 알고리즘 (라인 스캔, 개선된 3점 선택)
5. ⏳ 원근 변환 및 샘플링
6. ⏳ Tri-state 행렬 생성
7. ⏳ DetectProcess 7단계 UI 완성

### Phase 2: DecodeProcess 구현 (2주차)
1. 행렬 입력 UI 컴포넌트
2. 포맷/버전 정보 BCH 디코딩
3. 마스크 제거 및 데이터 추출
4. 에러 분석 로직
5. Reed-Solomon 에러 정정
6. 모드별 데이터 디코딩
7. DecodeProcess 7단계 UI 완성

### Phase 3: 통합 및 고급 기능 (3주차)
1. DetectProcess → DecodeProcess 연결
2. 손상된 QR 복구 개선
3. 로고 삽입 QR 처리
4. 성능 최적화 (WebWorker)
5. 포괄적 테스트 작성
6. 샘플 이미지 및 문서 정리

## 8. 테스트 전략

### 8.1 단위 테스트
- 각 처리 함수별 테스트
- 다양한 QR 버전/에러 레벨
- 엣지 케이스 처리

### 8.2 통합 테스트
- 전체 파이프라인 테스트
- 실제 QR 이미지 샘플
- 손상된 QR 복구 검증

### 8.3 성능 테스트
- 처리 시간 측정
- 메모리 사용량 모니터링
- 다양한 이미지 크기

## 9. 주의사항

1. **Tri-state 원칙**: 불확실한 모듈은 추측하지 않고 -1로 표시
2. **계층 분리**: Detector와 Decoder의 책임 명확히 구분
3. **점진적 구현**: 기본 기능부터 구현 후 고급 기능 추가
4. **디버그 뷰**: 각 단계 시각화로 문제 추적 용이하게

## 10. 참고 자료

- ISO/IEC 18004 표준 (디코딩 섹션)
- Reed-Solomon 에러 정정 알고리즘
- Sauvola 적응 임계값 논문
- Homography 변환 수학