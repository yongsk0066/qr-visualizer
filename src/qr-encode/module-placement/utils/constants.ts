import type { QRModule } from '../types';
import { ALIGNMENT_PATTERN_POSITIONS as SHARED_ALIGNMENT_POSITIONS } from '../../../shared/constants';

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
 * 모든 QR 버전 (1-40) 지원
 * shared constants에서 가져온 데이터 re-export
 */
export const ALIGNMENT_PATTERN_POSITIONS = SHARED_ALIGNMENT_POSITIONS;

/**
 * 버전별 얼라인먼트 패턴 좌표 계산
 */
export const getAlignmentPatternPositions = (version: number) => {
  const positions = ALIGNMENT_PATTERN_POSITIONS[version] || [];
  const coords: { row: number; col: number }[] = [];
  
  for (const row of positions) {
    for (const col of positions) {
      // 파인더 패턴과 겹치는 위치 제외 (7x7 영역)
      const lastPos = positions[positions.length - 1];
      const isTopLeft = row === 6 && col === 6;
      const isTopRight = row === 6 && col === lastPos;
      const isBottomLeft = row === lastPos && col === 6;
      
      if (!isTopLeft && !isTopRight && !isBottomLeft) {
        coords.push({ row, col });
      }
    }
  }
  
  return coords;
};