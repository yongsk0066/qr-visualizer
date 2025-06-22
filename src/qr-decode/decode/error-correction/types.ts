/**
 * 에러 정정 결과
 */
export interface ErrorCorrectionResult {
  /** 정정된 데이터 코드워드 */
  correctedDataCodewords: number[];
  
  /** 블록별 정정 결과 */
  blockResults: BlockCorrectionResult[];
  
  /** 전체 에러 개수 */
  totalErrors: number;
  
  /** 정정 가능 여부 */
  isRecoverable: boolean;
  
  /** 정정 신뢰도 (0-1) */
  confidence: number;
  
  /** 각 블록의 신드롬 (디버깅용) */
  syndromes: number[][];
}

/**
 * 블록별 정정 결과
 */
export interface BlockCorrectionResult {
  /** 블록 번호 */
  blockIndex: number;
  
  /** 원본 코드워드 (데이터 + EC) */
  originalCodewords: number[];
  
  /** 정정된 코드워드 */
  correctedCodewords: number[];
  
  /** 에러 위치 (0-based index) */
  errorPositions: number[];
  
  /** 에러 값 */
  errorMagnitudes: number[];
  
  /** 정정 성공 여부 */
  isCorrected: boolean;
  
  /** 신드롬이 0인지 (에러 없음) */
  hasNoError: boolean;
  
  /** 실패 이유 (실패한 경우) */
  failureReason?: string;
  
  /** 검출된 에러 수 */
  detectedErrors?: number;
  
  /** 최대 정정 가능한 에러 수 */
  maxCorrectableErrors?: number;
}

/**
 * 디인터리빙 결과
 */
export interface DeinterleavedBlocks {
  /** 블록 배열 (각 블록은 데이터+EC 코드워드) */
  blocks: number[][];
  
  /** 각 블록의 데이터 코드워드 수 */
  dataCodewordsPerBlock: number[];
  
  /** 각 블록의 EC 코드워드 수 */
  ecCodewordsPerBlock: number[];
}