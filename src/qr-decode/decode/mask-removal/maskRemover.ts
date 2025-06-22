/**
 * 마스크 패턴 제거 모듈
 * ISO/IEC 18004 Section 8.8
 */

import type { TriStateQR } from '../../types';
import type { ErrorCorrectionLevel } from '../../../shared/types';
import type { MaskRemovalResult, MaskPattern } from './types';
import { MASK_PATTERNS } from '../../../qr-encode/masking/maskPatterns';
import { ALIGNMENT_PATTERN_POSITIONS } from '../../../shared/constants';

type ModuleType = 'finder' | 'separator' | 'timing' | 'alignment' | 'format' | 'version' | 'dark' | 'data';

/**
 * 마스크 패턴 제거
 */
export const removeMask = (
  triStateQR: TriStateQR,
  maskPattern: MaskPattern,
  _errorLevel: ErrorCorrectionLevel,
  estimatedVersion: number
): MaskRemovalResult => {
  const { matrix: triStateMatrix, size } = triStateQR;
  const version = estimatedVersion;
  
  // 모듈 타입 분류
  const moduleTypes = classifyModules(size, version);
  
  // 데이터 모듈 식별
  const dataModules = identifyDataModules(moduleTypes);
  
  // 마스크 매트릭스 생성
  const maskMatrix = generateMaskMatrix(size, maskPattern);
  
  // 마스크 제거 적용
  const { unmaskedMatrix, maskedModules, unknownCount } = applyMaskRemoval(
    triStateMatrix, 
    maskMatrix, 
    dataModules
  );
  
  // 데이터 모듈 수 계산
  const dataModuleCount = dataModules.flat().filter(Boolean).length;
  
  // 신뢰도 계산
  const confidence = unknownCount > 0 
    ? Math.max(0, 1 - (unknownCount / dataModuleCount)) 
    : 1;
  
  return {
    unmaskedMatrix,
    maskedModules,
    dataModules,
    dataModuleCount,
    unknownModuleCount: unknownCount,
    confidence,
    maskPattern
  };
};

/**
 * 모듈 타입 분류
 */
const classifyModules = (size: number, version: number): ModuleType[][] => {
  const types: ModuleType[][] = Array.from(
    { length: size }, 
    () => Array(size).fill('data')
  );
  
  // 파인더 패턴 (7x7)
  const finderRegions = [
    { row: 0, col: 0 },           // 왼쪽 상단
    { row: 0, col: size - 7 },    // 오른쪽 상단
    { row: size - 7, col: 0 }     // 왼쪽 하단
  ];
  
  for (const { row: startRow, col: startCol } of finderRegions) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        types[startRow + r][startCol + c] = 'finder';
      }
    }
  }
  
  // 분리자 (파인더 패턴 주변 1모듈 폭)
  for (const { row: startRow, col: startCol } of finderRegions) {
    // 분리자는 파인더 패턴(7×7) 주변 1모듈 테두리
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startRow + r;
        const col = startCol + c;
        
        // 매트릭스 범위 내이고, 파인더 패턴 영역이 아닌 경우
        const isInBounds = row >= 0 && row < size && col >= 0 && col < size;
        const isFinderArea = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        
        if (isInBounds && !isFinderArea) {
          types[row][col] = 'separator';
        }
      }
    }
  }
  
  // 타이밍 패턴
  for (let i = 8; i < size - 8; i++) {
    types[6][i] = 'timing';
    types[i][6] = 'timing';
  }
  
  // 포맷 정보
  // 위치 1: 왼쪽 상단
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) { // 타이밍 패턴 제외
      types[8][i] = 'format';
      types[i][8] = 'format';
    }
  }
  
  // 위치 2: 오른쪽 하단
  for (let i = 0; i < 8; i++) {
    types[size - 1 - i][8] = 'format';
  }
  for (let i = 0; i < 8; i++) {
    types[8][size - 1 - i] = 'format';
  }
  
  // 버전 정보 (버전 7 이상)
  if (version >= 7) {
    // 왼쪽 하단: 가로 6 × 세로 3 블록
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        types[size - 11 + row][col] = 'version';
      }
    }
    
    // 오른쪽 상단: 가로 3 × 세로 6 블록
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        types[row][size - 11 + col] = 'version';
      }
    }
  }
  
  // 정렬 패턴
  const alignmentPositions = getAlignmentPatternPositions(version);
  for (const row of alignmentPositions) {
    for (const col of alignmentPositions) {
      // 파인더 패턴과 겹치지 않는 경우만
      if (!isNearFinderPattern(row, col, size)) {
        // 5x5 정렬 패턴
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < size && c >= 0 && c < size) {
              types[r][c] = 'alignment';
            }
          }
        }
      }
    }
  }
  
  // 다크 모듈
  types[(4 * version) + 9][8] = 'dark';
  
  return types;
};

