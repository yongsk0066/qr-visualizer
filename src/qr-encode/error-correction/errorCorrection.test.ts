import { describe, it, expect } from 'vitest';
import type { QRVersion } from '../../shared/types';
import {
  getECBlocks,
  performErrorCorrection,
} from './errorCorrection';
import {
  createGeneratorPolynomial,
  generateErrorCorrectionCodewords,
} from './reed-solomon/reedSolomon';
import { GaloisField256 } from './reed-solomon/galoisField';
import {
  bitStreamToCodewords,
  interleaveCodewords,
} from './utils';

describe('errorCorrection', () => {
  describe('Reed-Solomon 다항식 생성', () => {
    it('차수 2의 생성 다항식 생성', () => {
      const poly = createGeneratorPolynomial(2);
      // (x - α^0)(x - α^1) = x^2 - (α^0 + α^1)x + α^0 * α^1
      expect(poly).toHaveLength(3);
      expect(poly[0]).toBe(1); // x^2 계수
    });

    it('차수 7의 생성 다항식 생성 (버전 1-L)', () => {
      const poly = createGeneratorPolynomial(7);
      expect(poly).toHaveLength(8);
      expect(poly[0]).toBe(1); // 최고차항 계수는 항상 1
    });
  });

  describe('에러 정정 코드워드 생성', () => {
    it('간단한 데이터에 대한 에러 정정 생성', () => {
      const dataCodewords = [64, 196, 132, 84, 196, 196, 242, 194, 4, 132, 20, 37, 34, 16];
      const ecCodewords = generateErrorCorrectionCodewords(dataCodewords, 10);
      
      expect(ecCodewords).toHaveLength(10);
      expect(ecCodewords.every(cw => cw >= 0 && cw < 256)).toBe(true);
    });

    it('빈 데이터에 대한 에러 정정', () => {
      const ecCodewords = generateErrorCorrectionCodewords([], 5);
      expect(ecCodewords).toHaveLength(5);
      expect(ecCodewords.every(cw => cw === 0)).toBe(true);
    });
  });

  describe('EC 블록 구조', () => {
    it('버전 1의 EC 블록 정보', () => {
      const ecBlocksL = getECBlocks(1, 'L');
      expect(ecBlocksL.ecCodewordsPerBlock).toBe(7);
      expect(ecBlocksL.groups).toHaveLength(1);
      expect(ecBlocksL.groups[0].blocks).toBe(1);
      expect(ecBlocksL.groups[0].dataCount).toBe(19);

      const ecBlocksH = getECBlocks(1, 'H');
      expect(ecBlocksH.ecCodewordsPerBlock).toBe(17);
      expect(ecBlocksH.groups[0].dataCount).toBe(9);
    });

    it('버전 5의 다중 블록 구조', () => {
      const ecBlocks = getECBlocks(5, 'Q');
      expect(ecBlocks.groups).toHaveLength(2);
      expect(ecBlocks.groups[0].blocks).toBe(2);
      expect(ecBlocks.groups[1].blocks).toBe(2);
    });
  });

  describe('전체 에러 정정 처리', () => {
    it('버전 1-M 에러 정정', () => {
      const dataCodewords = Array(16).fill(0).map((_, i) => i); // 16개의 데이터 코드워드
      const result = performErrorCorrection(dataCodewords, 1, 'M');
      
      expect(result.dataBlocks).toHaveLength(1);
      expect(result.dataBlocks[0]).toHaveLength(16);
      expect(result.ecBlocks).toHaveLength(1);
      expect(result.ecBlocks[0]).toHaveLength(10);
      expect(result.totalDataCodewords).toBe(16);
      expect(result.totalECCodewords).toBe(10);
    });

    it('버전 5-H 다중 블록 처리', () => {
      const dataCodewords = Array(46).fill(0).map((_, i) => i);
      const result = performErrorCorrection(dataCodewords, 5, 'H');
      
      expect(result.dataBlocks).toHaveLength(4); // 2 + 2 블록
      expect(result.ecBlocks).toHaveLength(4);
      expect(result.dataBlocks[0]).toHaveLength(11);
      expect(result.dataBlocks[2]).toHaveLength(12);
    });
  });

  describe('비트 스트림 변환', () => {
    it('8비트 정렬된 비트 스트림', () => {
      const bitStream = '0001000000010000';
      const codewords = bitStreamToCodewords(bitStream);
      
      expect(codewords).toEqual([16, 16]); // 00010000 = 16
    });

    it('8비트로 정렬되지 않은 비트 스트림', () => {
      const bitStream = '00010101'; // 5비트
      const codewords = bitStreamToCodewords(bitStream);
      
      expect(codewords).toEqual([21]); // 00010101 패딩 후 = 21
    });

    it('빈 비트 스트림', () => {
      const codewords = bitStreamToCodewords('');
      expect(codewords).toEqual([]);
    });
  });

  describe('인터리빙', () => {
    it('단일 블록 인터리빙', () => {
      const dataBlocks = [[1, 2, 3]];
      const ecBlocks = [[4, 5]];
      const result = interleaveCodewords(dataBlocks, ecBlocks);
      
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('다중 블록 인터리빙', () => {
      const dataBlocks = [[1, 3], [2, 4]];
      const ecBlocks = [[5, 7], [6, 8]];
      const result = interleaveCodewords(dataBlocks, ecBlocks);
      
      // 데이터: 1,2,3,4 (열 우선)
      // EC: 5,6,7,8 (열 우선)
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('불균등 블록 길이 인터리빙', () => {
      const dataBlocks = [[1, 3, 5], [2, 4]]; // 3개, 2개
      const ecBlocks = [[6, 8], [7, 9]];
      const result = interleaveCodewords(dataBlocks, ecBlocks);
      
      // 데이터: 1,2,3,4,5
      // EC: 6,7,8,9
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('갈루아 필드 연산', () => {
    it('생성 다항식이 올바른 구조를 가짐', () => {
      const poly = createGeneratorPolynomial(4);
      expect(poly).toHaveLength(5); // 차수 + 1
      expect(poly[0]).toBe(1); // 최고차항 계수
      expect(poly.every(coef => coef >= 0 && coef < 256)).toBe(true);
    });
  });

  describe('갈루아 필드 연산 직접 테스트', () => {
    it('GaloisField256 multiply 연산', () => {
      // 기본 케이스
      expect(GaloisField256.multiply(0, 5)).toBe(0);
      expect(GaloisField256.multiply(5, 0)).toBe(0);
      expect(GaloisField256.multiply(1, 7)).toBe(7);
      
      // 갈루아 필드 특성 테스트
      expect(GaloisField256.multiply(2, 3)).toBe(6);
      expect(GaloisField256.multiply(255, 255)).toBe(226); // α^254 * α^254 = α^253
    });

    it('GaloisField256 getExp 연산', () => {
      expect(GaloisField256.getExp(0)).toBe(1); // α^0 = 1
      expect(GaloisField256.getExp(1)).toBe(2); // α^1 = 2
      expect(GaloisField256.getExp(8)).toBe(29); // 갈루아 필드 테이블 값
      
      // 주기성 테스트 (255로 나눈 나머지)
      expect(GaloisField256.getExp(255)).toBe(GaloisField256.getExp(0));
      expect(GaloisField256.getExp(256)).toBe(GaloisField256.getExp(1));
    });

    it('갈루아 필드 곱셈 교환법칙', () => {
      for (let a = 1; a < 10; a++) {
        for (let b = 1; b < 10; b++) {
          expect(GaloisField256.multiply(a, b))
            .toBe(GaloisField256.multiply(b, a));
        }
      }
    });

    it('갈루아 필드 곱셈 결과 범위', () => {
      for (let i = 0; i < 256; i++) {
        for (let j = 0; j < 256; j += 50) {
          const result = GaloisField256.multiply(i, j);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThan(256);
        }
      }
    });
  });

  describe('에지 케이스 및 경계값 테스트', () => {
    it('잘못된 버전에 대한 에러 처리', () => {
      // 존재하지 않는 버전 (40 초과)
      const ecBlocks = getECBlocks(50 as QRVersion, 'L');
      expect(ecBlocks).toEqual(getECBlocks(1, 'L')); // 기본값으로 폴백
    });

    it('최대 데이터 크기 처리 (버전 40)', () => {
      const maxDataCodewords = Array(2956).fill(255); // 버전 40-L 최대 데이터
      expect(() => {
        performErrorCorrection(maxDataCodewords, 40, 'L');
      }).not.toThrow();
    });

    it('빈 데이터 배열 처리', () => {
      const result = performErrorCorrection([], 1, 'L');
      expect(result.dataBlocks).toHaveLength(1);
      expect(result.dataBlocks[0]).toEqual([]);
      expect(result.ecBlocks[0]).toHaveLength(7); // 에러 정정은 여전히 생성
    });

    it('255 값 (최대 바이트) 처리', () => {
      const maxByteData = Array(16).fill(255);
      const result = performErrorCorrection(maxByteData, 1, 'M');
      
      expect(result.dataBlocks[0]).toEqual(maxByteData);
      expect(result.ecBlocks[0].every(cw => cw >= 0 && cw < 256)).toBe(true);
    });

    it('불규칙한 비트 스트림 패딩', () => {
      const oddBitStream = '1010101'; // 7비트
      const codewords = bitStreamToCodewords(oddBitStream);
      expect(codewords).toEqual([170]); // 10101010 = 170
    });

    it('매우 긴 비트 스트림', () => {
      const longBitStream = '1'.repeat(1000);
      const codewords = bitStreamToCodewords(longBitStream);
      expect(codewords).toHaveLength(125); // 1000/8 = 125
      expect(codewords.every(cw => cw === 255)).toBe(true); // 모든 비트가 1
    });
  });

  describe('ISO/IEC 18004 표준 준수 테스트', () => {
    it('표준 예제 1: 버전 1-H 블록 구조', () => {
      const ecBlocks = getECBlocks(1, 'H');
      expect(ecBlocks.ecCodewordsPerBlock).toBe(17);
      expect(ecBlocks.groups).toHaveLength(1);
      expect(ecBlocks.groups[0].blocks).toBe(1);
      expect(ecBlocks.groups[0].dataCount).toBe(9);
    });

    it('표준 예제 2: 버전 5-Q 다중 그룹', () => {
      const ecBlocks = getECBlocks(5, 'Q');
      expect(ecBlocks.groups).toHaveLength(2);
      
      // 첫 번째 그룹: 2블록, 각 15개 데이터
      expect(ecBlocks.groups[0].blocks).toBe(2);
      expect(ecBlocks.groups[0].dataCount).toBe(15);
      
      // 두 번째 그룹: 2블록, 각 16개 데이터
      expect(ecBlocks.groups[1].blocks).toBe(2);
      expect(ecBlocks.groups[1].dataCount).toBe(16);
    });

    it('Reed-Solomon 생성 다항식 표준 준수', () => {
      // ISO/IEC 18004 부속서 A에 따른 생성 다항식
      const poly7 = createGeneratorPolynomial(7);
      const poly10 = createGeneratorPolynomial(10);
      
      // 차수 확인
      expect(poly7).toHaveLength(8);
      expect(poly10).toHaveLength(11);
      
      // 최고차항은 항상 1
      expect(poly7[0]).toBe(1);
      expect(poly10[0]).toBe(1);
      
      // 모든 계수는 GF(256) 범위 내
      expect(poly7.every(c => c >= 0 && c < 256)).toBe(true);
      expect(poly10.every(c => c >= 0 && c < 256)).toBe(true);
    });

    it('인터리빙 표준 준수 (ISO 8.6)', () => {
      // 표준에 따른 인터리빙 순서 테스트
      const dataBlocks = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
      const ecBlocks = [[10, 13], [11, 14], [12, 15]];
      
      const result = interleaveCodewords(dataBlocks, ecBlocks);
      
      // 데이터 먼저, 그다음 EC
      const expectedData = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const expectedEC = [10, 11, 12, 13, 14, 15];
      const expected = [...expectedData, ...expectedEC];
      
      expect(result).toEqual(expected);
    });
  });

  describe('성능 및 안정성 테스트', () => {
    it('대용량 데이터 처리 성능', () => {
      // 버전 10-L의 실제 데이터 용량: (2×68) + (2×69) = 274
      const maxDataForV10L = 274;
      const largeData = Array(maxDataForV10L).fill(0).map((_, i) => i % 256);
      
      const startTime = performance.now();
      const result = performErrorCorrection(largeData, 10, 'L');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // 1초 이내
      expect(result.totalDataCodewords).toBe(maxDataForV10L);
    });

    it('반복 호출 일관성', () => {
      const testData = [1, 2, 3, 4, 5];
      
      const result1 = performErrorCorrection(testData, 1, 'M');
      const result2 = performErrorCorrection(testData, 1, 'M');
      const result3 = performErrorCorrection(testData, 1, 'M');
      
      expect(result1.ecBlocks[0]).toEqual(result2.ecBlocks[0]);
      expect(result2.ecBlocks[0]).toEqual(result3.ecBlocks[0]);
    });

    it('메모리 효율성 (큰 생성 다항식)', () => {
      // 차수 30 생성 다항식도 정상 처리되어야 함
      expect(() => {
        const poly = createGeneratorPolynomial(30);
        expect(poly).toHaveLength(31);
      }).not.toThrow();
    });
  });

  describe('통합 테스트', () => {
    it('실제 QR 데이터 에러 정정 (HELLO WORLD)', () => {
      // 버전 1-M은 16개의 데이터 코드워드가 필요
      // 실제 인코딩된 데이터 + 패딩으로 16개를 만들어야 함
      const dataCodewords = [
        0x20, 0x5B, 0x0B, 0x78, 0xD1, 0x72, 0xDC, 0x4D,
        0x43, 0x40, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11
      ]; // 16개의 데이터 코드워드
      
      const result = performErrorCorrection(dataCodewords, 1, 'M');
      
      expect(result.dataBlocks).toHaveLength(1);
      expect(result.dataBlocks[0]).toHaveLength(16);
      expect(result.ecBlocks).toHaveLength(1);
      expect(result.ecBlocks[0]).toHaveLength(10);
      expect(result.totalDataCodewords).toBe(16);
      expect(result.totalECCodewords).toBe(10);
      
      // 인터리빙 테스트
      const interleaved = interleaveCodewords(result.dataBlocks, result.ecBlocks);
      expect(interleaved).toHaveLength(26); // 16 + 10
    });

    it('다양한 버전/레벨 조합 안정성', () => {
      const testCases = [
        { version: 1 as QRVersion, level: 'L' as const, dataSize: 15 },
        { version: 2 as QRVersion, level: 'M' as const, dataSize: 28 },
        { version: 5 as QRVersion, level: 'Q' as const, dataSize: 44 },
        { version: 10 as QRVersion, level: 'H' as const, dataSize: 119 },
      ];

      testCases.forEach(({ version, level, dataSize }) => {
        const testData = Array(dataSize).fill(0).map((_, i) => i % 256);
        
        expect(() => {
          const result = performErrorCorrection(testData, version, level);
          expect(result.totalDataCodewords).toBe(dataSize);
          expect(result.ecBlocks.every(block => 
            block.every(cw => cw >= 0 && cw < 256)
          )).toBe(true);
        }).not.toThrow();
      });
    });
  });

  describe('Galois Field GF(256) 핵심 연산', () => {
    it('QR 표준 α 거듭제곱 값 검증', () => {
      // ISO/IEC 18004 Appendix A.1에서 정의된 기본 값들
      expect(GaloisField256.getExp(0)).toBe(1);   // α^0 = 1
      expect(GaloisField256.getExp(1)).toBe(2);   // α^1 = 2  
      expect(GaloisField256.getExp(2)).toBe(4);   // α^2 = 4
      expect(GaloisField256.getExp(3)).toBe(8);   // α^3 = 8
      expect(GaloisField256.getExp(4)).toBe(16);  // α^4 = 16
      expect(GaloisField256.getExp(5)).toBe(32);  // α^5 = 32
      expect(GaloisField256.getExp(6)).toBe(64);  // α^6 = 64
      expect(GaloisField256.getExp(7)).toBe(128); // α^7 = 128
    });

    it('곱셈 연산 기본 속성', () => {
      // 곱셈 항등원
      expect(GaloisField256.multiply(42, 1)).toBe(42);
      expect(GaloisField256.multiply(1, 42)).toBe(42);
      
      // 곱셈 영원소
      expect(GaloisField256.multiply(42, 0)).toBe(0);
      expect(GaloisField256.multiply(0, 42)).toBe(0);
    });

    it('255주기 순환 특성', () => {
      // α^255 = α^0 = 1 (GF(256)의 곱셈군 위수는 255)
      expect(GaloisField256.getExp(255)).toBe(GaloisField256.getExp(0));
      expect(GaloisField256.getExp(256)).toBe(GaloisField256.getExp(1));
    });
  });
});