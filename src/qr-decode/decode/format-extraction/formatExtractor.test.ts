import { describe, it, expect } from 'vitest';
import { extractFormatInfo } from './formatExtractor';
import type { TriStateQR } from '../../types';

describe('formatExtractor', () => {
  // 테스트용 tri-state 매트릭스 생성 (흰색 배경)
  const createTestMatrix = (size: number): (-1 | 0 | 1)[][] => {
    return Array(size).fill(null).map(() => Array(size).fill(1)); // 1 = 흰색
  };

  // 포맷 정보 비트 설정 (위치 1)
  const setFormatBitsLocation1 = (matrix: (-1 | 0 | 1)[][], bits: string): void => {
    const locations = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    
    bits.split('').forEach((bit, index) => {
      if (index < locations.length) {
        const [row, col] = locations[index];
        // QR 코드에서: 비트 1 = 검은색(0), 비트 0 = 흰색(1)
        matrix[row][col] = bit === '1' ? 0 : 1;
      }
    });
  };

  describe('포맷 비트 추출', () => {
    it('올바른 위치에서 포맷 비트를 추출해야 함', () => {
      const matrix = createTestMatrix(25); // Version 2
      // Error Level M (00), Mask Pattern 010 (2)
      // Data: 00010 = 2
      // BCH: 1001101110
      // Format info: 000101001101110
      // Masked: 101111001111100
      setFormatBitsLocation1(matrix, '101111001111100');
      
      const triStateQR: TriStateQR = {
        size: 25,
        matrix,
        finder: [{ x: 3, y: 3 }, { x: 21, y: 3 }, { x: 3, y: 21 }],
        statistics: { black: 0, white: 0, unknown: 0 }
      };
      
      const result = extractFormatInfo(triStateQR);
      
      expect(result).not.toBeNull();
      expect(result?.errorLevel).toBe('M');
      expect(result?.maskPattern).toBe(2);
      expect(result?.isValid).toBe(true);
    });

    it('unknown 모듈이 포함된 경우도 처리해야 함', () => {
      const matrix = createTestMatrix(21); // Version 1
      setFormatBitsLocation1(matrix, '111011111000100'); // L, pattern 0
      
      // 일부 모듈을 unknown으로 설정
      matrix[8][2] = -1;
      matrix[8][4] = -1;
      
      const triStateQR: TriStateQR = {
        size: 21,
        matrix,
        finder: [{ x: 3, y: 3 }, { x: 17, y: 3 }, { x: 3, y: 17 }],
        statistics: { black: 0, white: 0, unknown: 2 }
      };
      
      const result = extractFormatInfo(triStateQR);
      
      expect(result).not.toBeNull();
      expect(result?.confidence).toBeLessThan(1);
    });
  });

  describe('BCH 에러 정정', () => {
    it('1비트 에러를 정정할 수 있어야 함', () => {
      const matrix = createTestMatrix(21);
      // 원본: 111011111000100
      // 1비트 에러: 111011111000101 (마지막 비트 flip)
      setFormatBitsLocation1(matrix, '111011111000101');
      
      const triStateQR: TriStateQR = {
        size: 21,
        matrix,
        finder: [{ x: 3, y: 3 }, { x: 17, y: 3 }, { x: 3, y: 17 }],
        statistics: { black: 0, white: 0, unknown: 0 }
      };
      
      const result = extractFormatInfo(triStateQR);
      
      expect(result).not.toBeNull();
      expect(result?.errorLevel).toBe('L');
      expect(result?.maskPattern).toBe(0);
      expect(result?.isValid).toBe(true);
      expect(result?.errorBits).toBe(1);
    });

    it('2비트 에러를 정정할 수 있어야 함', () => {
      const matrix = createTestMatrix(21);
      // 2비트 에러 추가
      setFormatBitsLocation1(matrix, '111011111000110'); // 2개 비트 변경
      
      const triStateQR: TriStateQR = {
        size: 21,
        matrix,
        finder: [{ x: 3, y: 3 }, { x: 17, y: 3 }, { x: 3, y: 17 }],
        statistics: { black: 0, white: 0, unknown: 0 }
      };
      
      const result = extractFormatInfo(triStateQR);
      
      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(true);
      expect(result?.errorBits).toBeLessThanOrEqual(3);
    });
  });

  describe('엣지 케이스', () => {
    it('빈 매트릭스에서 null을 반환해야 함', () => {
      const triStateQR: TriStateQR = {
        size: 0,
        matrix: [],
        finder: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
        statistics: { black: 0, white: 0, unknown: 0 }
      };
      
      const result = extractFormatInfo(triStateQR);
      expect(result).toBeNull();
    });

    it('너무 많은 unknown 모듈이 있으면 null을 반환해야 함', () => {
      const matrix = createTestMatrix(21);
      const size = 21;
      
      // 포맷 비트 위치 1에 unknown 설정
      const locations1 = [
        [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
        [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
      ];
      
      // 포맷 비트 위치 2에 unknown 설정
      const locations2 = [
        [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
        [size - 5, 8], [size - 6, 8], [size - 7, 8],
        [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
        [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
      ];
      
      // 양쪽 모두 10개씩 unknown으로 설정
      for (let i = 0; i < 10; i++) {
        const [row1, col1] = locations1[i];
        matrix[row1][col1] = -1;
        
        const [row2, col2] = locations2[i];
        matrix[row2][col2] = -1;
      }
      
      const triStateQR: TriStateQR = {
        size: 21,
        matrix,
        finder: [{ x: 3, y: 3 }, { x: 17, y: 3 }, { x: 3, y: 17 }],
        statistics: { black: 0, white: 0, unknown: 15 }
      };
      
      const result = extractFormatInfo(triStateQR);
      expect(result).toBeNull();
    });
  });

  describe('ISO/IEC 18004 규격 준수', () => {
    it('표준 포맷 정보 예제를 올바르게 디코딩해야 함', () => {
      const matrix = createTestMatrix(21);
      
      // ISO 표준 예제: Error Level H (10), Mask Pattern 3 (011)
      // Data: 10011 = 0x13
      // BCH: 0111000010
      // Format: 100110111000010
      // Masked: 001100111010000
      setFormatBitsLocation1(matrix, '001100111010000');
      
      const triStateQR: TriStateQR = {
        size: 21,
        matrix,
        finder: [{ x: 3, y: 3 }, { x: 17, y: 3 }, { x: 3, y: 17 }],
        statistics: { black: 0, white: 0, unknown: 0 }
      };
      
      const result = extractFormatInfo(triStateQR);
      
      expect(result).not.toBeNull();
      expect(result?.errorLevel).toBe('H');
      expect(result?.maskPattern).toBe(3);
      expect(result?.isValid).toBe(true);
      expect(result?.confidence).toBe(1);
    });
  });
});