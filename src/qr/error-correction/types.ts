/**
 * 에러 정정 블록 정보
 */
export interface ECBlock {
  totalCount: number;  // 블록당 총 코드워드 수
  dataCount: number;   // 블록당 데이터 코드워드 수
}

/**
 * 에러 정정 블록 구조
 */
export interface ECBlocks {
  ecCodewordsPerBlock: number;  // 블록당 에러 정정 코드워드 수
  groups: {
    blocks: number;     // 이 그룹의 블록 수
    totalCount: number; // 블록당 총 코드워드 수
    dataCount: number;  // 블록당 데이터 코드워드 수
  }[];
}

/**
 * 에러 정정 처리 결과
 */
export interface ErrorCorrectionResult {
  dataBlocks: number[][];      // 각 블록의 데이터 코드워드
  ecBlocks: number[][];        // 각 블록의 에러 정정 코드워드
  totalDataCodewords: number;  // 총 데이터 코드워드 수
  totalECCodewords: number;    // 총 에러 정정 코드워드 수
}