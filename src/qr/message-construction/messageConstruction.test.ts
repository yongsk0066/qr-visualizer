import { describe, it, expect } from 'vitest';
import { constructMessage, formatBitString } from './messageConstruction';
import type { ErrorCorrectionData } from '../../shared/types';

describe('Message Construction', () => {
  describe('constructMessage', () => {
    it('기본적인 메시지 구성', () => {
      const errorCorrectionData: ErrorCorrectionData = {
        dataCodewords: [0b10110101, 0b00001111],
        ecCodewords: [0b11010010, 0b10101010],
        interleavedCodewords: [0b10110101, 0b11010010, 0b00001111, 0b10101010],
        totalCodewords: 4,
        dataBlocks: [[0b10110101], [0b00001111]],
        ecBlocks: [[0b11010010], [0b10101010]],
        remainderBits: 0
      };

      const result = constructMessage(errorCorrectionData);

      expect(result.finalBitStream).toBe('10110101110100100000111110101010');
      expect(result.totalBits).toBe(32);
      expect(result.dataBits).toBe(16);
      expect(result.ecBits).toBe(16);
      expect(result.remainderBits).toBe(0);
    });

    it('잔여 비트가 있는 경우', () => {
      const errorCorrectionData: ErrorCorrectionData = {
        dataCodewords: [0b10110101],
        ecCodewords: [0b11010010],
        interleavedCodewords: [0b10110101, 0b11010010],
        totalCodewords: 2,
        dataBlocks: [[0b10110101]],
        ecBlocks: [[0b11010010]],
        remainderBits: 7
      };

      const result = constructMessage(errorCorrectionData);

      expect(result.finalBitStream).toBe('10110101110100100000000');
      expect(result.totalBits).toBe(23);
      expect(result.dataBits).toBe(8);
      expect(result.ecBits).toBe(8);
      expect(result.remainderBits).toBe(7);
    });

    it('빈 데이터 처리', () => {
      const errorCorrectionData: ErrorCorrectionData = {
        dataCodewords: [],
        ecCodewords: [],
        interleavedCodewords: [],
        totalCodewords: 0,
        dataBlocks: [[]],
        ecBlocks: [[]],
        remainderBits: 0
      };

      const result = constructMessage(errorCorrectionData);

      expect(result.finalBitStream).toBe('');
      expect(result.totalBits).toBe(0);
      expect(result.dataBits).toBe(0);
      expect(result.ecBits).toBe(0);
      expect(result.remainderBits).toBe(0);
    });
  });

  describe('formatBitString', () => {
    it('8비트 단위로 그룹화', () => {
      const bits = '1011010111010010000011111010101001010101';
      const formatted = formatBitString(bits);

      expect(formatted).toBe('10110101 11010010 00001111 10101010 01010101');
    });

    it('4비트 단위로 그룹화', () => {
      const bits = '10110101';
      const formatted = formatBitString(bits, 4);

      expect(formatted).toBe('1011 0101');
    });

    it('불완전한 마지막 그룹', () => {
      const bits = '101101011';
      const formatted = formatBitString(bits);

      expect(formatted).toBe('10110101 1');
    });

    it('빈 문자열 처리', () => {
      const formatted = formatBitString('');
      expect(formatted).toBe('');
    });
  });

  describe('실제 QR 코드 시나리오', () => {
    it('버전 1-M 시나리오', () => {
      const errorCorrectionData: ErrorCorrectionData = {
        dataCodewords: new Array(16).fill(0x20),
        ecCodewords: new Array(10).fill(0x30),
        interleavedCodewords: [
          ...new Array(16).fill(0x20),
          ...new Array(10).fill(0x30)
        ],
        totalCodewords: 26,
        dataBlocks: [new Array(16).fill(0x20)],
        ecBlocks: [new Array(10).fill(0x30)],
        remainderBits: 0
      };

      const result = constructMessage(errorCorrectionData);

      expect(result.dataBits).toBe(128); // 16 * 8
      expect(result.ecBits).toBe(80);    // 10 * 8
      expect(result.totalBits).toBe(208); // 128 + 80 + 0
      expect(result.remainderBits).toBe(0);
    });

    it('버전 2-L 시나리오 (잔여 비트 7개)', () => {
      const errorCorrectionData: ErrorCorrectionData = {
        dataCodewords: new Array(34).fill(0x20),
        ecCodewords: new Array(10).fill(0x30),
        interleavedCodewords: [
          ...new Array(34).fill(0x20),
          ...new Array(10).fill(0x30)
        ],
        totalCodewords: 44,
        dataBlocks: [new Array(34).fill(0x20)],
        ecBlocks: [new Array(10).fill(0x30)],
        remainderBits: 7
      };

      const result = constructMessage(errorCorrectionData);

      expect(result.dataBits).toBe(272); // 34 * 8
      expect(result.ecBits).toBe(80);    // 10 * 8
      expect(result.totalBits).toBe(359); // 272 + 80 + 7
      expect(result.remainderBits).toBe(7);
      expect(result.finalBitStream.slice(-7)).toBe('0000000'); // 마지막 7비트는 모두 0
    });
  });
});