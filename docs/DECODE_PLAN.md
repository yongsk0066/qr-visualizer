# QR 디코드 프로세스 구현 계획

## 개요

이 문서는 QR 코드 디코드 프로세스의 구현 계획을 설명합니다. 기존 `qr-encode` 구현의 아키텍처, 코딩 스타일, 테스팅 방식을 따라 일관성 있는 구조로 설계되었습니다.

## 아키텍처 원칙

### 1. 폴더 구조
```
src/qr-decode/decode/
├── format-extraction/          # 1단계: 포맷 정보 추출
│   ├── formatExtractor.ts      # 포맷 정보 추출 및 BCH 검증
│   ├── formatExtractor.test.ts # 포맷 추출 테스트
│   └── types.ts               # 포맷 관련 타입 정의
├── version-extraction/         # 2단계: 버전 정보 추출 (v7+)
│   ├── versionExtractor.ts     # 버전 정보 추출 및 BCH 검증
│   ├── versionExtractor.test.ts
│   └── types.ts
├── mask-removal/              # 3단계: 마스크 패턴 제거
│   ├── maskRemover.ts         # 마스크 패턴 역적용
│   ├── maskRemover.test.ts
│   └── types.ts
├── data-extraction/           # 4단계: 데이터 모듈 읽기
│   ├── moduleReader.ts        # 지그재그 패턴으로 모듈 읽기
│   ├── moduleReader.test.ts
│   ├── types.ts
│   └── utils/
│       ├── zigzagPattern.ts   # 지그재그 읽기 패턴 생성
│       └── skipAreas.ts       # 기능 패턴 영역 스킵
├── error-correction/          # 5단계: 에러 정정
│   ├── deInterleaver.ts       # 코드워드 디인터리빙
│   ├── deInterleaver.test.ts
│   ├── syndrome/              # 신드롬 계산 (에러 검출)
│   │   ├── syndromeCalculator.ts
│   │   └── syndromeCalculator.test.ts
│   ├── error-locator/         # 에러 위치 찾기
│   │   ├── berlekampMassey.ts
│   │   └── berlekampMassey.test.ts
│   └── types.ts
├── data-decoding/             # 6단계: 데이터 디코딩
│   ├── segmentParser.ts       # 세그먼트 파싱
│   ├── modeDecoder.ts         # 모드별 디코딩
│   ├── segmentParser.test.ts
│   ├── modeDecoder.test.ts
│   └── types.ts
├── decodePipeline.ts          # 메인 디코드 파이프라인
├── decodePipeline.test.ts     # 통합 테스트
└── types.ts                   # 전체 디코드 타입 정의
```

### 2. 코딩 스타일 가이드라인

#### 함수형 프로그래밍 (ts-belt 활용)
```typescript
// 파이프라인 패턴 사용
export const extractFormatInfo = (matrix: TriStateMatrix): FormatInfoResult => {
  return pipe(
    matrix,
    extractFormatBits,        // 포맷 비트 추출
    applyFormatMask,          // 마스크 패턴 적용
    validateBCH,              // BCH 검증
    decodeFormatInfo          // 포맷 정보 디코딩
  );
};

// 순수 함수와 불변성
const removeDataMask = (matrix: QRMatrix, maskPattern: number): QRMatrix => {
  return pipe(
    matrix,
    A.mapWithIndex((rowIndex, row) =>
      pipe(
        row,
        A.mapWithIndex((colIndex, module) =>
          isDataModule(rowIndex, colIndex)
            ? applyMaskFormula(module, maskPattern, rowIndex, colIndex)
            : module
        )
      )
    )
  );
};
```

#### 타입 정의 패턴
```typescript
// 기본 타입
export type TriStateModule = -1 | 0 | 1;
export type TriStateMatrix = TriStateModule[][];

// 단계별 결과 타입
export interface FormatInfoResult {
  errorLevel: ErrorCorrectionLevel;
  maskPattern: MaskPattern;
  isValid: boolean;
  rawBits: string;
  confidence: number;
}

export interface DecodedSegment {
  mode: QRMode;
  data: string;
  characterCount: number;
  bitLength: number;
}

// 파이프라인 결과 타입
export interface DecodePipelineResult {
  formatInfo: FormatInfoResult | null;
  versionInfo: VersionInfoResult | null;
  unmaskedMatrix: QRMatrix | null;
  rawBitStream: string | null;
  codewords: CodewordBlocks | null;
  correctedData: CorrectedData | null;
  decodedMessage: string | null;
  error?: DecodeError;
}
```

### 3. 테스팅 전략

#### 테스트 구조 (한국어)
```typescript
describe('formatExtractor', () => {
  describe('포맷 비트 추출', () => {
    it('왼쪽 상단 파인더 주변에서 포맷 비트를 추출해야 함', () => {
      // 테스트 구현
    });
    
    it('오른쪽 하단에서 중복된 포맷 비트를 추출해야 함', () => {
      // 테스트 구현
    });
  });
  
  describe('BCH 에러 정정', () => {
    it('1비트 에러를 정정할 수 있어야 함', () => {
      // 테스트 구현
    });
    
    it('2비트 에러를 검출할 수 있어야 함', () => {
      // 테스트 구현
    });
  });
  
  describe('엣지 케이스', () => {
    it('알 수 없는 모듈(-1)이 포함된 경우 처리해야 함', () => {
      // 테스트 구현
    });
  });
  
  describe('ISO/IEC 18004 규격 준수', () => {
    it('표준 예제의 포맷 정보를 올바르게 디코딩해야 함', () => {
      // ISO 표준 문서의 예제 사용
    });
  });
});
```

