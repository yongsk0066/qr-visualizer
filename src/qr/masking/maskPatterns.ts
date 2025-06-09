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
 * 모든 마스크 패턴에 대한 매트릭스 생성
 */
export const generateAllMaskMatrices = (version: QRVersion): Record<MaskPattern, boolean[][]> => {
  const result = {} as Record<MaskPattern, boolean[][]>;
  
  for (let pattern = 0; pattern < 8; pattern++) {
    result[pattern as MaskPattern] = generateMaskMatrix(version, pattern as MaskPattern);
  }
  
  return result;
};