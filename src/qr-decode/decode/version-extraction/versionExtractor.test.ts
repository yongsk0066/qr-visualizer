import { describe, it, expect } from 'vitest';
import { extractVersionInfo } from './versionExtractor';
import { correctVersionBCH, validateVersionInfo, VERSION_INFO_TABLE } from './bchDecoder';
import type { TriStateQR } from '../../types';

describe('versionExtractor', () => {
  describe('extractVersionInfo', () => {
    it('버전 6 이하는 버전 정보 없이 반환해야 함', () => {
      const triStateQR: TriStateQR = {
        matrix: Array(25).fill(null).map(() => Array(25).fill(0) as (0 | 1 | -1)[]),
        size: 25,
        finder: [{x: 0, y: 0}, {x: 18, y: 0}, {x: 0, y: 18}],
        statistics: {
          black: 625,
          white: 0,
          unknown: 0,
        },
      };

      const result = extractVersionInfo(triStateQR);
      // 버전 6 이하는 버전 정보 영역이 없으므로 null 반환
      expect(result).toBeNull();
    });

    it('버전 7의 올바른 버전 정보를 추출해야 함', () => {
      // 버전 7: 0x07C94 (LSB first로 저장)
      const versionBits: (-1|0|1)[] = toBinaryArray(0x07C94, 18);
      const matrix = createMatrixWithVersionInfo(45, versionBits);
      
      const triStateQR: TriStateQR = {
        matrix,
        size: 45,
        finder: [{x: 0, y: 0}, {x: 38, y: 0}, {x: 0, y: 38}],
        statistics: {
          black: 0,
          white: 0,
          unknown: 0,
        },
      };

      const result = extractVersionInfo(triStateQR);
      expect(result).not.toBeNull();
      expect(result?.version).toBe(7);
      expect(result?.isValid).toBe(true);
      expect(result?.errorBits).toBe(0);
    });

    it('1비트 에러가 있는 버전 정보를 정정해야 함', () => {
      // 버전 8: 0x085BC (LSB first로 저장)
      const correctBits = toBinaryArray(0x085BC, 18);
      const errorBits = [...correctBits] as (-1|0|1)[];
      errorBits[5] = (1 - errorBits[5]) as (0|1); // 1비트 에러 주입
      
      const matrix = createMatrixWithVersionInfo(49, errorBits);
      const triStateQR: TriStateQR = {
        matrix,
        size: 49,
        finder: [{x: 0, y: 0}, {x: 42, y: 0}, {x: 0, y: 42}],
        statistics: {
          black: 0,
          white: 0,
          unknown: 0,
        },
      };

      const result = extractVersionInfo(triStateQR);
      expect(result).not.toBeNull();
      expect(result?.version).toBe(8);
      expect(result?.isValid).toBe(true);
      expect(result?.errorBits).toBe(1);
    });

    it('unknown 비트가 있는 버전 정보를 처리해야 함', () => {
      // 버전 10: 0x0A4D3 (LSB first로 저장)
      const versionBits: (-1|0|1)[] = toBinaryArray(0x0A4D3, 18);
      versionBits[6] = -1;  // unknown 비트 추가
      versionBits[14] = -1; // unknown 비트 추가
      const matrix = createMatrixWithVersionInfo(57, versionBits);
      
      const triStateQR: TriStateQR = {
        matrix,
        size: 57,
        finder: [{x: 0, y: 0}, {x: 50, y: 0}, {x: 0, y: 50}],
        statistics: {
          black: 0,
          white: 0,
          unknown: 0,
        },
      };

      const result = extractVersionInfo(triStateQR);
      expect(result).not.toBeNull();
      expect(result?.version).toBe(10);
      expect(result?.isValid).toBe(true);
    });

    it('두 위치에서 다른 버전 정보일 때 신뢰도가 높은 것을 선택해야 함', () => {
      // Location 1: 버전 15 (에러 있음)
      // Location 2: 버전 15 (정상)
      const correctBits = VERSION_INFO_TABLE[15];
      const bits1 = toBinaryArray(correctBits, 18);
      const bits2 = [...bits1] as (-1|0|1)[];
      bits1[3] = (1 - bits1[3]) as (0|1); // Location 1에 에러 주입
      bits1[7] = (1 - bits1[7]) as (0|1);
      
      const matrix = createMatrixWithDifferentVersionInfo(81, bits1, bits2);
      const triStateQR: TriStateQR = {
        matrix,
        size: 81,
        finder: [{x: 0, y: 0}, {x: 74, y: 0}, {x: 0, y: 74}],
        statistics: {
          black: 0,
          white: 0,
          unknown: 0,
        },
      };

      const result = extractVersionInfo(triStateQR);
      expect(result).not.toBeNull();
      expect(result?.version).toBe(15);
      expect(result?.location1?.errorBits).toBeGreaterThan(0);
      expect(result?.location2?.errorBits).toBe(0);
    });
  });

  describe('correctVersionBCH', () => {
    it('에러가 없는 버전 정보를 올바르게 디코딩해야 함', () => {
      // 버전 7-40 테스트
      for (let version = 7; version <= 40; version++) {
        const versionBits = VERSION_INFO_TABLE[version];
        const result = correctVersionBCH(versionBits);
        
        expect(result.version).toBe(version);
        expect(result.errorBits).toBe(0);
        expect(result.correctedBits).toBe(versionBits);
      }
    });

    it('1비트 에러를 정정해야 함', () => {
      const version = 12;
      const correctBits = VERSION_INFO_TABLE[version];
      
      // 각 비트 위치에 1비트 에러 테스트
      for (let i = 0; i < 18; i++) {
        const errorBits = correctBits ^ (1 << i);
        const result = correctVersionBCH(errorBits);
        
        expect(result.version).toBe(version);
        expect(result.errorBits).toBe(1);
        expect(result.correctedBits).toBe(correctBits);
      }
    });

    it('2비트 에러를 정정해야 함', () => {
      const version = 20;
      const correctBits = VERSION_INFO_TABLE[version];
      
      // 몇 가지 2비트 에러 조합 테스트
      const errorPatterns = [
        (1 << 0) | (1 << 5),
        (1 << 3) | (1 << 10),
        (1 << 7) | (1 << 15),
      ];
      
      for (const pattern of errorPatterns) {
        const errorBits = correctBits ^ pattern;
        const result = correctVersionBCH(errorBits);
        
        expect(result.version).toBe(version);
        expect(result.errorBits).toBe(2);
        expect(result.correctedBits).toBe(correctBits);
      }
    });

    it('3비트 에러를 정정해야 함', () => {
      const version = 25;
      const correctBits = VERSION_INFO_TABLE[version];
      
      // 3비트 에러 테스트
      const errorPattern = (1 << 2) | (1 << 8) | (1 << 14);
      const errorBits = correctBits ^ errorPattern;
      const result = correctVersionBCH(errorBits);
      
      expect(result.version).toBe(version);
      expect(result.errorBits).toBe(3);
      expect(result.correctedBits).toBe(correctBits);
    });

    it('4비트 이상 에러는 정정할 수 없어야 함', () => {
      const version = 30;
      const correctBits = VERSION_INFO_TABLE[version];
      
      // 4비트 에러
      const errorPattern = (1 << 1) | (1 << 5) | (1 << 9) | (1 << 13);
      const errorBits = correctBits ^ errorPattern;
      const result = correctVersionBCH(errorBits);
      
      expect(result.version).toBeNull();
      expect(result.errorBits).toBe(-1);
    });
  });

  describe('validateVersionInfo', () => {
    it('올바른 버전 정보를 검증해야 함', () => {
      for (let version = 7; version <= 40; version++) {
        const versionBits = VERSION_INFO_TABLE[version];
        expect(validateVersionInfo(version, versionBits)).toBe(true);
      }
    });

    it('잘못된 버전 번호를 거부해야 함', () => {
      expect(validateVersionInfo(6, 0x12345)).toBe(false);
      expect(validateVersionInfo(41, 0x12345)).toBe(false);
    });

    it('잘못된 비트 패턴을 거부해야 함', () => {
      expect(validateVersionInfo(10, 0x12345)).toBe(false);
      expect(validateVersionInfo(15, VERSION_INFO_TABLE[16])).toBe(false);
    });
  });
});

