import { describe, it, expect } from 'vitest';
import { analyzeData, getCharacterCountBits } from './dataAnalysis';
import type { QRVersion } from '../../shared/types';

describe('dataAnalysis', () => {
  describe('모드 선택', () => {
    it('숫자만 포함된 데이터는 숫자 모드 선택', () => {
      const result = analyzeData('123456789');
      expect(result.recommendedMode).toBe('numeric');
    });

    it('영숫자만 포함된 데이터는 영숫자 모드 선택', () => {
      const result = analyzeData('HELLO123');
      expect(result.recommendedMode).toBe('alphanumeric');
    });

    it('영숫자 특수문자 포함 데이터는 영숫자 모드 선택', () => {
      const result = analyzeData('HELLO $%*+-./: 123');
      expect(result.recommendedMode).toBe('alphanumeric');
    });

    it('숫자와 영숫자 혼합은 영숫자 모드 선택', () => {
      const result = analyzeData('ABC123');
      expect(result.recommendedMode).toBe('alphanumeric');
    });

    it('일반 문자가 포함되면 바이트 모드 선택', () => {
      const result = analyzeData('Hello World!');
      expect(result.recommendedMode).toBe('byte');
    });

    it('한글 데이터는 한자 모드 선택', () => {
      // Shift JIS 범위 내 문자로 테스트
      const kanjiChar = String.fromCharCode(0x8140);
      const result = analyzeData(kanjiChar);
      expect(result.recommendedMode).toBe('kanji');
    });

    it('URL은 바이트 모드 선택', () => {
      const result = analyzeData('https://example.com');
      expect(result.recommendedMode).toBe('byte');
    });

    it('한글 문자는 바이트 모드 선택 (Unicode)', () => {
      const result = analyzeData('안녕하세요');
      expect(result.recommendedMode).toBe('byte');
    });
  });

  describe('최소 버전 계산', () => {
    it('짧은 숫자 데이터는 버전 1', () => {
      const result = analyzeData('123', 'M');
      expect(result.minimumVersion).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('긴 숫자 데이터는 높은 버전 필요', () => {
      const longNumeric = '1'.repeat(100);
      const result = analyzeData(longNumeric, 'M');
      expect(result.minimumVersion).toBeGreaterThan(1);
      expect(result.isValid).toBe(true);
    });

    it('매우 긴 데이터는 유효하지 않음', () => {
      const veryLongData = 'A'.repeat(10000);
      const result = analyzeData(veryLongData, 'L');
      expect(result.isValid).toBe(false);
      expect(result.minimumVersion).toBe(40);
    });

    it('에러 정정 레벨이 높을수록 더 높은 버전 필요', () => {
      const data = 'HELLO WORLD 123';
      const resultL = analyzeData(data, 'L');
      const resultH = analyzeData(data, 'H');
      
      expect(resultH.minimumVersion).toBeGreaterThanOrEqual(resultL.minimumVersion);
    });
  });

  describe('문자 카운트', () => {
    it('문자 수를 정확히 계산', () => {
      const result = analyzeData('HELLO');
      expect(result.characterCount).toBe(5);
    });

    it('빈 문자열은 0', () => {
      const result = analyzeData('');
      expect(result.characterCount).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('공백도 문자로 계산', () => {
      const result = analyzeData('A B C');
      expect(result.characterCount).toBe(5);
    });
  });

  describe('에러 정정 레벨별 테스트', () => {
    const testData = 'TEST123';

    it('L 레벨에서 분석', () => {
      const result = analyzeData(testData, 'L');
      expect(result.recommendedMode).toBe('alphanumeric');
      expect(result.isValid).toBe(true);
    });

    it('M 레벨에서 분석', () => {
      const result = analyzeData(testData, 'M');
      expect(result.recommendedMode).toBe('alphanumeric');
      expect(result.isValid).toBe(true);
    });

    it('Q 레벨에서 분석', () => {
      const result = analyzeData(testData, 'Q');
      expect(result.recommendedMode).toBe('alphanumeric');
      expect(result.isValid).toBe(true);
    });

    it('H 레벨에서 분석', () => {
      const result = analyzeData(testData, 'H');
      expect(result.recommendedMode).toBe('alphanumeric');
      expect(result.isValid).toBe(true);
    });
  });

  describe('getCharacterCountBits', () => {
    describe('버전 1-9', () => {
      it('숫자 모드는 10비트', () => {
        expect(getCharacterCountBits('numeric', 5 as QRVersion)).toBe(10);
      });

      it('영숫자 모드는 9비트', () => {
        expect(getCharacterCountBits('alphanumeric', 5 as QRVersion)).toBe(9);
      });

      it('바이트 모드는 8비트', () => {
        expect(getCharacterCountBits('byte', 5 as QRVersion)).toBe(8);
      });

      it('한자 모드는 8비트', () => {
        expect(getCharacterCountBits('kanji', 5 as QRVersion)).toBe(8);
      });
    });

    describe('버전 10-26', () => {
      it('숫자 모드는 12비트', () => {
        expect(getCharacterCountBits('numeric', 15 as QRVersion)).toBe(12);
      });

      it('영숫자 모드는 11비트', () => {
        expect(getCharacterCountBits('alphanumeric', 15 as QRVersion)).toBe(11);
      });

      it('바이트 모드는 16비트', () => {
        expect(getCharacterCountBits('byte', 15 as QRVersion)).toBe(16);
      });

      it('한자 모드는 10비트', () => {
        expect(getCharacterCountBits('kanji', 15 as QRVersion)).toBe(10);
      });
    });

    describe('버전 27-40', () => {
      it('숫자 모드는 14비트', () => {
        expect(getCharacterCountBits('numeric', 35 as QRVersion)).toBe(14);
      });

      it('영숫자 모드는 13비트', () => {
        expect(getCharacterCountBits('alphanumeric', 35 as QRVersion)).toBe(13);
      });

      it('바이트 모드는 16비트', () => {
        expect(getCharacterCountBits('byte', 35 as QRVersion)).toBe(16);
      });

      it('한자 모드는 12비트', () => {
        expect(getCharacterCountBits('kanji', 35 as QRVersion)).toBe(12);
      });
    });
  });

  describe('엣지 케이스', () => {
    it('빈 문자열 처리', () => {
      const result = analyzeData('');
      expect(result.recommendedMode).toBe('byte');
      expect(result.minimumVersion).toBe(1);
      expect(result.characterCount).toBe(0);
      expect(result.isValid).toBe(false);
    });

    it('매우 긴 데이터 처리', () => {
      const longData = 'A'.repeat(5000);
      const result = analyzeData(longData, 'L');
      expect(result.minimumVersion).toBe(40);
      expect(result.isValid).toBe(false);
    });

    it('특수 문자 혼합 데이터', () => {
      const result = analyzeData('ABC123!@#');
      expect(result.recommendedMode).toBe('byte');
    });

    it('공백만 있는 데이터', () => {
      const result = analyzeData('   ');
      expect(result.recommendedMode).toBe('alphanumeric'); // 공백은 영숫자 모드에 포함
      expect(result.characterCount).toBe(3);
    });
  });

  describe('실제 사용 예시', () => {
    it('전화번호 형식', () => {
      const result = analyzeData('01012345678');
      expect(result.recommendedMode).toBe('numeric');
      expect(result.isValid).toBe(true);
    });

    it('이메일 주소', () => {
      const result = analyzeData('test@example.com');
      expect(result.recommendedMode).toBe('byte');
      expect(result.isValid).toBe(true);
    });

    it('Wi-Fi 패스워드', () => {
      const result = analyzeData('WIFI:T:WPA;S:MyNetwork;P:password123;;');
      expect(result.recommendedMode).toBe('byte');
      expect(result.isValid).toBe(true);
    });

    it('단순 텍스트 메시지', () => {
      const result = analyzeData('HELLO WORLD');
      expect(result.recommendedMode).toBe('alphanumeric');
      expect(result.isValid).toBe(true);
    });
  });
});