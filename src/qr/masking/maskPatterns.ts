import type { QRVersion } from '../../shared/types';
import { getMatrixSize } from '../module-placement/utils/matrixUtils';

/**
 * 마스크 패턴 타입 (0-7)
 */
export type MaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * 마스크 패턴별 조건 함수들
 * ISO/IEC 18004 Section 8.8.1 Data mask patterns
 */
export const MASK_PATTERNS = {
  0: (row: number, col: number) => (row + col) % 2 === 0,
  1: (row: number) => row % 2 === 0,
  2: (_row: number, col: number) => col % 3 === 0,
  3: (row: number, col: number) => (row + col) % 3 === 0,
  4: (row: number, col: number) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
  5: (row: number, col: number) => ((row * col) % 2) + ((row * col) % 3) === 0,
  6: (row: number, col: number) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
  7: (row: number, col: number) => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0
} as const;

/**
 * 마스크 패턴 설명
 */
export const MASK_DESCRIPTIONS = {
  0: '(i + j) mod 2 = 0',
  1: 'i mod 2 = 0',
  2: 'j mod 3 = 0',
  3: '(i + j) mod 3 = 0',
  4: '(⌊i/2⌋ + ⌊j/3⌋) mod 2 = 0',
  5: '(ij mod 2) + (ij mod 3) = 0',
  6: '((ij mod 2) + (ij mod 3)) mod 2 = 0',
  7: '((i+j mod 2) + (ij mod 3)) mod 2 = 0'
} as const;

/**
 * 특정 마스크 패턴에 대한 마스크 매트릭스 생성
 * 마스킹이 적용되어야 하는 위치에 true, 그렇지 않으면 false
 */
export const generateMaskMatrix = (version: QRVersion, pattern: MaskPattern): boolean[][] => {
  const size = getMatrixSize(version);
  const maskMatrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  
  const maskFunction = MASK_PATTERNS[pattern];
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      maskMatrix[row][col] = maskFunction(row, col);
    }
  }
  
  return maskMatrix;
};

/**
 * 인코딩 영역 식별 (기능 패턴과 정보 영역 제외)
 * 
 * 마스킹이 적용되지 않는 영역:
 * - 파인더 패턴 + 분리자 (각 모서리 8x8 영역)
 * - 타이밍 패턴 (6번째 행/열)
 * - 정렬 패턴
 * - 포맷 정보 영역
 * - 버전 정보 영역 (버전 7+)
 * - 다크 모듈 (4*version + 9, 8)
 */
export const getEncodingRegionMask = (version: QRVersion, moduleTypes: string[][]): boolean[][] => {
  const size = getMatrixSize(version);
  const encodingMask: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const moduleType = moduleTypes[row][col];
      
      // 인코딩 영역은 'data' 타입 모듈만 포함
      // (지그재그 패턴의 경우 'byte-X' 타입도 포함)
      const isEncodingRegion = moduleType === 'data' || moduleType.startsWith('byte-');
      encodingMask[row][col] = isEncodingRegion;
    }
  }
  
  return encodingMask;
};

/**
 * 인코딩 영역에만 적용된 마스크 패턴 생성
 */
export const generateEncodingMaskMatrix = (
  version: QRVersion, 
  pattern: MaskPattern, 
  moduleTypes: string[][]
): boolean[][] => {
  const fullMask = generateMaskMatrix(version, pattern);
  const encodingMask = getEncodingRegionMask(version, moduleTypes);
  const size = getMatrixSize(version);
  
  const result: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // 인코딩 영역이면서 마스크 조건을 만족하는 경우만 true
      result[row][col] = encodingMask[row][col] && fullMask[row][col];
    }
  }
  
  return result;
};

/**
 * 모든 마스크 패턴에 대한 매트릭스 생성
 */
export const generateAllMaskMatrices = (version: QRVersion): Record<MaskPattern, boolean[][]> => {
  const result = {} as Record<MaskPattern, boolean[][]>;
  
  for (let pattern = 0; pattern < 8; pattern++) {
    result[pattern as MaskPattern] = generateMaskMatrix(version, pattern as MaskPattern);
  }
  
  return result;
};

/**
 * 모든 인코딩 영역 마스크 패턴 매트릭스 생성
 */
export const generateAllEncodingMaskMatrices = (
  version: QRVersion, 
  moduleTypes: string[][]
): Record<MaskPattern, boolean[][]> => {
  const result = {} as Record<MaskPattern, boolean[][]>;
  
  for (let pattern = 0; pattern < 8; pattern++) {
    result[pattern as MaskPattern] = generateEncodingMaskMatrix(version, pattern as MaskPattern, moduleTypes);
  }
  
  return result;
};