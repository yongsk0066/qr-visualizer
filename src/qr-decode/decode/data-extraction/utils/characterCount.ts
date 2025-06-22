/**
 * 문자 개수 지시자 관련 유틸리티
 * ISO/IEC 18004 Table 3
 */

import { Mode } from '../types';
import type { QRVersion } from '../../../../shared/types';

/**
 * 버전별 문자 개수 지시자 비트 수
 * ISO/IEC 18004 Table 3
 */
const CHARACTER_COUNT_BITS: Record<Mode, Record<number, number>> = {
  [Mode.NUMERIC]: {
    1: 10,  // v1-9: 10 bits
    10: 12, // v10-26: 12 bits
    27: 14  // v27-40: 14 bits
  },
  [Mode.ALPHANUMERIC]: {
    1: 9,   // v1-9: 9 bits
    10: 11, // v10-26: 11 bits
    27: 13  // v27-40: 13 bits
  },
  [Mode.BYTE]: {
    1: 8,   // v1-9: 8 bits
    10: 16, // v10-26: 16 bits
    27: 16  // v27-40: 16 bits
  },
  [Mode.KANJI]: {
    1: 8,   // v1-9: 8 bits
    10: 10, // v10-26: 10 bits
    27: 12  // v27-40: 12 bits
  },
  [Mode.ECI]: {
    1: 0,   // ECI는 문자 개수 지시자 없음
    10: 0,
    27: 0
  },
  [Mode.TERMINATOR]: {
    1: 0,   // 종료 패턴은 문자 개수 지시자 없음
    10: 0,
    27: 0
  }
};

/**
 * 주어진 모드와 버전에 대한 문자 개수 지시자 비트 수 반환
 */
export const getCharacterCountBits = (mode: Mode, version: QRVersion): number => {
  const modeBits = CHARACTER_COUNT_BITS[mode];
  if (!modeBits) {
    return 0;
  }
  
  // 버전 범위에 따라 비트 수 결정
  if (version <= 9) {
    return modeBits[1];
  } else if (version <= 26) {
    return modeBits[10];
  } else {
    return modeBits[27];
  }
};