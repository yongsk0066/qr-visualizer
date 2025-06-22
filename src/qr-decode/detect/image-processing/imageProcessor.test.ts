import { describe, it, expect } from 'vitest';
import { convertToGrayscale, createGrayscaleResult } from './imageProcessor';
import type { ImageProcessingResult } from '../../types';

describe('이미지 처리', () => {
  describe('convertToGrayscale', () => {
    it('RGB 값을 ITU-R BT.709 luma 계수로 올바르게 변환해야 함', () => {
      // 4x1 픽셀 테스트 이미지 데이터
      const imageData = {
        data: new Uint8ClampedArray([
          255, 0, 0, 255,    // 빨강
          0, 255, 0, 255,    // 초록
          0, 0, 255, 255,    // 파랑
          255, 255, 255, 255 // 흰색
        ]),
        width: 4,
        height: 1
      } as ImageData;

      const result = convertToGrayscale(imageData);
      
      // ITU-R BT.709: R*0.2126 + G*0.7152 + B*0.0722
      expect(result[0]).toBe(54);  // 255 * 0.2126 ≈ 54
      expect(result[1]).toBe(182); // 255 * 0.7152 ≈ 182
      expect(result[2]).toBe(18);  // 255 * 0.0722 ≈ 18
      expect(result[3]).toBe(255); // 255 * 1 = 255
    });

    it('검은색과 회색 값을 올바르게 처리해야 함', () => {
      const imageData = {
        data: new Uint8ClampedArray([
          0, 0, 0, 255,       // 검은색
          128, 128, 128, 255, // 중간 회색
          64, 128, 192, 255   // 혼합 색상
        ]),
        width: 3,
        height: 1
      } as ImageData;

      const result = convertToGrayscale(imageData);
      
      expect(result[0]).toBe(0);   // 검은색
      expect(result[1]).toBe(128); // 회색
      expect(result[2]).toBe(119); // 64*0.2126 + 128*0.7152 + 192*0.0722 ≈ 119
    });

    it('큰 이미지도 올바르게 처리해야 함', () => {
      const size = 100 * 100;
      const data = new Uint8ClampedArray(size * 4);
      
      // 체커보드 패턴 생성
      for (let i = 0; i < size; i++) {
        const isWhite = i % 2 === 0;
        data[i * 4] = isWhite ? 255 : 0;
        data[i * 4 + 1] = isWhite ? 255 : 0;
        data[i * 4 + 2] = isWhite ? 255 : 0;
        data[i * 4 + 3] = 255;
      }

      const imageData = { data, width: 100, height: 100 } as ImageData;
      const result = convertToGrayscale(imageData);
      
      expect(result.length).toBe(size);
      expect(result[0]).toBe(255); // 첫 픽셀 (흰색)
      expect(result[1]).toBe(0);   // 두번째 픽셀 (검은색)
    });
  });

  describe('createGrayscaleResult', () => {
    it('그레이스케일 결과와 통계를 생성해야 함', () => {
      const mockData: ImageProcessingResult = {
        original: {} as ImageData,
        grayscale: new Uint8Array([0, 64, 128, 192, 255]),
        width: 5,
        height: 1
      };

      const result = createGrayscaleResult(mockData);
      
      expect(result.grayscale).toBe(mockData.grayscale);
      expect(result.width).toBe(5);
      expect(result.height).toBe(1);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.min).toBe(0);
      expect(result.statistics.max).toBe(255);
      expect(result.statistics.mean).toBe(127.8);
    });
  });
});