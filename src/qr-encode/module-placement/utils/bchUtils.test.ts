import { describe, it, expect } from 'vitest';
import { 
  calculateFormatBCH, 
  calculateVersionBCH, 
  calculateFormatInfo, 
  calculateVersionInfo,
  VERSION_INFO_TABLE 
} from './bchUtils';

describe('BCH 계산 유틸리티', () => {
  describe('calculateFormatBCH', () => {
    it('포맷 정보 BCH 계산이 정확해야 함', () => {
      // ISO/IEC 18004 부속서 C 예시: EC 레벨 M(00), 마스크 패턴 101 = 00101
      const data = 0b00101; // 5비트
      const bch = calculateFormatBCH(data);
      
      // 예상 BCH: 0011011100 (문서 예시)
      expect(bch.toString(2).padStart(10, '0')).toBe('0011011100');
    });
    
    it('다른 데이터로 BCH 계산 테스트', () => {
      // 각 비트 위치별 계산 확인
      expect(calculateFormatBCH(0b00000)).toBe(0b0000000000);
      expect(calculateFormatBCH(0b11111)).not.toBe(0b0000000000);
    });
  });

  describe('calculateVersionBCH', () => {
    it('버전 7 BCH 계산이 정확해야 함', () => {
      // ISO/IEC 18004 부속서 D 예시: 버전 7 = 000111
      const version = 7;
      const bch = calculateVersionBCH(version);
      
      // 예상 BCH: 110010010100 (문서 예시)
      expect(bch.toString(2).padStart(12, '0')).toBe('110010010100');
    });
    
    it('다른 버전들의 BCH 계산', () => {
      // 각 버전의 고유한 BCH 값 확인
      expect(calculateVersionBCH(7)).not.toBe(calculateVersionBCH(8));
      expect(calculateVersionBCH(10)).not.toBe(calculateVersionBCH(11));
    });
  });

  describe('calculateFormatInfo', () => {
    it('포맷 정보 전체 계산이 정확해야 함', () => {
      // ISO/IEC 18004 부속서 C 예시: EC 레벨 M, 마스크 패턴 5(101)
      const formatInfo = calculateFormatInfo(1, 5); // M=1, mask=5
      
      // 예상 결과: 100000011001110 (문서 예시)
      expect(formatInfo.toString(2).padStart(15, '0')).toBe('100000011001110');
    });
    
    it('모든 EC 레벨과 마스크 패턴 조합이 다른 값을 가져야 함', () => {
      const values = new Set();
      
      for (let ec = 0; ec < 4; ec++) {
        for (let mask = 0; mask < 8; mask++) {
          const value = calculateFormatInfo(ec, mask);
          expect(values.has(value)).toBe(false);
          values.add(value);
        }
      }
      
      expect(values.size).toBe(32); // 4 * 8 = 32개 고유값
    });
    
    it('EC 레벨 매핑이 정확해야 함', () => {
      // L=01, M=00, Q=11, H=10
      const maskPattern = 0;
      
      const formatL = calculateFormatInfo(0, maskPattern); // L
      const formatM = calculateFormatInfo(1, maskPattern); // M  
      const formatQ = calculateFormatInfo(2, maskPattern); // Q
      const formatH = calculateFormatInfo(3, maskPattern); // H
      
      // 각각 다른 값이어야 함
      expect(new Set([formatL, formatM, formatQ, formatH]).size).toBe(4);
    });
  });

  describe('calculateVersionInfo', () => {
    it('버전 7 정보 전체 계산이 정확해야 함', () => {
      const versionInfo = calculateVersionInfo(7);
      
      // 예상 결과: 000111110010010100 (문서 예시)
      expect(versionInfo.toString(2).padStart(18, '0')).toBe('000111110010010100');
      expect(versionInfo).toBe(0x07C94);
    });
    
    it('미리 계산된 테이블과 일치해야 함', () => {
      // 모든 버전 7-40에 대해 테이블 값과 비교
      for (let version = 7; version <= 40; version++) {
        const calculated = calculateVersionInfo(version);
        const expected = VERSION_INFO_TABLE[version];
        
        expect(calculated).toBe(expected);
      }
    });
    
    it('유효하지 않은 버전에 대해 에러를 던져야 함', () => {
      expect(() => calculateVersionInfo(6)).toThrow();
      expect(() => calculateVersionInfo(41)).toThrow();
      expect(() => calculateVersionInfo(0)).toThrow();
    });
    
    it('각 버전이 고유한 정보를 가져야 함', () => {
      const values = new Set();
      
      for (let version = 7; version <= 40; version++) {
        const value = calculateVersionInfo(version);
        expect(values.has(value)).toBe(false);
        values.add(value);
      }
      
      expect(values.size).toBe(34); // 버전 7-40 = 34개
    });
  });

  describe('VERSION_INFO_TABLE', () => {
    it('테이블의 모든 값이 18비트 이내여야 함', () => {
      for (const [version, info] of Object.entries(VERSION_INFO_TABLE)) {
        expect(info).toBeLessThan(1 << 18); // 18비트 최대값
        expect(info).toBeGreaterThanOrEqual(0);
        expect(Number(version)).toBeGreaterThanOrEqual(7);
        expect(Number(version)).toBeLessThanOrEqual(40);
      }
    });
    
    it('테이블의 모든 값이 고유해야 함', () => {
      const values = Object.values(VERSION_INFO_TABLE);
      const uniqueValues = new Set(values);
      
      expect(uniqueValues.size).toBe(values.length);
    });
  });
});