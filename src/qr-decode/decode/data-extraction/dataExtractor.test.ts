import { describe, it, expect } from 'vitest';
import { extractData } from './dataExtractor';
import { codewordsToBitStream, readBits } from './utils/bitStream';
import { decodeNumeric, decodeAlphanumeric, decodeByte } from './decoders';

describe('dataExtractor', () => {
  describe('BitStream utilities', () => {
    it('should convert codewords to bit stream', () => {
      const codewords = [0b10101010, 0b11110000];
      const bitStream = codewordsToBitStream(codewords);
      
      expect(bitStream.bits).toEqual([
        1, 0, 1, 0, 1, 0, 1, 0,  // 10101010
        1, 1, 1, 1, 0, 0, 0, 0   // 11110000
      ]);
      expect(bitStream.position).toBe(0);
    });
    
    it('should read bits from stream', () => {
      const codewords = [0b11010010];  // 210 in decimal
      const bitStream = codewordsToBitStream(codewords);
      
      const value = readBits(bitStream, 8);
      expect(value).toBe(210);
      expect(bitStream.position).toBe(8);
    });
  });

  describe('Numeric decoder', () => {
    it('should decode numeric data - 3 digits', () => {
      // 500 in binary is 0111110100 (10 bits)
      const bits = '0111110100';
      const bytes = [
        parseInt(bits.slice(0, 8), 2),  // 01111101
        parseInt((bits.slice(8) + '000000').slice(0, 8), 2)  // 00000000
      ];
      const bitStream = codewordsToBitStream(bytes);
      const result = decodeNumeric(bitStream, 3);
      
      expect(result).not.toBeNull();
      expect(result?.data).toBe('500');
      expect(result?.bits).toBe('0111110100');
    });
    
    it('should decode numeric data - mixed digits', () => {
      // 12345: 123(10bits) + 45(7bits)
      // 123 = 0001111011, 45 = 0101101
      const bits = '00011110110101101';
      const bytes: number[] = [];
      for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.slice(i, i + 8).padEnd(8, '0');
        bytes.push(parseInt(byte, 2));
      }
      
      const bitStream = codewordsToBitStream(bytes);
      const result = decodeNumeric(bitStream, 5);
      
      expect(result).not.toBeNull();
      expect(result?.data).toBe('12345');
    });
  });

  describe('Alphanumeric decoder', () => {
    it('should decode alphanumeric data', () => {
      // "AB" = 10*45 + 11 = 461 = 00111001101
      const bits = '00111001101';
      const bytes = [parseInt(bits.slice(0, 8), 2), parseInt(bits.slice(8).padEnd(8, '0'), 2)];
      
      const bitStream = codewordsToBitStream(bytes);
      const result = decodeAlphanumeric(bitStream, 2);
      
      expect(result).not.toBeNull();
      expect(result?.data).toBe('AB');
    });
  });

  describe('Byte decoder', () => {
    it('should decode byte data as UTF-8', () => {
      const text = 'Hello';
      const bytes = Array.from(new TextEncoder().encode(text));
      
      const bitStream = codewordsToBitStream(bytes);
      const result = decodeByte(bitStream, bytes.length);
      
      expect(result).not.toBeNull();
      expect(result?.data).toBe('Hello');
      expect(result?.bytes).toEqual(bytes);
    });

    it('should decode Korean text as UTF-8', () => {
      const text = '안녕하세요';
      const bytes = Array.from(new TextEncoder().encode(text));
      
      const bitStream = codewordsToBitStream(bytes);
      const result = decodeByte(bitStream, bytes.length);
      
      expect(result).not.toBeNull();
      expect(result?.data).toBe('안녕하세요');
      expect(result?.bytes).toEqual(bytes);
    });

    it('should handle mixed Korean and English text', () => {
      const text = 'Hello 안녕하세요 World!';
      const bytes = Array.from(new TextEncoder().encode(text));
      
      const bitStream = codewordsToBitStream(bytes);
      const result = decodeByte(bitStream, bytes.length);
      
      expect(result).not.toBeNull();
      expect(result?.data).toBe('Hello 안녕하세요 World!');
      expect(result?.bytes).toEqual(bytes);
    });
  });

  describe('Full data extraction', () => {
    it('should extract numeric mode data', () => {
      // 숫자 모드: 0001 (4 bits)
      // 문자 수 3 (v1-9: 10 bits): 0000000011
      // 데이터 "123": 0001111011 (10 bits)
      // 종료: 0000 (4 bits)
      // 총 28 bits = 3.5 bytes
      const bits = '00010000000011000111101100000000';
      const codewords = [
        parseInt(bits.slice(0, 8), 2),   // 00010000
        parseInt(bits.slice(8, 16), 2),  // 00001100
        parseInt(bits.slice(16, 24), 2), // 01111011
        parseInt(bits.slice(24, 32), 2), // 00000000
      ];
      
      const result = extractData(codewords, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.decodedText).toBe('123');
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].mode).toBe(0b0001);
      expect(result.segments[0].data).toBe('123');
      expect(result.segments[0].characterCount).toBe(3);
    });

    it('should extract byte mode data', () => {
      // 바이트 모드: 0100 (4 bits)
      // 문자 수 5 (v1-9: 8 bits): 00000101
      // 데이터 "Hello": 72, 101, 108, 108, 111
      // 종료: 0000
      const modeAndCount = '010000000101';
      const helloBytes = [72, 101, 108, 108, 111];
      const terminator = '0000';
      
      const bits = modeAndCount + helloBytes.map(b => b.toString(2).padStart(8, '0')).join('') + terminator;
      const codewords: number[] = [];
      for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.slice(i, i + 8).padEnd(8, '0');
        codewords.push(parseInt(byte, 2));
      }
      
      const result = extractData(codewords, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.decodedText).toBe('Hello');
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].mode).toBe(0b0100);
      expect(result.segments[0].data).toBe('Hello');
      expect(result.segments[0].characterCount).toBe(5);
    });
  });
});