import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';
import { addFinderPatternsStep } from './step2-finderPatterns';
import { addSeparatorsStep } from './step3-separators';

describe('Step 5-3: Separators', () => {
  it('should add separators around finder patterns for version 1', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const result = addSeparatorsStep(finderStep, 1);
    
    expect(result.stepName).toBe('5-3: Separators');
    expect(result.description).toBe('파인더 패턴 주변 분리자 배치');
    expect(result.addedModules).toBe(45); // 실제 계산: 각 파인더마다 15개씩 3개 = 45개
    
    // 좌상단 파인더 주변 분리자 확인
    // 파인더 패턴 바로 오른쪽 (0,7)
    expect(result.matrix[0][7]).toBe(0);
    expect(result.moduleTypes[0][7]).toBe('separator');
    
    // 파인더 패턴 바로 아래 (7,0)
    expect(result.matrix[7][0]).toBe(0);
    expect(result.moduleTypes[7][0]).toBe('separator');
    
    // 파인더 패턴 대각선 (7,7)
    expect(result.matrix[7][7]).toBe(0);
    expect(result.moduleTypes[7][7]).toBe('separator');
    
    // 우상단 파인더 주변 분리자 확인 (버전1: 0,14에서 시작)
    // 파인더 패턴 바로 왼쪽 (0,13)
    expect(result.matrix[0][13]).toBe(0);
    expect(result.moduleTypes[0][13]).toBe('separator');
    
    // 좌하단 파인더 주변 분리자 확인 (버전1: 14,0에서 시작)
    // 파인더 패턴 바로 위 (13,0)
    expect(result.matrix[13][0]).toBe(0);
    expect(result.moduleTypes[13][0]).toBe('separator');
  });

  it('should not overwrite finder pattern modules', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const result = addSeparatorsStep(finderStep, 1);
    
    // 파인더 패턴 영역은 그대로 유지되어야 함
    expect(result.matrix[0][0]).toBe(1); // 파인더 패턴
    expect(result.matrix[3][3]).toBe(1); // 파인더 패턴 중앙
    expect(result.matrix[6][6]).toBe(1); // 파인더 패턴
    
    expect(result.moduleTypes[0][0]).toBe('finder');
    expect(result.moduleTypes[3][3]).toBe('finder');
    expect(result.moduleTypes[6][6]).toBe('finder');
  });

  it('should handle edge cases at matrix boundaries', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const result = addSeparatorsStep(finderStep, 1);
    
    // 매트릭스 경계에서 분리자가 올바르게 배치되는지 확인
    // 우상단 파인더의 오른쪽 경계는 매트릭스 끝이므로 분리자가 없어야 함
    // 좌하단 파인더의 아래쪽 경계도 마찬가지
    
    // 이미 올바르게 처리되고 있는지 확인 (범위 밖은 배치되지 않음)
    expect(result.matrix).toHaveLength(21);
    expect(result.matrix[0]).toHaveLength(21);
  });

  it('should work for different QR versions', () => {
    const versions = [2, 5, 7] as const;
    
    for (const version of versions) {
      const emptyStep = createEmptyMatrixStep(version);
      const finderStep = addFinderPatternsStep(emptyStep, version);
      const result = addSeparatorsStep(finderStep, version);
      
      expect(result.stepName).toBe('5-3: Separators');
      expect(result.addedModules).toBeGreaterThan(0);
      
      // 분리자는 모두 흰색이어야 함
      const separatorModules = result.matrix.flat().filter((_, idx) => {
        const row = Math.floor(idx / result.matrix.length);
        const col = idx % result.matrix.length;
        return result.moduleTypes[row][col] === 'separator';
      });
      
      expect(separatorModules.every(module => module === 0)).toBe(true);
    }
  });

  it('should preserve original matrix state', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const originalMatrix = finderStep.matrix.map(row => [...row]);
    
    addSeparatorsStep(finderStep, 1);
    
    // 원본 매트릭스는 변경되지 않아야 함
    expect(finderStep.matrix).toEqual(originalMatrix);
  });
});