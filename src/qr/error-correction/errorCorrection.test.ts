import { describe, it, expect } from 'vitest';
import {
  generateRSPolynomial,
  generateErrorCorrectionCodewords,
  getECBlocks,
  performErrorCorrection,
  bitStreamToCodewords,
  interleaveCodewords,
} from './errorCorrection';

describe('errorCorrection', () => {
  describe('Reed-Solomon 다항식 생성', () => {
    it('차수 2의 생성 다항식 생성', () => {
      const poly = generateRSPolynomial(2);
      // (x - α^0)(x - α^1) = x^2 - (α^0 + α^1)x + α^0 * α^1
      expect(poly).toHaveLength(3);
      expect(poly[0]).toBe(1); // x^2 계수
    });

    it('차수 7의 생성 다항식 생성 (버전 1-L)', () => {
      const poly = generateRSPolynomial(7);
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
      const poly = generateRSPolynomial(4);
      expect(poly).toHaveLength(5); // 차수 + 1
      expect(poly[0]).toBe(1); // 최고차항 계수
      expect(poly.every(coef => coef >= 0 && coef < 256)).toBe(true);
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
  });
});