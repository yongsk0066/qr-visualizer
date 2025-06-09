import type { QRMatrix, QRModule, ModuleType, ModuleTypeMatrix } from '../types';
import type { QRVersion } from '../../../shared/types';

/**
 * QR 코드 버전에 따른 매트릭스 크기 계산
 * 공식: size = 21 + (version - 1) * 4
 */
export const getMatrixSize = (version: QRVersion): number => 
  21 + (version - 1) * 4;

/**
 * 빈 QR 매트릭스 생성 (모든 모듈 null로 초기화)
 */
export const createEmptyMatrix = (size: number): QRMatrix =>
  Array.from({ length: size }, () => Array(size).fill(null));

/**
 * 빈 모듈 타입 매트릭스 생성 (모든 모듈 'empty'로 초기화)
 */
export const createEmptyModuleTypes = (size: number): ModuleTypeMatrix =>
  Array.from({ length: size }, () => Array(size).fill('empty'));

/**
 * 매트릭스 깊은 복사
 */
export const cloneMatrix = (matrix: QRMatrix): QRMatrix =>
  matrix.map(row => [...row]);

/**
 * 모듈 타입 매트릭스 깊은 복사
 */
export const cloneModuleTypes = (moduleTypes: ModuleTypeMatrix): ModuleTypeMatrix =>
  moduleTypes.map(row => [...row]);

/**
 * 매트릭스 내 특정 위치에 모듈 설정
 */
export const setModule = (
  matrix: QRMatrix,
  row: number,
  col: number,
  value: QRModule
): void => {
  if (row >= 0 && row < matrix.length && col >= 0 && col < matrix[0].length) {
    matrix[row][col] = value;
  }
};

/**
 * 매트릭스 내 특정 위치에 모듈 타입 설정
 */
export const setModuleType = (
  moduleTypes: ModuleTypeMatrix,
  row: number,
  col: number,
  type: ModuleType
): void => {
  if (row >= 0 && row < moduleTypes.length && col >= 0 && col < moduleTypes[0].length) {
    moduleTypes[row][col] = type;
  }
};

/**
 * 매트릭스 내 특정 위치가 유효한 범위인지 확인
 */
export const isValidPosition = (matrix: QRMatrix, row: number, col: number): boolean =>
  row >= 0 && row < matrix.length && col >= 0 && col < matrix[0].length;

/**
 * 매트릭스 내 특정 위치가 비어있는지 확인 (null)
 */
export const isEmpty = (matrix: QRMatrix, row: number, col: number): boolean =>
  isValidPosition(matrix, row, col) && matrix[row][col] === null;

/**
 * 지정된 영역에 패턴 배치
 */
export const placePattern = (
  matrix: QRMatrix,
  moduleTypes: ModuleTypeMatrix,
  startRow: number,
  startCol: number,
  pattern: QRModule[][],
  moduleType: ModuleType
): number => {
  let placedCount = 0;
  
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      const row = startRow + r;
      const col = startCol + c;
      
      if (isValidPosition(matrix, row, col)) {
        setModule(matrix, row, col, pattern[r][c]);
        setModuleType(moduleTypes, row, col, moduleType);
        placedCount++;
      }
    }
  }
  
  return placedCount;
};