/**
 * 데이터 모듈 식별
 */
const identifyDataModules = (moduleTypes: ModuleType[][]): boolean[][] => {
  const size = moduleTypes.length;
  const dataModules: boolean[][] = Array.from(
    { length: size }, 
    () => Array(size).fill(false)
  );
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      dataModules[row][col] = moduleTypes[row][col] === 'data';
    }
  }
  
  return dataModules;
};

/**
 * 마스크 매트릭스 생성
 */
const generateMaskMatrix = (size: number, pattern: MaskPattern): boolean[][] => {
  const maskMatrix: boolean[][] = Array.from(
    { length: size }, 
    () => Array(size).fill(false)
  );
  
  const maskFunction = MASK_PATTERNS[pattern];
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      maskMatrix[row][col] = maskFunction(row, col);
    }
  }
  
  return maskMatrix;
};

/**
 * 마스크 제거 적용
 */
const applyMaskRemoval = (
  triStateMatrix: (-1 | 0 | 1)[][],
  maskMatrix: boolean[][],
  dataModules: boolean[][]
): {
  unmaskedMatrix: (0 | 1)[][];
  maskedModules: boolean[][];
  unknownCount: number;
} => {
  const size = triStateMatrix.length;
  const unmaskedMatrix: (0 | 1)[][] = Array.from(
    { length: size }, 
    () => Array(size).fill(0)
  );
  const maskedModules: boolean[][] = Array.from(
    { length: size }, 
    () => Array(size).fill(false)
  );
  
  let unknownCount = 0;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const module = triStateMatrix[row][col];
      
      if (module === -1) {
        // Unknown 모듈은 0으로 가정
        unmaskedMatrix[row][col] = 0;
        if (dataModules[row][col]) {
          unknownCount++;
        }
      } else if (dataModules[row][col] && maskMatrix[row][col]) {
        // 데이터 모듈이고 마스크가 적용되는 경우 XOR
        // QR 코드에서: 검은색(1) = 비트 1, 흰색(0) = 비트 0
        // 마스크 적용 시 비트가 반전됨
        unmaskedMatrix[row][col] = module === 1 ? 0 : 1;
        maskedModules[row][col] = true;
      } else {
        // 기능 패턴이거나 마스크가 적용되지 않는 경우 그대로 유지
        unmaskedMatrix[row][col] = module as (0 | 1);
      }
    }
  }
  
  return {
    unmaskedMatrix,
    maskedModules,
    unknownCount
  };
};

/**
 * 정렬 패턴 위치 계산
 * 모든 QR 버전 (1-40) 지원
 */
const getAlignmentPatternPositions = (version: number): number[] => {
  // shared constants에서 가져온 데이터 사용
  return ALIGNMENT_PATTERN_POSITIONS[version] || [];
};

/**
 * 파인더 패턴 근처인지 확인
 */
const isNearFinderPattern = (row: number, col: number, size: number): boolean => {
  // 왼쪽 상단
  if (row <= 8 && col <= 8) return true;
  
  // 오른쪽 상단
  if (row <= 8 && col >= size - 9) return true;
  
  // 왼쪽 하단
  if (row >= size - 9 && col <= 8) return true;
  
  return false;
};

// 내보내기 추가
export { classifyModuleTypes };
const classifyModuleTypes = classifyModules;