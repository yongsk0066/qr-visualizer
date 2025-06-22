/**
 * BCH(18,6) 디코더 for 버전 정보
 * ISO/IEC 18004 Section 8.10 및 Appendix D
 */

import { VERSION_GENERATOR_POLYNOMIAL } from './types';

/**
 * BCH 신드롬 계산
 * @param receivedBits 수신된 18비트 버전 정보
 * @returns 신드롬 값
 */
const calculateSyndrome = (receivedBits: number): number => {
  let remainder = receivedBits;
  
  // 다항식 나눗셈 수행
  for (let i = 17; i >= 12; i--) {
    if (remainder & (1 << i)) {
      remainder ^= VERSION_GENERATOR_POLYNOMIAL << (i - 12);
    }
  }
  
  return remainder & 0xFFF; // 12비트 신드롬
};

/**
 * 에러 위치 테이블 생성 (1비트 에러)
 * 각 비트 위치의 에러에 대한 신드롬 계산
 */
const generateSingleErrorTable = (): Map<number, number> => {
  const table = new Map<number, number>();
  
  for (let position = 0; position < 18; position++) {
    // position 위치에 1비트 에러가 있는 경우
    const errorBits = 1 << position;
    const syndrome = calculateSyndrome(errorBits);
    if (syndrome !== 0) {
      table.set(syndrome, position);
    }
  }
  
  return table;
};

const SINGLE_ERROR_TABLE = generateSingleErrorTable();

/**
 * BCH(18,6) 에러 정정
 * 최대 3비트 에러까지 정정 가능
 * 
 * @param receivedBits 수신된 18비트 버전 정보
 * @returns 정정된 버전 번호 또는 null
 */
export const correctVersionBCH = (receivedBits: number): { 
  version: number | null; 
  errorBits: number;
  correctedBits?: number;
} => {
  // 신드롬 계산
  const syndrome = calculateSyndrome(receivedBits);
  
  // 에러 없음
  if (syndrome === 0) {
    return { 
      version: (receivedBits >> 12) & 0x3F, 
      errorBits: 0,
      correctedBits: receivedBits 
    };
  }
  
  // 1비트 에러 정정 시도
  const errorPosition = SINGLE_ERROR_TABLE.get(syndrome);
  if (errorPosition !== undefined) {
    const correctedBits = receivedBits ^ (1 << errorPosition);
    return { 
      version: (correctedBits >> 12) & 0x3F, 
      errorBits: 1,
      correctedBits 
    };
  }
  
  // 2비트 에러 정정 시도
  for (let i = 0; i < 18; i++) {
    for (let j = i + 1; j < 18; j++) {
      const errorPattern = (1 << i) | (1 << j);
      const testBits = receivedBits ^ errorPattern;
      if (calculateSyndrome(testBits) === 0) {
        return { 
          version: (testBits >> 12) & 0x3F, 
          errorBits: 2,
          correctedBits: testBits 
        };
      }
    }
  }
  
  // 3비트 에러 정정 시도
  for (let i = 0; i < 18; i++) {
    for (let j = i + 1; j < 18; j++) {
      for (let k = j + 1; k < 18; k++) {
        const errorPattern = (1 << i) | (1 << j) | (1 << k);
        const testBits = receivedBits ^ errorPattern;
        if (calculateSyndrome(testBits) === 0) {
          return { 
            version: (testBits >> 12) & 0x3F, 
            errorBits: 3,
            correctedBits: testBits 
          };
        }
      }
    }
  }
  
  // 정정 불가능
  return { version: null, errorBits: -1 };
};

/**
 * 버전별 미리 계산된 버전 정보 테이블
 * ISO/IEC 18004 Table D.1
 */
export const VERSION_INFO_TABLE: Record<number, number> = {
  7:  0x07C94,
  8:  0x085BC,
  9:  0x09A99,
  10: 0x0A4D3,
  11: 0x0BBF6,
  12: 0x0C762,
  13: 0x0D847,
  14: 0x0E60D,
  15: 0x0F928,
  16: 0x10B78,
  17: 0x1145D,
  18: 0x12A17,
  19: 0x13532,
  20: 0x149A6,
  21: 0x15683,
  22: 0x168C9,
  23: 0x177EC,
  24: 0x18EC4,
  25: 0x191E1,
  26: 0x1AFAB,
  27: 0x1B08E,
  28: 0x1CC1A,
  29: 0x1D33F,
  30: 0x1ED75,
  31: 0x1F250,
  32: 0x209D5,
  33: 0x216F0,
  34: 0x228BA,
  35: 0x2379F,
  36: 0x24B0B,
  37: 0x2542E,
  38: 0x26A64,
  39: 0x27541,
  40: 0x28C69
};

/**
 * 버전 정보 유효성 검증
 * @param version 버전 번호
 * @param correctedBits 정정된 비트
 * @returns 유효 여부
 */
export const validateVersionInfo = (version: number, correctedBits: number): boolean => {
  if (version < 7 || version > 40) return false;
  
  // 미리 계산된 테이블과 비교
  const expectedBits = VERSION_INFO_TABLE[version];
  return expectedBits === correctedBits;
};