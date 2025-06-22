import { describe, it, expect } from 'vitest';
import { sauvolaBinarization, runBinarization } from './binarization';
import { createBinaryTestImage } from '../test-fixtures';
import type { GrayscaleResult } from '../../types';

describe('이진화 알고리즘', () => {
  describe('sauvolaBinarization', () => {
    it('균일한 이미지는 모두 같은 값으로 이진화되어야 함', () => {
      const size = 20;
      const grayscale = new Uint8Array(size * size).fill(128);
      
      const result = sauvolaBinarization(grayscale, size, size);
      
      // 균일한 이미지는 표준편차가 0이므로 모든 픽셀이 같은 값
      const uniqueValues = new Set(result.binary);
      expect(uniqueValues.size).toBe(1);
    });

    it('체커보드 패턴을 올바르게 이진화해야 함', () => {
      const size = 10;
      const grayscale = createBinaryTestImage(size, size, 'checkerboard');
      
      const result = sauvolaBinarization(grayscale, size, size, 5, 0.2);
      
      // 체커보드 패턴이 어느 정도 유지되어야 함
      let correctCount = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = y * size + x;
          const expectedValue = ((x + y) % 2 === 0) ? 0 : 255;
          if (result.binary[idx] === expectedValue) {
            correctCount++;
          }
        }
      }
      
      // 대부분의 픽셀이 올바르게 이진화되어야 함
      expect(correctCount / (size * size)).toBeGreaterThan(0.8);
    });

    it('윈도우 크기가 이미지보다 큰 경우도 처리해야 함', () => {
      const size = 5;
      const grayscale = new Uint8Array(size * size).fill(128);
      
      const result = sauvolaBinarization(grayscale, size, size, 11, 0.2);
      
      expect(result.binary.length).toBe(size * size);
      expect(result.width).toBe(size);
      expect(result.height).toBe(size);
    });

    it('그라데이션 이미지를 적절히 이진화해야 함', () => {
      const size = 20;
      const grayscale = createBinaryTestImage(size, size, 'gradient');
      
      const result = sauvolaBinarization(grayscale, size, size, 5, 0.2);
      
      // 왼쪽은 어둡게(0), 오른쪽은 밝게(255) 이진화되어야 함
      let leftDarkCount = 0;
      let rightBrightCount = 0;
      
      for (let y = 0; y < size; y++) {
        // 왼쪽 절반
        if (result.binary[y * size] === 0) leftDarkCount++;
        // 오른쪽 절반
        if (result.binary[y * size + size - 1] === 255) rightBrightCount++;
      }
      
      expect(leftDarkCount).toBeGreaterThan(size * 0.8);
      expect(rightBrightCount).toBeGreaterThan(size * 0.8);
    });

    it('다양한 k 값에 따라 결과가 달라야 함', () => {
      const size = 20;
      const grayscale = createBinaryTestImage(size, size, 'gradient');
      
      const lowK = sauvolaBinarization(grayscale, size, size, 7, 0.1);
      const highK = sauvolaBinarization(grayscale, size, size, 7, 0.5);
      
      // 두 결과가 달라야 함
      let differences = 0;
      for (let i = 0; i < lowK.binary.length; i++) {
        if (lowK.binary[i] !== highK.binary[i]) {
          differences++;
        }
      }
      
      expect(differences).toBeGreaterThan(0);
    });
  });

  describe('runBinarization', () => {
    it('GrayscaleResult를 받아 BinarizationResult를 생성해야 함', () => {
      const grayscaleResult: GrayscaleResult = {
        grayscale: new Uint8Array(100).fill(128),
        width: 10,
        height: 10,
        statistics: {
          min: 128,
          max: 128,
          mean: 128,
          histogram: new Array(256).fill(0)
        }
      };
      
      const result = runBinarization(grayscaleResult);
      
      expect(result).toBeDefined();
      expect(result.binary.length).toBe(100);
      expect(result.width).toBe(10);
      expect(result.height).toBe(10);
      expect(result.parameters.windowSize).toBe(31);
      expect(result.parameters.k).toBe(0.2);
    });

    it('실제 QR 패턴을 이진화할 수 있어야 함', () => {
      // 간단한 QR 패턴 생성 (finder pattern 포함)
      const size = 21;
      const grayscale = new Uint8Array(size * size).fill(255); // 흰색 배경
      
      // Top-left finder pattern (7x7)
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          if (
            (y === 0 || y === 6) || // 위아래 테두리
            (x === 0 || x === 6) || // 좌우 테두리
            (y >= 2 && y <= 4 && x >= 2 && x <= 4) // 중앙 3x3
          ) {
            grayscale[y * size + x] = 0; // 검은색
          }
        }
      }
      
      const grayscaleResult: GrayscaleResult = {
        grayscale,
        width: size,
        height: size,
        statistics: {
          min: 0,
          max: 255,
          mean: 200,
          histogram: []
        }
      };
      
      const result = runBinarization(grayscaleResult);
      
      // Finder pattern의 검은 부분이 올바르게 이진화되었는지 확인
      expect(result.binary[0]).toBe(0); // (0,0) - finder pattern 모서리
      expect(result.binary[3 * size + 3]).toBe(0); // (3,3) - finder pattern 중앙
      expect(result.binary[10 * size + 10]).toBe(255); // (10,10) - 빈 공간
    });
  });
});