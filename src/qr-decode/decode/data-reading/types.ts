/**
 * 데이터 읽기 관련 타입 정의
 */

/**
 * 데이터 읽기 결과
 */
export interface DataReadingResult {
  /** 읽은 비트스트림 (전체) */
  bitStream: string;
  
  /** 총 비트 수 */
  totalBits: number;
  
  /** 8비트 코드워드 배열 */
  codewords: number[];
  
  /** 데이터 코드워드 수 */
  dataCodewordCount: number;
  
  /** 에러 정정 코드워드 수 */
  errorCorrectionCodewordCount: number;
  
  /** 데이터/EC 분리 정보 */
  blockInfo: {
    dataBlocks: number[][];      // 각 블록의 데이터 코드워드
    ecBlocks: number[][];        // 각 블록의 EC 코드워드
  };
  
  /** 읽기 순서 매트릭스 (디버깅/시각화용) */
  readingOrder: number[][];
  
  /** 바이트 블록 번호 매트릭스 (시각화용) */
  byteBlocks: number[][];
  
  /** 신뢰도 (unknown 모듈 등 고려) */
  confidence: number;
}

/**
 * 지그재그 패턴 위치
 */
export interface ZigzagPosition {
  row: number;
  col: number;
  bitIndex: number;    // 전체 비트스트림에서의 인덱스
  byteIndex: number;   // 바이트(코드워드) 인덱스
  bitInByte: number;   // 바이트 내 비트 위치 (0-7)
}