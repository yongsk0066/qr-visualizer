import { describe, it, expect } from 'vitest';
import { removeMask } from './maskRemover';
import type { TriStateQR } from '../../types';
import type { MaskPattern } from '../format-extraction/types';

describe('maskRemover', () => {
  describe('removeMask', () => {
    it('should remove mask pattern 0 correctly', () => {
      // 21x21 버전 1 QR 코드 (간단한 예제)
      const size = 21;
      const matrix: (-1 | 0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(1)
      );
      
      // 일부 데이터 모듈을 검은색으로 설정
      matrix[10][10] = 0;
      matrix[10][11] = 0;
      matrix[11][10] = 0;
      matrix[11][11] = 0;
      
      const triStateQR: TriStateQR = {
        size,
        matrix,
        finder: [
          { x: 3, y: 3 },
          { x: 3, y: 17 },
          { x: 17, y: 3 }
        ],
        statistics: {
          black: 4,
          white: size * size - 4,
          unknown: 0
        }
      };
      
      const result = removeMask(triStateQR, 0, 'L', 1);
      
      expect(result).toBeDefined();
      expect(result.unmaskedMatrix).toHaveLength(size);
      expect(result.maskPattern).toBe(0);
      expect(result.dataModuleCount).toBeGreaterThan(0);
      expect(result.unknownModuleCount).toBe(0);
      expect(result.confidence).toBe(1);
    });
    
    it('should handle unknown modules correctly', () => {
      const size = 21;
      const matrix: (-1 | 0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(1)
      );
      
      // 일부 모듈을 unknown으로 설정
      matrix[10][10] = -1;
      matrix[10][11] = -1;
      matrix[11][10] = -1;
      matrix[11][11] = -1;
      
      const triStateQR: TriStateQR = {
        size,
        matrix,
        finder: [
          { x: 3, y: 3 },
          { x: 3, y: 17 },
          { x: 17, y: 3 }
        ],
        statistics: {
          black: 0,
          white: size * size - 4,
          unknown: 4
        }
      };
      
      const result = removeMask(triStateQR, 0, 'L', 1);
      
      expect(result.unknownModuleCount).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1);
      
      // Unknown 모듈은 0으로 처리되어야 함
      expect(result.unmaskedMatrix[10][10]).toBe(0);
      expect(result.unmaskedMatrix[10][11]).toBe(0);
    });
    
    it('should preserve function patterns', () => {
      const size = 21;
      const matrix: (-1 | 0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(1)
      );
      
      // 파인더 패턴 설정 (간단한 예제)
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          matrix[r][c] = 0;
        }
      }
      
      const triStateQR: TriStateQR = {
        size,
        matrix,
        finder: [
          { x: 3, y: 3 },
          { x: 3, y: 17 },
          { x: 17, y: 3 }
        ],
        statistics: {
          black: 49,
          white: size * size - 49,
          unknown: 0
        }
      };
      
      const result = removeMask(triStateQR, 0, 'L', 1);
      
      // 파인더 패턴 영역은 마스크가 적용되지 않아야 함
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          expect(result.unmaskedMatrix[r][c]).toBe(0);
          expect(result.maskedModules[r][c]).toBe(false);
        }
      }
    });
    
    it('should apply different mask patterns correctly', () => {
      const size = 21;
      const matrix: (-1 | 0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(1)
      );
      
      const triStateQR: TriStateQR = {
        size,
        matrix,
        finder: [
          { x: 3, y: 3 },
          { x: 3, y: 17 },
          { x: 17, y: 3 }
        ],
        statistics: {
          black: 0,
          white: size * size,
          unknown: 0
        }
      };
      
      // 모든 마스크 패턴 테스트
      for (let pattern = 0; pattern < 8; pattern++) {
        const result = removeMask(triStateQR, pattern as MaskPattern, 'L', 1);
        
        expect(result.maskPattern).toBe(pattern);
        expect(result.unmaskedMatrix).toBeDefined();
        expect(result.maskedModules).toBeDefined();
        
        // 각 패턴에 따라 다른 결과가 나와야 함
        let maskedCount = 0;
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (result.maskedModules[r][c]) {
              maskedCount++;
            }
          }
        }
        
        // 각 패턴마다 마스크되는 모듈 수가 다름
        expect(maskedCount).toBeGreaterThan(0);
      }
    });
    
    it('should handle version 7+ with version info correctly', () => {
      const size = 45; // 버전 7
      const matrix: (-1 | 0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(1)
      );
      
      const triStateQR: TriStateQR = {
        size,
        matrix,
        finder: [
          { x: 3, y: 3 },
          { x: 3, y: 41 },
          { x: 41, y: 3 }
        ],
        statistics: {
          black: 0,
          white: size * size,
          unknown: 0
        }
      };
      
      const result = removeMask(triStateQR, 0, 'L', 7);
      
      // 버전 정보 영역은 마스크가 적용되지 않아야 함
      // 왼쪽 하단: 가로 6 × 세로 3
      for (let r = size - 11; r < size - 11 + 3; r++) {
        for (let c = 0; c < 6; c++) {
          expect(result.dataModules[r][c]).toBe(false);
        }
      }
      
      // 오른쪽 상단: 가로 3 × 세로 6
      for (let r = 0; r < 6; r++) {
        for (let c = size - 11; c < size - 11 + 3; c++) {
          expect(result.dataModules[r][c]).toBe(false);
        }
      }
    });
    
    it('should correctly identify data modules', () => {
      const size = 21;
      const matrix: (-1 | 0 | 1)[][] = Array.from(
        { length: size }, 
        () => Array(size).fill(1)
      );
      
      const triStateQR: TriStateQR = {
        size,
        matrix,
        finder: [
          { x: 3, y: 3 },
          { x: 3, y: 17 },
          { x: 17, y: 3 }
        ],
        statistics: {
          black: 0,
          white: size * size,
          unknown: 0
        }
      };
      
      const result = removeMask(triStateQR, 0, 'L', 1);
      
      // 데이터 모듈 수 확인
      let dataModuleCount = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (result.dataModules[r][c]) {
            dataModuleCount++;
          }
        }
      }
      
      expect(result.dataModuleCount).toBe(dataModuleCount);
      
      // 버전 1의 경우 예상되는 데이터 모듈 수
      // 전체 441 - 파인더/분리자(192) - 포맷(31) - 타이밍(10) - 다크(1) = 208
      expect(result.dataModuleCount).toBe(208);
    });
  });
});