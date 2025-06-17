import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';
import { addFinderPatternsStep } from './step2-finderPatterns';

describe('Step 5-2: Finder Patterns', () => {
  it('should add finder patterns to version 1 matrix', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const result = addFinderPatternsStep(emptyStep, 1);
    
    expect(result.stepName).toBe('5-2: Finder Patterns');
    expect(result.description).toBe('3개 파인더 패턴 (7×7) 배치');
    expect(result.addedModules).toBe(147); // 3 * 7 * 7 = 147
    
    // 좌상단 파인더 패턴 확인 (0,0)
    expect(result.matrix[0][0]).toBe(1);
    expect(result.matrix[0][6]).toBe(1);
    expect(result.matrix[6][0]).toBe(1);
    expect(result.matrix[6][6]).toBe(1);
    expect(result.matrix[3][3]).toBe(1); // 중앙
    
    // 우상단 파인더 패턴 확인 (0,14)
    expect(result.matrix[0][14]).toBe(1);
    expect(result.matrix[0][20]).toBe(1);
    expect(result.matrix[6][14]).toBe(1);
    expect(result.matrix[6][20]).toBe(1);
    
    // 좌하단 파인더 패턴 확인 (14,0)
    expect(result.matrix[14][0]).toBe(1);
    expect(result.matrix[14][6]).toBe(1);
    expect(result.matrix[20][0]).toBe(1);
    expect(result.matrix[20][6]).toBe(1);
    
    // 모듈 타입 확인
    expect(result.moduleTypes[0][0]).toBe('finder');
    expect(result.moduleTypes[3][3]).toBe('finder');
    expect(result.moduleTypes[0][17]).toBe('finder');
    expect(result.moduleTypes[17][3]).toBe('finder');
  });

  it('should add finder patterns to version 5 matrix', () => {
    const emptyStep = createEmptyMatrixStep(5);
    const result = addFinderPatternsStep(emptyStep, 5);
    
    expect(result.addedModules).toBe(147); // 동일하게 3 * 7 * 7
    
    // 버전 5는 37×37 매트릭스
    // 우상단 파인더 패턴 확인 (0,30)
    expect(result.matrix[0][30]).toBe(1);
    expect(result.matrix[0][36]).toBe(1);
    expect(result.matrix[6][30]).toBe(1);
    expect(result.matrix[6][36]).toBe(1);
    
    // 좌하단 파인더 패턴 확인 (30,0)
    expect(result.matrix[30][0]).toBe(1);
    expect(result.matrix[30][6]).toBe(1);
    expect(result.matrix[36][0]).toBe(1);
    expect(result.matrix[36][6]).toBe(1);
  });

  it('should preserve original matrix state', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const originalMatrix = emptyStep.matrix.map(row => [...row]);
    
    addFinderPatternsStep(emptyStep, 1);
    
    // 원본 매트릭스는 변경되지 않아야 함
    expect(emptyStep.matrix).toEqual(originalMatrix);
  });

  it('should place finder patterns at correct positions for different versions', () => {
    const versions = [1, 3, 7, 10] as const;
    
    for (const version of versions) {
      const emptyStep = createEmptyMatrixStep(version);
      const result = addFinderPatternsStep(emptyStep, version);
      const size = 21 + (version - 1) * 4;
      
      // 파인더 패턴이 올바른 위치에 있는지 확인
      // 좌상단 (0,0)
      expect(result.matrix[0][0]).toBe(1);
      // 우상단 (0, size-7)
      expect(result.matrix[0][size - 7]).toBe(1);
      // 좌하단 (size-7, 0)
      expect(result.matrix[size - 7][0]).toBe(1);
      
      expect(result.addedModules).toBe(147);
    }
  });
});