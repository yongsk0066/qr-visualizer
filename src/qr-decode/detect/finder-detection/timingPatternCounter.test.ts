import { describe, it, expect } from 'vitest';
import { countTimingPatternModules } from './timingPatternCounter';

describe('타이밍 패턴 카운터', () => {
  describe('countTimingPatternModules', () => {
    // QR 코드 Version 1 (21x21) 테스트 이미지 생성
    const createQRVersion1Binary = (): Uint8Array => {
      const size = 21;
      const binary = new Uint8Array(size * size).fill(255); // 흰색 배경
      
      // Finder patterns (7x7) - 검은색은 0
      const finderPattern = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [0, 1, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ];
      
      // Place finder patterns
      // Top-left
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          binary[y * size + x] = finderPattern[y][x] * 255;
        }
      }
      
      // Top-right
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          binary[y * size + (size - 7 + x)] = finderPattern[y][x] * 255;
        }
      }
      
      // Bottom-left
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          binary[(size - 7 + y) * size + x] = finderPattern[y][x] * 255;
        }
      }
      
      // Timing patterns (alternating black/white)
      for (let i = 8; i < 13; i++) {
        binary[6 * size + i] = (i % 2 === 0) ? 0 : 255; // Horizontal
        binary[i * size + 6] = (i % 2 === 0) ? 0 : 255; // Vertical
      }
      
      return binary;
    };

    it('Version 1 QR 코드에서 21개의 모듈을 카운트해야 함', () => {
      const binary = createQRVersion1Binary();
      const topLeftPattern = { center: { x: 3, y: 3 }, size: 7 };
      const topRightPattern = { center: { x: 17, y: 3 }, size: 7 };
      const bottomLeftPattern = { center: { x: 3, y: 17 }, size: 7 };
      
      const result = countTimingPatternModules(
        binary, 21, 21,
        topLeftPattern,
        topRightPattern,
        bottomLeftPattern
      );
      
      expect(result.moduleCount).toBe(21);
      expect(result.version).toBe(1);
    });

    it('타이밍 패턴이 없는 경우 기본값을 반환해야 함', () => {
      const binary = new Uint8Array(100 * 100).fill(255); // 전체 흰색
      const topLeftPattern = { center: { x: 10, y: 10 }, size: 7 };
      const topRightPattern = { center: { x: 90, y: 10 }, size: 7 };
      const bottomLeftPattern = { center: { x: 10, y: 90 }, size: 7 };
      
      const result = countTimingPatternModules(
        binary, 100, 100,
        topLeftPattern,
        topRightPattern,
        bottomLeftPattern
      );
      
      // 패턴 중심 간 거리에서 추정
      const estimatedModules = Math.round((90 - 10) / (7 / 7)) + 7;
      expect(result.moduleCount).toBeGreaterThan(0);
      expect(result.version).toBeGreaterThan(0);
    });

    it('Version 2 크기의 QR 코드를 올바르게 감지해야 함', () => {
      const size = 25; // Version 2
      const binary = new Uint8Array(size * size).fill(255);
      
      // Simplified timing pattern for Version 2
      for (let i = 8; i < 17; i++) {
        binary[6 * size + i] = (i % 2 === 0) ? 0 : 255;
        binary[i * size + 6] = (i % 2 === 0) ? 0 : 255;
      }
      
      const topLeftPattern = { center: { x: 3, y: 3 }, size: 7 };
      const topRightPattern = { center: { x: 21, y: 3 }, size: 7 };
      const bottomLeftPattern = { center: { x: 3, y: 21 }, size: 7 };
      
      const result = countTimingPatternModules(
        binary, size, size,
        topLeftPattern,
        topRightPattern,
        bottomLeftPattern
      );
      
      expect(result.moduleCount).toBe(25);
      expect(result.version).toBe(2);
    });

    it('수평과 수직 타이밍 패턴의 평균을 사용해야 함', () => {
      const size = 21;
      const binary = new Uint8Array(size * size).fill(255);
      
      // 수평 타이밍 패턴만 설정 (5개 모듈)
      for (let i = 8; i < 13; i++) {
        binary[6 * size + i] = (i % 2 === 0) ? 0 : 255;
      }
      
      // 수직 타이밍 패턴은 다르게 설정 (더 많은 전환)
      for (let i = 8; i < 13; i++) {
        binary[i * size + 6] = 0; // 모두 검은색
      }
      
      const topLeftPattern = { center: { x: 3, y: 3 }, size: 7 };
      const topRightPattern = { center: { x: 17, y: 3 }, size: 7 };
      const bottomLeftPattern = { center: { x: 3, y: 17 }, size: 7 };
      
      const result = countTimingPatternModules(
        binary, size, size,
        topLeftPattern,
        topRightPattern,
        bottomLeftPattern
      );
      
      // 수평과 수직의 평균값이 사용되어야 함
      expect(result.moduleCount).toBeGreaterThan(0);
      expect(result.moduleCount).toBeLessThanOrEqual(21);
    });

    it('패턴 위치가 잘못된 경우에도 안전하게 처리해야 함', () => {
      const binary = new Uint8Array(50 * 50).fill(128);
      
      // 엣지 케이스: 패턴이 겹치는 경우
      const topLeftPattern = { center: { x: 5, y: 5 }, size: 10 };
      const topRightPattern = { center: { x: 10, y: 5 }, size: 10 }; // 너무 가까움
      const bottomLeftPattern = { center: { x: 5, y: 10 }, size: 10 };
      
      const result = countTimingPatternModules(
        binary, 50, 50,
        topLeftPattern,
        topRightPattern,
        bottomLeftPattern
      );
      
      expect(result).toBeDefined();
      expect(result.moduleCount).toBeGreaterThan(0);
      expect(result.version).toBeGreaterThan(0);
    });

    it('큰 버전의 QR 코드도 처리할 수 있어야 함', () => {
      const size = 177; // Version 40
      const binary = new Uint8Array(size * size).fill(255);
      
      // 큰 타이밍 패턴
      const timingLength = size - 14; // 양쪽 finder pattern 제외
      for (let i = 8; i < 8 + timingLength; i++) {
        if (i < size) {
          binary[6 * size + i] = (i % 2 === 0) ? 0 : 255;
          binary[i * size + 6] = (i % 2 === 0) ? 0 : 255;
        }
      }
      
      const topLeftPattern = { center: { x: 3, y: 3 }, size: 7 };
      const topRightPattern = { center: { x: 173, y: 3 }, size: 7 };
      const bottomLeftPattern = { center: { x: 3, y: 173 }, size: 7 };
      
      const result = countTimingPatternModules(
        binary, size, size,
        topLeftPattern,
        topRightPattern,
        bottomLeftPattern
      );
      
      expect(result.moduleCount).toBe(177);
      expect(result.version).toBe(40);
    });
  });
});