// 테스트 헬퍼 함수들
function createMatrixWithVersionInfo(size: number, versionBits: (-1|0|1)[]): (-1|0|1)[][] {
  const matrix: (-1|0|1)[][] = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // Location 1: 왼쪽 하단 (6×3)
  let bitIndex = 0;
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 3; row++) {
      const y = size - 11 + row;
      matrix[y][col] = versionBits[bitIndex++];
    }
  }
  
  // Location 2: 오른쪽 상단 (3×6)
  bitIndex = 0;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 3; col++) {
      const x = size - 11 + col;
      matrix[row][x] = versionBits[bitIndex++];
    }
  }
  
  return matrix;
}

function createMatrixWithDifferentVersionInfo(
  size: number, 
  bits1: (-1|0|1)[], 
  bits2: (-1|0|1)[]
): (-1|0|1)[][] {
  const matrix: (-1|0|1)[][] = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // Location 1 (6×3)
  let bitIndex = 0;
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 3; row++) {
      const y = size - 11 + row;
      matrix[y][col] = bits1[bitIndex++];
    }
  }
  
  // Location 2 (3×6)
  bitIndex = 0;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 3; col++) {
      const x = size - 11 + col;
      matrix[row][x] = bits2[bitIndex++];
    }
  }
  
  return matrix;
}

function toBinaryArray(value: number, length: number): (0|1)[] {
  const result: (0|1)[] = [];
  // MSB first로 변경 (encode와 동일하게)
  for (let i = length - 1; i >= 0; i--) {
    result.push(((value >> i) & 1) as 0 | 1);
  }
  return result;
}