import { describe, it, expect } from 'vitest';
import {
  calculateLineIntersection,
  distance,
  calculateCenter,
  scaleFromCenter,
} from './geometry';

describe('기하학 유틸리티', () => {
  describe('calculateLineIntersection', () => {
    it('수직선과 수평선의 교점을 찾아야 함', () => {
      const line1 = { p1: { x: 0, y: 5 }, p2: { x: 10, y: 5 } }; // 수평선
      const line2 = { p1: { x: 5, y: 0 }, p2: { x: 5, y: 10 } }; // 수직선
      
      const intersection = calculateLineIntersection(line1, line2);
      
      expect(intersection).toEqual({ x: 5, y: 5 });
    });

    it('대각선들의 교점을 찾아야 함', () => {
      const line1 = { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } }; // y = x
      const line2 = { p1: { x: 0, y: 10 }, p2: { x: 10, y: 0 } }; // y = -x + 10
      
      const intersection = calculateLineIntersection(line1, line2);
      
      expect(intersection).toEqual({ x: 5, y: 5 });
    });

    it('평행선은 null을 반환해야 함', () => {
      const line1 = { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } };
      const line2 = { p1: { x: 0, y: 5 }, p2: { x: 10, y: 5 } };
      
      const intersection = calculateLineIntersection(line1, line2);
      
      expect(intersection).toBeNull();
    });

    it('동일한 선은 null을 반환해야 함', () => {
      const line1 = { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } };
      const line2 = { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } };
      
      const intersection = calculateLineIntersection(line1, line2);
      
      expect(intersection).toBeNull();
    });
  });

  describe('distance', () => {
    it('두 점 사이의 거리를 계산해야 함', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      
      expect(distance(p1, p2)).toBe(5); // 3-4-5 직각삼각형
    });

    it('같은 점의 거리는 0이어야 함', () => {
      const p1 = { x: 5, y: 5 };
      const p2 = { x: 5, y: 5 };
      
      expect(distance(p1, p2)).toBe(0);
    });

    it('수평선상의 거리를 계산해야 함', () => {
      const p1 = { x: 0, y: 5 };
      const p2 = { x: 10, y: 5 };
      
      expect(distance(p1, p2)).toBe(10);
    });
  });

  describe('calculateCenter', () => {
    it('점들의 중심을 계산해야 함', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      
      const center = calculateCenter(points);
      
      expect(center).toEqual({ x: 5, y: 5 });
    });

    it('한 점의 중심은 그 점이어야 함', () => {
      const points = [{ x: 3, y: 4 }];
      
      const center = calculateCenter(points);
      
      expect(center).toEqual({ x: 3, y: 4 });
    });

    it('불규칙한 점들의 중심을 계산해야 함', () => {
      const points = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 }
      ];
      
      const center = calculateCenter(points);
      
      expect(center).toEqual({ x: 3, y: 4 });
    });
  });

  describe('scaleFromCenter', () => {
    it('중심점 기준으로 확대해야 함', () => {
      const points = [
        { x: 4, y: 4 },
        { x: 6, y: 4 },
        { x: 6, y: 6 },
        { x: 4, y: 6 }
      ];
      const center = { x: 5, y: 5 };
      
      const scaled = scaleFromCenter(points, center, 2);
      
      expect(scaled).toEqual([
        { x: 3, y: 3 },
        { x: 7, y: 3 },
        { x: 7, y: 7 },
        { x: 3, y: 7 }
      ]);
    });

    it('중심점 기준으로 축소해야 함', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      const center = { x: 5, y: 5 };
      
      const scaled = scaleFromCenter(points, center, 0.5);
      
      expect(scaled).toEqual([
        { x: 2.5, y: 2.5 },
        { x: 7.5, y: 2.5 },
        { x: 7.5, y: 7.5 },
        { x: 2.5, y: 7.5 }
      ]);
    });

    it('scale이 1이면 변화가 없어야 함', () => {
      const points = [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ];
      const center = { x: 2, y: 3 };
      
      const scaled = scaleFromCenter(points, center, 1);
      
      expect(scaled).toEqual(points);
    });
  });
});