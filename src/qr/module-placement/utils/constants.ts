import type { QRModule } from '../types';

/**
 * 파인더 패턴 (7x7)
 * ISO/IEC 18004 7.3.2 Position detection pattern
 */
export const FINDER_PATTERN: QRModule[][] = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

/**
 * 얼라인먼트 패턴 (5x5)
 * ISO/IEC 18004 7.3.5 Alignment pattern
 */
export const ALIGNMENT_PATTERN: QRModule[][] = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];

/**
 * 파인더 패턴 위치
 * 3개 모서리: 좌상단, 우상단, 좌하단
 */
export const getFinderPatternPositions = (size: number) => [
  { row: 0, col: 0 },           // 좌상단
  { row: 0, col: size - 7 },    // 우상단  
  { row: size - 7, col: 0 },    // 좌하단
];

/**
 * 얼라인먼트 패턴 위치 (버전별)
 * ISO/IEC 18004 Annex E - Alignment pattern center position
 */
export const ALIGNMENT_PATTERN_POSITIONS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 34, 62],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
  16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
  18: [6, 30, 56, 82],
  19: [6, 30, 58, 86],
  20: [6, 34, 62, 90],
  21: [6, 28, 50, 72, 94],
  22: [6, 26, 50, 74, 98],
  23: [6, 30, 54, 78, 102],
  24: [6, 28, 54, 80, 106],
  25: [6, 32, 58, 84, 110],
  26: [6, 30, 58, 86, 114],
  27: [6, 34, 62, 90, 118],
  28: [6, 26, 50, 74, 98, 122],
  29: [6, 30, 54, 78, 102, 126],
  30: [6, 26, 52, 78, 104, 130],
  31: [6, 30, 56, 82, 108, 134],
  32: [6, 34, 60, 86, 112, 138],
  33: [6, 30, 58, 86, 114, 142],
  34: [6, 34, 62, 90, 118, 146],
  35: [6, 30, 54, 78, 102, 126, 150],
  36: [6, 24, 50, 76, 102, 128, 154],
  37: [6, 28, 54, 80, 106, 132, 158],
  38: [6, 32, 58, 84, 110, 136, 162],
  39: [6, 26, 54, 82, 110, 138, 166],
  40: [6, 30, 58, 86, 114, 142, 170],
};

/**
 * 버전별 얼라인먼트 패턴 좌표 계산
 */
export const getAlignmentPatternPositions = (version: number) => {
  const positions = ALIGNMENT_PATTERN_POSITIONS[version] || [];
  const coords: { row: number; col: number }[] = [];
  
  for (const row of positions) {
    for (const col of positions) {
      // 파인더 패턴과 겹치는 위치 제외
      const isTopLeft = row <= 8 && col <= 8;
      const isTopRight = row <= 8 && col >= positions[positions.length - 1] - 2;
      const isBottomLeft = row >= positions[positions.length - 1] - 2 && col <= 8;
      
      if (!isTopLeft && !isTopRight && !isBottomLeft) {
        coords.push({ row, col });
      }
    }
  }
  
  return coords;
};