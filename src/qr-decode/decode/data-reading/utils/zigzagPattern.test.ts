import { describe, expect, it } from 'vitest';
import { generateZigzagPattern, createReadingOrderMatrix, createByteBlockMatrix } from './zigzagPattern';

describe('zigzagPattern', () => {
  describe('generateZigzagPattern', () => {
    it('버전 1 (21×21)에서 올바른 지그재그 패턴을 생성해야 함', () => {
      const size = 21;
      // 간단한 데이터 모듈 매트릭스 생성 (모든 모듈을 데이터로 가정)
      const dataModules = Array.from({ length: size }, () => Array(size).fill(true));
      
      const positions = generateZigzagPattern(size, dataModules);
      
      // 첫 번째 위치는 오른쪽 하단 (20, 20)이어야 함
      expect(positions[0]).toEqual({
        row: 20,
        col: 20,
        bitIndex: 0,
        byteIndex: 0,
        bitInByte: 0
      });
      
      // 두 번째 위치는 (20, 19)이어야 함
      expect(positions[1]).toEqual({
        row: 20,
        col: 19,
        bitIndex: 1,
        byteIndex: 0,
        bitInByte: 1
      });
      
      // 8번째 위치는 다음 바이트의 시작이어야 함
      expect(positions[8]).toEqual({
        row: 16,
        col: 20,
        bitIndex: 8,
        byteIndex: 1,
        bitInByte: 0
      });
    });
    
    it('타이밍 패턴 열을 건너뛰어야 함', () => {
      const size = 21;
      const dataModules = Array.from({ length: size }, () => Array(size).fill(true));
      
      const positions = generateZigzagPattern(size, dataModules);
      
      // 6열은 타이밍 패턴이므로 건너뛰어야 함
      const col6Positions = positions.filter(pos => pos.col === 6);
      expect(col6Positions.length).toBe(0);
    });
    
    it('기능 패턴 영역을 제외해야 함', () => {
      const size = 21;
      const dataModules = Array.from({ length: size }, () => Array(size).fill(false));
      
      // 실제 데이터 영역만 true로 설정 (간단한 예시)
      for (let row = 9; row <= 12; row++) {
        for (let col = 9; col <= 12; col++) {
          dataModules[row][col] = true;
        }
      }
      
      const positions = generateZigzagPattern(size, dataModules);
      
      // 데이터 모듈로 표시된 영역만 포함되어야 함
      expect(positions.every(pos => dataModules[pos.row][pos.col])).toBe(true);
      
      // 데이터 모듈 수만큼 위치가 생성되어야 함
      const dataModuleCount = dataModules.flat().filter(Boolean).length;
      expect(positions.length).toBe(dataModuleCount);
    });
    
    it('올바른 방향 전환을 해야 함', () => {
      const size = 21;
      const dataModules = Array.from({ length: size }, () => Array(size).fill(true));
      
      const positions = generateZigzagPattern(size, dataModules);
      
      // 첫 번째 열 쌍 (20, 19)는 아래에서 위로
      const firstPairPositions = positions.filter(pos => pos.col >= 19);
      const firstPairRows = firstPairPositions.map(pos => pos.row);
      
      // 행이 감소하는 순서여야 함
      for (let i = 1; i < firstPairRows.length; i++) {
        if (firstPairPositions[i].col === firstPairPositions[i-1].col) {
          expect(firstPairRows[i]).toBeLessThan(firstPairRows[i-1]);
        }
      }
      
      // 두 번째 열 쌍 (18, 17)은 위에서 아래로
      const secondPairPositions = positions.filter(pos => pos.col >= 17 && pos.col <= 18);
      const secondPairStartIndex = positions.findIndex(pos => pos.col === 18);
      
      if (secondPairStartIndex > 0 && secondPairPositions.length > 1) {
        // 첫 번째 행이 0이어야 함
        expect(secondPairPositions[0].row).toBe(0);
      }
    });
  });
  
  describe('createReadingOrderMatrix', () => {
    it('읽기 순서를 올바르게 매핑해야 함', () => {
      const size = 5;
      const positions = [
        { row: 0, col: 0, bitIndex: 0, byteIndex: 0, bitInByte: 0 },
        { row: 1, col: 1, bitIndex: 1, byteIndex: 0, bitInByte: 1 },
        { row: 2, col: 2, bitIndex: 2, byteIndex: 0, bitInByte: 2 }
      ];
      
      const matrix = createReadingOrderMatrix(size, positions);
      
      // 지정된 위치에 올바른 순서 번호가 있어야 함
      expect(matrix[0][0]).toBe(0);
      expect(matrix[1][1]).toBe(1);
      expect(matrix[2][2]).toBe(2);
      
      // 나머지 위치는 -1이어야 함
      expect(matrix[0][1]).toBe(-1);
      expect(matrix[3][3]).toBe(-1);
    });
  });
  
  describe('createByteBlockMatrix', () => {
    it('바이트 블록 번호를 올바르게 매핑해야 함', () => {
      const size = 5;
      const positions = [
        { row: 0, col: 0, bitIndex: 0, byteIndex: 0, bitInByte: 0 },
        { row: 0, col: 1, bitIndex: 8, byteIndex: 1, bitInByte: 0 },
        { row: 1, col: 0, bitIndex: 16, byteIndex: 2, bitInByte: 0 }
      ];
      
      const matrix = createByteBlockMatrix(size, positions);
      
      // 지정된 위치에 올바른 바이트 번호가 있어야 함
      expect(matrix[0][0]).toBe(0);
      expect(matrix[0][1]).toBe(1);
      expect(matrix[1][0]).toBe(2);
      
      // 나머지 위치는 -1이어야 함
      expect(matrix[1][1]).toBe(-1);
      expect(matrix[2][2]).toBe(-1);
    });
  });
});