#### 테스트 픽스처
```typescript
// 테스트용 QR 매트릭스 생성
export const createTestMatrix = (version: number): TriStateMatrix => {
  const size = 17 + version * 4;
  return Array(size).fill(null).map(() => Array(size).fill(0));
};

// 알려진 QR 코드 샘플
export const KNOWN_QR_SAMPLES = {
  version1L: {
    message: "HELLO WORLD",
    matrix: createVersion1LMatrix(),
    formatInfo: 0x5412,
    maskPattern: 2
  }
};
```

### 4. UI 컴포넌트 구조

#### 메인 프로세스 컴포넌트
```typescript
export function QRDecodeProcess({ triStateMatrix }: QRDecodeProcessProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [decodeResult, setDecodeResult] = useState<DecodePipelineResult | null>(null);
  const processingRef = useRef(false);
  
  useEffect(() => {
    const processDecoding = async () => {
      if (!triStateMatrix || processingRef.current) return;
      
      processingRef.current = true;
      setIsProcessing(true);
      
      try {
        const result = await runDecodePipeline(triStateMatrix);
        setDecodeResult(result);
      } catch (error) {
        console.error('Decode error:', error);
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
      }
    };
    
    processDecoding();
  }, [triStateMatrix]);
  
  return (
    <div className="steps-grid">
      <ProcessingWrapper isProcessing={isProcessing}>
        <FormatExtractionColumn formatInfo={decodeResult?.formatInfo ?? null} />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <MaskRemovalColumn 
          maskedMatrix={triStateMatrix?.matrix ?? null}
          maskPattern={decodeResult?.formatInfo?.maskPattern ?? null}
          unmaskedMatrix={decodeResult?.unmaskedMatrix ?? null} 
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <DataExtractionColumn bitStream={decodeResult?.rawBitStream ?? null} />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <ErrorCorrectionColumn 
          codewords={decodeResult?.codewords ?? null}
          correctedData={decodeResult?.correctedData ?? null} 
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <DataDecodingColumn 
          segments={decodeResult?.segments ?? null}
          decodedMessage={decodeResult?.decodedMessage ?? null} 
        />
      </ProcessingWrapper>
      
      <ProcessingWrapper isProcessing={isProcessing}>
        <FinalResultColumn 
          message={decodeResult?.decodedMessage ?? null}
          error={decodeResult?.error} 
        />
      </ProcessingWrapper>
    </div>
  );
}
```

#### 개별 단계 컴포넌트
```typescript
interface FormatExtractionColumnProps {
  formatInfo: FormatInfoResult | null;
}

export function FormatExtractionColumn({ formatInfo }: FormatExtractionColumnProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-bold mb-4">1단계: 포맷 정보 추출</h2>
      
      {!formatInfo ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-sm">대기 중...</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">에러 정정 레벨:</span>
                <span className="font-mono font-semibold">{formatInfo.errorLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">마스크 패턴:</span>
                <span className="font-mono font-semibold">{formatInfo.maskPattern}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">포맷 비트 (15비트)</h3>
              <div className="bg-gray-100 rounded p-2">
                <BitStreamViewer 
                  bits={formatInfo.rawBits}
                  highlights={[
                    { start: 0, end: 2, color: 'bg-blue-200', label: '에러 레벨' },
                    { start: 2, end: 5, color: 'bg-green-200', label: '마스크 패턴' },
                    { start: 5, end: 15, color: 'bg-yellow-200', label: 'BCH 에러 정정' }
                  ]}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">신뢰도:</span>
                <span>{(formatInfo.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${formatInfo.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 구현 우선순위

### Phase 1: 핵심 디코딩 (1-2주)
1. **포맷 정보 추출** - BCH 에러 정정 포함
2. **마스크 패턴 제거** - 8가지 마스크 패턴 역적용
3. **데이터 모듈 읽기** - 지그재그 패턴 구현

### Phase 2: 에러 정정 (1-2주)
1. **디인터리빙** - 블록 구조 복원
2. **Reed-Solomon 디코딩** - 기존 encode 로직 활용
3. **에러 검출 및 정정** - 신드롬 계산

### Phase 3: 데이터 디코딩 (1주)
1. **모드 감지** - 모드 인디케이터 파싱
2. **세그먼트 디코딩** - 각 모드별 디코딩
3. **최종 메시지 조합** - 멀티 세그먼트 처리

### Phase 4: UI 및 시각화 (1주)
1. **단계별 시각화 컴포넌트**
2. **에러 처리 및 피드백**
3. **통합 테스트 및 문서화**

## 예상 결과물

### 1. 기능적 요구사항
- Tri-state 매트릭스(-1, 0, 1)를 입력받아 원본 메시지 추출
- 각 디코딩 단계의 시각적 표현
- 에러 검출 및 정정 과정 시각화
- 다양한 QR 버전(1-40) 및 에러 레벨(L,M,Q,H) 지원

### 2. 교육적 가치
- ISO/IEC 18004 표준의 디코딩 프로세스 이해
- Reed-Solomon 에러 정정의 실제 작동 방식
- QR 코드의 데이터 구조와 인코딩 방식 학습

### 3. 코드 품질
- 95% 이상의 테스트 커버리지
- 함수형 프로그래밍 패러다임 준수
- TypeScript 엄격 모드 준수
- 한국어 테스트 및 주석으로 이해도 향상

## 참고 사항

### 기존 코드 재사용
- `qr-encode/error-correction/reed-solomon/` - Galois Field 연산
- `qr-encode/module-placement/utils/` - 매트릭스 유틸리티
- `shared/utils/binary.ts` - 바이너리 변환 함수

### 주의 사항
- Unknown 모듈(-1) 처리 전략 필요
- 부분적으로 손상된 QR 코드 처리
- 성능 최적화 (대용량 QR 코드)

이 계획을 바탕으로 체계적이고 교육적인 QR 디코드 프로세스를 구현할 예정입니다.