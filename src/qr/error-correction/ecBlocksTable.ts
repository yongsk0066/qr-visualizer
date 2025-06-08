import type { QRVersion, ErrorCorrectionLevel } from '../../shared/types';
import type { ECBlocks } from './errorCorrection';

/**
 * 버전과 에러 정정 레벨에 따른 블록 구조
 * ISO/IEC 18004 표 13-22 (line 1157-1517)
 */
export const EC_BLOCKS_TABLE: Record<QRVersion, Record<ErrorCorrectionLevel, ECBlocks>> = {
  1: {
    L: { ecCodewordsPerBlock: 7, groups: [{ blocks: 1, totalCount: 26, dataCount: 19 }] },
    M: { ecCodewordsPerBlock: 10, groups: [{ blocks: 1, totalCount: 26, dataCount: 16 }] },
    Q: { ecCodewordsPerBlock: 13, groups: [{ blocks: 1, totalCount: 26, dataCount: 13 }] },
    H: { ecCodewordsPerBlock: 17, groups: [{ blocks: 1, totalCount: 26, dataCount: 9 }] },
  },
  2: {
    L: { ecCodewordsPerBlock: 10, groups: [{ blocks: 1, totalCount: 44, dataCount: 34 }] },
    M: { ecCodewordsPerBlock: 16, groups: [{ blocks: 1, totalCount: 44, dataCount: 28 }] },
    Q: { ecCodewordsPerBlock: 22, groups: [{ blocks: 1, totalCount: 44, dataCount: 22 }] },
    H: { ecCodewordsPerBlock: 28, groups: [{ blocks: 1, totalCount: 44, dataCount: 16 }] },
  },
  3: {
    L: { ecCodewordsPerBlock: 15, groups: [{ blocks: 1, totalCount: 70, dataCount: 55 }] },
    M: { ecCodewordsPerBlock: 26, groups: [{ blocks: 1, totalCount: 70, dataCount: 44 }] },
    Q: { ecCodewordsPerBlock: 18, groups: [{ blocks: 2, totalCount: 35, dataCount: 17 }] },
    H: { ecCodewordsPerBlock: 22, groups: [{ blocks: 2, totalCount: 35, dataCount: 13 }] },
  },
  4: {
    L: { ecCodewordsPerBlock: 20, groups: [{ blocks: 1, totalCount: 100, dataCount: 80 }] },
    M: { ecCodewordsPerBlock: 18, groups: [{ blocks: 2, totalCount: 50, dataCount: 32 }] },
    Q: { ecCodewordsPerBlock: 26, groups: [{ blocks: 2, totalCount: 50, dataCount: 24 }] },
    H: { ecCodewordsPerBlock: 16, groups: [{ blocks: 4, totalCount: 25, dataCount: 9 }] },
  },
  5: {
    L: { ecCodewordsPerBlock: 26, groups: [{ blocks: 1, totalCount: 134, dataCount: 108 }] },
    M: { ecCodewordsPerBlock: 24, groups: [{ blocks: 2, totalCount: 67, dataCount: 43 }] },
    Q: { ecCodewordsPerBlock: 18, groups: [
      { blocks: 2, totalCount: 33, dataCount: 15 },
      { blocks: 2, totalCount: 34, dataCount: 16 }
    ]},
    H: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 2, totalCount: 33, dataCount: 11 },
      { blocks: 2, totalCount: 34, dataCount: 12 }
    ]},
  },
  6: {
    L: { ecCodewordsPerBlock: 18, groups: [{ blocks: 2, totalCount: 86, dataCount: 68 }] },
    M: { ecCodewordsPerBlock: 16, groups: [{ blocks: 4, totalCount: 43, dataCount: 27 }] },
    Q: { ecCodewordsPerBlock: 24, groups: [{ blocks: 4, totalCount: 43, dataCount: 19 }] },
    H: { ecCodewordsPerBlock: 28, groups: [{ blocks: 4, totalCount: 43, dataCount: 15 }] },
  },
  7: {
    L: { ecCodewordsPerBlock: 20, groups: [{ blocks: 2, totalCount: 98, dataCount: 78 }] },
    M: { ecCodewordsPerBlock: 18, groups: [{ blocks: 4, totalCount: 49, dataCount: 31 }] },
    Q: { ecCodewordsPerBlock: 18, groups: [
      { blocks: 2, totalCount: 32, dataCount: 14 },
      { blocks: 4, totalCount: 33, dataCount: 15 }
    ]},
    H: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 4, totalCount: 39, dataCount: 13 },
      { blocks: 1, totalCount: 40, dataCount: 14 }
    ]},
  },
  8: {
    L: { ecCodewordsPerBlock: 24, groups: [{ blocks: 2, totalCount: 121, dataCount: 97 }] },
    M: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 2, totalCount: 60, dataCount: 38 },
      { blocks: 2, totalCount: 61, dataCount: 39 }
    ]},
    Q: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 4, totalCount: 40, dataCount: 18 },
      { blocks: 2, totalCount: 41, dataCount: 19 }
    ]},
    H: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 4, totalCount: 40, dataCount: 14 },
      { blocks: 2, totalCount: 41, dataCount: 15 }
    ]},
  },
  9: {
    L: { ecCodewordsPerBlock: 30, groups: [{ blocks: 2, totalCount: 146, dataCount: 116 }] },
    M: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 3, totalCount: 58, dataCount: 36 },
      { blocks: 2, totalCount: 59, dataCount: 37 }
    ]},
    Q: { ecCodewordsPerBlock: 20, groups: [
      { blocks: 4, totalCount: 36, dataCount: 16 },
      { blocks: 4, totalCount: 37, dataCount: 17 }
    ]},
    H: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 4, totalCount: 36, dataCount: 12 },
      { blocks: 4, totalCount: 37, dataCount: 13 }
    ]},
  },
  10: {
    L: { ecCodewordsPerBlock: 18, groups: [
      { blocks: 2, totalCount: 86, dataCount: 68 },
      { blocks: 2, totalCount: 87, dataCount: 69 }
    ]},
    M: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 4, totalCount: 69, dataCount: 43 },
      { blocks: 1, totalCount: 70, dataCount: 44 }
    ]},
    Q: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 6, totalCount: 43, dataCount: 19 },
      { blocks: 2, totalCount: 44, dataCount: 20 }
    ]},
    H: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 6, totalCount: 43, dataCount: 15 },
      { blocks: 2, totalCount: 44, dataCount: 16 }
    ]},
  },
  11: {
    L: { ecCodewordsPerBlock: 20, groups: [{ blocks: 4, totalCount: 81, dataCount: 61 }] },
    M: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 1, totalCount: 50, dataCount: 30 },
      { blocks: 4, totalCount: 51, dataCount: 31 }
    ]},
    Q: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 4, totalCount: 46, dataCount: 20 },
      { blocks: 4, totalCount: 47, dataCount: 21 }
    ]},
    H: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 3, totalCount: 36, dataCount: 12 },
      { blocks: 8, totalCount: 37, dataCount: 13 }
    ]},
  },
  12: {
    L: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 2, totalCount: 92, dataCount: 68 },
      { blocks: 2, totalCount: 93, dataCount: 69 }
    ]},
    M: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 6, totalCount: 58, dataCount: 36 },
      { blocks: 2, totalCount: 59, dataCount: 37 }
    ]},
    Q: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 4, totalCount: 46, dataCount: 20 },
      { blocks: 6, totalCount: 47, dataCount: 21 }
    ]},
    H: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 7, totalCount: 42, dataCount: 14 },
      { blocks: 4, totalCount: 43, dataCount: 15 }
    ]},
  },
  13: {
    L: { ecCodewordsPerBlock: 26, groups: [{ blocks: 4, totalCount: 107, dataCount: 81 }] },
    M: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 8, totalCount: 59, dataCount: 37 },
      { blocks: 1, totalCount: 60, dataCount: 38 }
    ]},
    Q: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 8, totalCount: 44, dataCount: 20 },
      { blocks: 4, totalCount: 45, dataCount: 21 }
    ]},
    H: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 12, totalCount: 33, dataCount: 11 },
      { blocks: 4, totalCount: 34, dataCount: 12 }
    ]},
  },
  14: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 3, totalCount: 115, dataCount: 85 },
      { blocks: 1, totalCount: 116, dataCount: 86 }
    ]},
    M: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 4, totalCount: 64, dataCount: 40 },
      { blocks: 5, totalCount: 65, dataCount: 41 }
    ]},
    Q: { ecCodewordsPerBlock: 20, groups: [
      { blocks: 11, totalCount: 36, dataCount: 16 },
      { blocks: 5, totalCount: 37, dataCount: 17 }
    ]},
    H: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 11, totalCount: 36, dataCount: 12 },
      { blocks: 5, totalCount: 37, dataCount: 13 }
    ]},
  },
  15: {
    L: { ecCodewordsPerBlock: 22, groups: [
      { blocks: 5, totalCount: 87, dataCount: 65 },
      { blocks: 1, totalCount: 88, dataCount: 66 }
    ]},
    M: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 5, totalCount: 65, dataCount: 41 },
      { blocks: 5, totalCount: 66, dataCount: 42 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 5, totalCount: 54, dataCount: 24 },
      { blocks: 7, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 11, totalCount: 36, dataCount: 12 },
      { blocks: 7, totalCount: 37, dataCount: 13 }
    ]},
  },
  16: {
    L: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 5, totalCount: 98, dataCount: 74 },
      { blocks: 1, totalCount: 99, dataCount: 75 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 7, totalCount: 73, dataCount: 45 },
      { blocks: 3, totalCount: 74, dataCount: 46 }
    ]},
    Q: { ecCodewordsPerBlock: 24, groups: [
      { blocks: 15, totalCount: 43, dataCount: 19 },
      { blocks: 2, totalCount: 44, dataCount: 20 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 3, totalCount: 45, dataCount: 15 },
      { blocks: 13, totalCount: 46, dataCount: 16 }
    ]},
  },
  17: {
    L: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 1, totalCount: 107, dataCount: 79 },
      { blocks: 5, totalCount: 108, dataCount: 80 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 10, totalCount: 74, dataCount: 46 },
      { blocks: 1, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 1, totalCount: 50, dataCount: 22 },
      { blocks: 15, totalCount: 51, dataCount: 23 }
    ]},
    H: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 2, totalCount: 42, dataCount: 14 },
      { blocks: 17, totalCount: 43, dataCount: 15 }
    ]},
  },
  18: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 5, totalCount: 120, dataCount: 90 },
      { blocks: 1, totalCount: 121, dataCount: 91 }
    ]},
    M: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 9, totalCount: 69, dataCount: 43 },
      { blocks: 4, totalCount: 70, dataCount: 44 }
    ]},
    Q: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 17, totalCount: 50, dataCount: 22 },
      { blocks: 1, totalCount: 51, dataCount: 23 }
    ]},
    H: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 2, totalCount: 42, dataCount: 14 },
      { blocks: 19, totalCount: 43, dataCount: 15 }
    ]},
  },
  19: {
    L: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 3, totalCount: 113, dataCount: 85 },
      { blocks: 4, totalCount: 114, dataCount: 86 }
    ]},
    M: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 3, totalCount: 70, dataCount: 44 },
      { blocks: 11, totalCount: 71, dataCount: 45 }
    ]},
    Q: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 17, totalCount: 47, dataCount: 21 },
      { blocks: 4, totalCount: 48, dataCount: 22 }
    ]},
    H: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 9, totalCount: 39, dataCount: 13 },
      { blocks: 16, totalCount: 40, dataCount: 14 }
    ]},
  },
  20: {
    L: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 3, totalCount: 107, dataCount: 79 },
      { blocks: 5, totalCount: 108, dataCount: 80 }
    ]},
    M: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 3, totalCount: 67, dataCount: 41 },
      { blocks: 13, totalCount: 68, dataCount: 42 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 15, totalCount: 54, dataCount: 24 },
      { blocks: 5, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 15, totalCount: 43, dataCount: 15 },
      { blocks: 10, totalCount: 44, dataCount: 16 }
    ]},
  },
  21: {
    L: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 4, totalCount: 116, dataCount: 88 },
      { blocks: 4, totalCount: 117, dataCount: 89 }
    ]},
    M: { ecCodewordsPerBlock: 26, groups: [{ blocks: 17, totalCount: 68, dataCount: 42 }] },
    Q: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 17, totalCount: 50, dataCount: 22 },
      { blocks: 6, totalCount: 51, dataCount: 23 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 19, totalCount: 46, dataCount: 16 },
      { blocks: 6, totalCount: 47, dataCount: 17 }
    ]},
  },
  22: {
    L: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 2, totalCount: 111, dataCount: 83 },
      { blocks: 7, totalCount: 112, dataCount: 84 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [{ blocks: 17, totalCount: 74, dataCount: 46 }] },
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 7, totalCount: 54, dataCount: 24 },
      { blocks: 16, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 24, groups: [{ blocks: 34, totalCount: 37, dataCount: 13 }] },
  },
  23: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 4, totalCount: 121, dataCount: 91 },
      { blocks: 5, totalCount: 122, dataCount: 92 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 4, totalCount: 75, dataCount: 47 },
      { blocks: 14, totalCount: 76, dataCount: 48 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 11, totalCount: 54, dataCount: 24 },
      { blocks: 14, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 16, totalCount: 45, dataCount: 15 },
      { blocks: 14, totalCount: 46, dataCount: 16 }
    ]},
  },
  24: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 6, totalCount: 117, dataCount: 87 },
      { blocks: 4, totalCount: 118, dataCount: 88 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 6, totalCount: 73, dataCount: 45 },
      { blocks: 14, totalCount: 74, dataCount: 46 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 11, totalCount: 54, dataCount: 24 },
      { blocks: 16, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 30, totalCount: 46, dataCount: 16 },
      { blocks: 2, totalCount: 47, dataCount: 17 }
    ]},
  },
  25: {
    L: { ecCodewordsPerBlock: 26, groups: [
      { blocks: 8, totalCount: 106, dataCount: 80 },
      { blocks: 4, totalCount: 107, dataCount: 81 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 8, totalCount: 75, dataCount: 47 },
      { blocks: 13, totalCount: 76, dataCount: 48 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 7, totalCount: 54, dataCount: 24 },
      { blocks: 22, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 22, totalCount: 45, dataCount: 15 },
      { blocks: 13, totalCount: 46, dataCount: 16 }
    ]},
  },
  26: {
    L: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 10, totalCount: 114, dataCount: 86 },
      { blocks: 2, totalCount: 115, dataCount: 87 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 19, totalCount: 74, dataCount: 46 },
      { blocks: 4, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 28, totalCount: 50, dataCount: 22 },
      { blocks: 6, totalCount: 51, dataCount: 23 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 33, totalCount: 46, dataCount: 16 },
      { blocks: 4, totalCount: 47, dataCount: 17 }
    ]},
  },
  27: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 8, totalCount: 122, dataCount: 92 },
      { blocks: 4, totalCount: 123, dataCount: 93 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 22, totalCount: 73, dataCount: 45 },
      { blocks: 3, totalCount: 74, dataCount: 46 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 8, totalCount: 53, dataCount: 23 },
      { blocks: 26, totalCount: 54, dataCount: 24 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 12, totalCount: 45, dataCount: 15 },
      { blocks: 28, totalCount: 46, dataCount: 16 }
    ]},
  },
  28: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 3, totalCount: 117, dataCount: 87 },
      { blocks: 10, totalCount: 118, dataCount: 88 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 3, totalCount: 73, dataCount: 45 },
      { blocks: 23, totalCount: 74, dataCount: 46 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 4, totalCount: 54, dataCount: 24 },
      { blocks: 31, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 11, totalCount: 45, dataCount: 15 },
      { blocks: 31, totalCount: 46, dataCount: 16 }
    ]},
  },
  29: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 7, totalCount: 116, dataCount: 86 },
      { blocks: 7, totalCount: 117, dataCount: 87 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 21, totalCount: 73, dataCount: 45 },
      { blocks: 7, totalCount: 74, dataCount: 46 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 1, totalCount: 53, dataCount: 23 },
      { blocks: 37, totalCount: 54, dataCount: 24 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 19, totalCount: 45, dataCount: 15 },
      { blocks: 26, totalCount: 46, dataCount: 16 }
    ]},
  },
  30: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 5, totalCount: 115, dataCount: 85 },
      { blocks: 10, totalCount: 116, dataCount: 86 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 19, totalCount: 75, dataCount: 47 },
      { blocks: 10, totalCount: 76, dataCount: 48 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 15, totalCount: 54, dataCount: 24 },
      { blocks: 25, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 23, totalCount: 45, dataCount: 15 },
      { blocks: 25, totalCount: 46, dataCount: 16 }
    ]},
  },
  31: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 13, totalCount: 115, dataCount: 85 },
      { blocks: 3, totalCount: 116, dataCount: 86 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 2, totalCount: 74, dataCount: 46 },
      { blocks: 29, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 42, totalCount: 54, dataCount: 24 },
      { blocks: 1, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 23, totalCount: 45, dataCount: 15 },
      { blocks: 28, totalCount: 46, dataCount: 16 }
    ]},
  },
  32: {
    L: { ecCodewordsPerBlock: 30, groups: [{ blocks: 17, totalCount: 115, dataCount: 85 }] },
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 10, totalCount: 74, dataCount: 46 },
      { blocks: 23, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 10, totalCount: 54, dataCount: 24 },
      { blocks: 35, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 19, totalCount: 45, dataCount: 15 },
      { blocks: 35, totalCount: 46, dataCount: 16 }
    ]},
  },
  33: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 17, totalCount: 115, dataCount: 85 },
      { blocks: 1, totalCount: 116, dataCount: 86 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 14, totalCount: 74, dataCount: 46 },
      { blocks: 21, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 29, totalCount: 54, dataCount: 24 },
      { blocks: 19, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 11, totalCount: 45, dataCount: 15 },
      { blocks: 46, totalCount: 46, dataCount: 16 }
    ]},
  },
  34: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 13, totalCount: 115, dataCount: 85 },
      { blocks: 6, totalCount: 116, dataCount: 86 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 14, totalCount: 74, dataCount: 46 },
      { blocks: 23, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 44, totalCount: 54, dataCount: 24 },
      { blocks: 7, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 59, totalCount: 46, dataCount: 16 },
      { blocks: 1, totalCount: 47, dataCount: 17 }
    ]},
  },
  35: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 12, totalCount: 121, dataCount: 91 },
      { blocks: 7, totalCount: 122, dataCount: 92 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 12, totalCount: 75, dataCount: 47 },
      { blocks: 26, totalCount: 76, dataCount: 48 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 39, totalCount: 54, dataCount: 24 },
      { blocks: 14, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 22, totalCount: 45, dataCount: 15 },
      { blocks: 41, totalCount: 46, dataCount: 16 }
    ]},
  },
  36: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 6, totalCount: 121, dataCount: 91 },
      { blocks: 14, totalCount: 122, dataCount: 92 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 6, totalCount: 75, dataCount: 47 },
      { blocks: 34, totalCount: 76, dataCount: 48 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 46, totalCount: 54, dataCount: 24 },
      { blocks: 10, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 2, totalCount: 45, dataCount: 15 },
      { blocks: 64, totalCount: 46, dataCount: 16 }
    ]},
  },
  37: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 17, totalCount: 122, dataCount: 92 },
      { blocks: 4, totalCount: 123, dataCount: 93 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 29, totalCount: 74, dataCount: 46 },
      { blocks: 14, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 49, totalCount: 54, dataCount: 24 },
      { blocks: 10, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 24, totalCount: 45, dataCount: 15 },
      { blocks: 46, totalCount: 46, dataCount: 16 }
    ]},
  },
  38: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 4, totalCount: 122, dataCount: 92 },
      { blocks: 18, totalCount: 123, dataCount: 93 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 13, totalCount: 74, dataCount: 46 },
      { blocks: 32, totalCount: 75, dataCount: 47 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 48, totalCount: 54, dataCount: 24 },
      { blocks: 14, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 42, totalCount: 45, dataCount: 15 },
      { blocks: 32, totalCount: 46, dataCount: 16 }
    ]},
  },
  39: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 20, totalCount: 117, dataCount: 87 },
      { blocks: 4, totalCount: 118, dataCount: 88 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 40, totalCount: 75, dataCount: 47 },
      { blocks: 7, totalCount: 76, dataCount: 48 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 43, totalCount: 54, dataCount: 24 },
      { blocks: 22, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 10, totalCount: 45, dataCount: 15 },
      { blocks: 67, totalCount: 46, dataCount: 16 }
    ]},
  },
  40: {
    L: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 19, totalCount: 118, dataCount: 88 },
      { blocks: 6, totalCount: 119, dataCount: 89 }
    ]},
    M: { ecCodewordsPerBlock: 28, groups: [
      { blocks: 18, totalCount: 75, dataCount: 47 },
      { blocks: 31, totalCount: 76, dataCount: 48 }
    ]},
    Q: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 34, totalCount: 54, dataCount: 24 },
      { blocks: 34, totalCount: 55, dataCount: 25 }
    ]},
    H: { ecCodewordsPerBlock: 30, groups: [
      { blocks: 20, totalCount: 45, dataCount: 15 },
      { blocks: 61, totalCount: 46, dataCount: 16 }
    ]},
  },
} as Record<QRVersion, Record<ErrorCorrectionLevel, ECBlocks>>;