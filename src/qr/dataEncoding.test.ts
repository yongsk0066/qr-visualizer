import { describe, it, expect } from 'vitest';
import { encodeData } from './dataEncoding';
import type { QRMode } from './types';

describe('dataEncoding', () => {
  describe('숫자 모드 인코딩', () => {
    it('3자리 숫자를 10비트로 인코딩', () => {
      const result = encodeData('123', 'numeric', 1, 152);

      expect(result.modeIndicator).toBe('0001'); // 숫자 모드
      expect(result.characterCount).toBe('0000000011'); // 3문자 (10비트)
      expect(result.data).toBe('0001111011'); // 123 → 10비트
      expect(result.bitStream).toContain('000100000000110001111011');
    });

    it('2자리 숫자를 7비트로 인코딩', () => {
      const result = encodeData('67', 'numeric', 1, 152);

      expect(result.characterCount).toBe('0000000010'); // 2문자
      expect(result.data).toBe('1000011'); // 67 → 7비트
    });

    it('1자리 숫자를 4비트로 인코딩', () => {
      const result = encodeData('5', 'numeric', 1, 152);

      expect(result.characterCount).toBe('0000000001'); // 1문자
      expect(result.data).toBe('0101'); // 5 → 4비트
    });

    it('표준 예제: 01234567 인코딩', () => {
      const result = encodeData('01234567', 'numeric', 1, 152);

      expect(result.modeIndicator).toBe('0001');
      expect(result.characterCount).toBe('0000001000'); // 8문자

      // 검증: 012=12 → 0000001100 (10비트)
      expect(result.data.slice(0, 10)).toBe('0000001100');
      // 검증: 345=345 → 0101011001 (10비트)
      expect(result.data.slice(10, 20)).toBe('0101011001');
      // 검증: 67=67 → 1000011 (7비트)
      expect(result.data.slice(20)).toBe('1000011');

      expect(result.data).toBe('000000110001010110011000011');
    });
  });

  describe('영숫자 모드 인코딩', () => {
    it('2문자를 11비트로 인코딩', () => {
      const result = encodeData('AC', 'alphanumeric', 1, 152);

      expect(result.modeIndicator).toBe('0010'); // 영숫자 모드
      expect(result.characterCount).toBe('000000010'); // 2문자 (9비트)
      // A=10, C=12 → 10*45+12=462 → 00111001110
      expect(result.data).toBe('00111001110');
    });

    it('1문자를 6비트로 인코딩', () => {
      const result = encodeData('A', 'alphanumeric', 1, 152);

      expect(result.characterCount).toBe('000000001'); // 1문자
      expect(result.data).toBe('001010'); // A=10 → 6비트
    });

    it('표준 예제: AC-42 인코딩', () => {
      const result = encodeData('AC-42', 'alphanumeric', 1, 152);

      expect(result.characterCount).toBe('000000101'); // 5문자
      // AC → 00111001110, -4 → 11100111001, 2 → 000010
      expect(result.data).toBe('0011100111011100111001000010');
    });
  });

  describe('바이트 모드 인코딩', () => {
    it('ASCII 문자를 8비트씩 인코딩', () => {
      const result = encodeData('Hello', 'byte', 1, 152);

      expect(result.modeIndicator).toBe('0100'); // 바이트 모드
      expect(result.characterCount).toBe('00000101'); // 5문자 (8비트)
      // H=72, e=101, l=108, l=108, o=111
      expect(result.data).toBe('0100100001100101011011000110110001101111');
    });

    it('특수문자 인코딩', () => {
      const result = encodeData('!@#', 'byte', 1, 152);

      expect(result.characterCount).toBe('00000011'); // 3문자
      // !=33, @=64, #=35
      expect(result.data).toBe('001000010100000000100011');
    });
  });

  describe('종단자 및 패딩', () => {
    it('4비트 종단자 추가', () => {
      const result = encodeData('1', 'numeric', 1, 152);

      // 모드(4) + 카운트(10) + 데이터(4) = 18비트
      // 종단자는 데이터 뒤에 추가되지만 패딩으로 인해 끝에 없을 수 있음
      const withoutPadding = result.bitStream.slice(0, 22); // 첫 22비트만
      expect(withoutPadding).toMatch(/0000$/); // 22비트에서 끝 4비트가 0000
    });

    it('8비트 경계로 패딩', () => {
      const result = encodeData('1', 'numeric', 1, 152);

      // 22비트 → 24비트(8의 배수)로 패딩
      expect(result.bitStream.length % 8).toBe(0);
    });

    it('패드 코드워드로 용량 채우기', () => {
      const result = encodeData('1', 'numeric', 1, 152);

      expect(result.totalBits).toBe(152); // 정확히 용량만큼
      expect(result.bitStream).toContain('11101100'); // 패드 패턴1
      expect(result.bitStream).toContain('00010001'); // 패드 패턴2
    });
  });

  describe('버전별 문자 카운트 비트', () => {
    it('버전 1-9: 숫자 모드 10비트', () => {
      const result = encodeData('123', 'numeric', 5, 272);
      expect(result.characterCount).toBe('0000000011'); // 10비트
    });

    it('버전 10-26: 숫자 모드 12비트', () => {
      const result = encodeData('123', 'numeric', 15, 3320);
      expect(result.characterCount).toBe('000000000011'); // 12비트
    });

    it('버전 27-40: 숫자 모드 14비트', () => {
      const result = encodeData('123', 'numeric', 30, 10984);
      expect(result.characterCount).toBe('00000000000011'); // 14비트
    });
  });

  describe('실제 QR 표준 예제', () => {
    it('문서 예제 1: 01234567 (버전 1-H)', () => {
      // 표준 문서의 숫자 모드 예제 재현
      const result = encodeData('01234567', 'numeric', 1, 72);

      expect(result.modeIndicator).toBe('0001');
      expect(result.characterCount).toBe('0000001000');
      expect(result.data).toBe('000000110001010110011000011');

      // 전체 비트 스트림 시작 부분 확인
      expect(result.bitStream).toMatch(/^00010000001000000000110001010110011000011/);
    });

    it('문서 예제 2: AC-42 (버전 1-H)', () => {
      // 표준 문서의 영숫자 모드 예제 재현
      const result = encodeData('AC-42', 'alphanumeric', 1, 72);

      expect(result.modeIndicator).toBe('0010');
      expect(result.characterCount).toBe('000000101');
      expect(result.data).toBe('0011100111011100111001000010');
    });
  });

  describe('에러 케이스', () => {
    it('빈 문자열 처리', () => {
      const result = encodeData('', 'numeric', 1, 152);

      expect(result.characterCount).toBe('0000000000'); // 0문자
      expect(result.data).toBe(''); // 빈 데이터
      expect(result.totalBits).toBe(152); // 패딩으로 채워짐
    });

    it('지원되지 않는 모드', () => {
      expect(() => {
        encodeData('test', 'invalid' as QRMode, 1, 152);
      }).toThrow('지원되지 않는 모드');
    });
  });

  describe('성능 테스트', () => {
    it('긴 문자열 처리', () => {
      const longString = '1234567890'.repeat(100); // 1000자
      const result = encodeData(longString, 'numeric', 40, 23856);

      expect(result.characterCount.length).toBe(14); // 버전 40은 14비트
      expect(result.totalBits).toBeGreaterThan(0);
    });
  });
});
