import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';
import { addFinderPatternsStep } from './step2-finderPatterns';
import { addSeparatorsStep } from './step3-separators';
import { addTimingPatternsStep } from './step4-timingPatterns';

describe('Step 5-4: Timing Patterns', () => {
  it('should add timing patterns for version 1', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const result = addTimingPatternsStep(separatorStep, 1);
    
    expect(result.stepName).toBe('5-4: Timing Patterns');
    expect(result.description).toBe('6행/6열에 교대 타이밍 패턴 배치');
    expect(result.addedModules).toBe(10); // 버전1: 21×21에서 8~12 구간 = 5개씩 2줄 = 10개
    
    // 6행 타이밍 패턴 확인 (가로)
    expect(result.matrix[6][8]).toBe(1);  // 첫 번째: 흑
    expect(result.matrix[6][9]).toBe(0);  // 두 번째: 백
    expect(result.matrix[6][10]).toBe(1); // 세 번째: 흑
    expect(result.matrix[6][11]).toBe(0); // 네 번째: 백
    expect(result.matrix[6][12]).toBe(1); // 다섯 번째: 흑
    
    // 6열 타이밍 패턴 확인 (세로)
    expect(result.matrix[8][6]).toBe(1);  // 첫 번째: 흑
    expect(result.matrix[9][6]).toBe(0);  // 두 번째: 백
    expect(result.matrix[10][6]).toBe(1); // 세 번째: 흑
    expect(result.matrix[11][6]).toBe(0); // 네 번째: 백
    expect(result.matrix[12][6]).toBe(1); // 다섯 번째: 흑
    
    // 모듈 타입 확인
    expect(result.moduleTypes[6][8]).toBe('timing');
    expect(result.moduleTypes[8][6]).toBe('timing');
  });

  it('should handle larger versions with longer timing patterns', () => {
    const emptyStep = createEmptyMatrixStep(5);
    const finderStep = addFinderPatternsStep(emptyStep, 5);
    const separatorStep = addSeparatorsStep(finderStep, 5);
    const result = addTimingPatternsStep(separatorStep, 5);
    
    expect(result.addedModules).toBe(42); // 버전5: 37×37에서 8~28 구간 = 21개씩 2줄 = 42개
    
    // 교대 패턴 확인
    expect(result.matrix[6][8]).toBe(1);   // 시작: 흑
    expect(result.matrix[6][9]).toBe(0);   // 백
    expect(result.matrix[6][28]).toBe(1);  // 끝: 흑 (21개째이므로 홀수번째)
  });

  it('should not overwrite existing patterns', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const result = addTimingPatternsStep(separatorStep, 1);
    
    // 기존 파인더 패턴과 분리자는 그대로 유지
    expect(result.matrix[0][0]).toBe(1); // 파인더 패턴
    expect(result.matrix[7][7]).toBe(0); // 분리자
    expect(result.moduleTypes[0][0]).toBe('finder');
    expect(result.moduleTypes[7][7]).toBe('separator');
  });

  it('should skip occupied positions', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    
    // 분리자가 6행/6열에 배치되어 있다면 타이밍 패턴이 겹치지 않아야 함
    const result = addTimingPatternsStep(separatorStep, 1);
    
    // 6행의 7열 위치는 분리자가 있으므로 타이밍 패턴이 배치되지 않음
    expect(result.moduleTypes[6][7]).toBe('separator');
    
    // 6열의 7행 위치도 마찬가지
    expect(result.moduleTypes[7][6]).toBe('separator');
  });

  it('should create alternating black and white pattern', () => {
    const emptyStep = createEmptyMatrixStep(3);
    const finderStep = addFinderPatternsStep(emptyStep, 3);
    const separatorStep = addSeparatorsStep(finderStep, 3);
    const result = addTimingPatternsStep(separatorStep, 3);
    
    // 6행에서 교대 패턴 확인
    let col = 8;
    while (col < 29 - 8) { // 버전3: 29×29
      if (result.moduleTypes[6][col] === 'timing') {
        const expectedValue = (col - 8) % 2 === 0 ? 1 : 0;
        expect(result.matrix[6][col]).toBe(expectedValue);
      }
      col++;
    }
    
    // 6열에서 교대 패턴 확인
    let row = 8;
    while (row < 29 - 8) {
      if (result.moduleTypes[row][6] === 'timing') {
        const expectedValue = (row - 8) % 2 === 0 ? 1 : 0;
        expect(result.matrix[row][6]).toBe(expectedValue);
      }
      row++;
    }
  });

  it('should preserve original matrix state', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const originalMatrix = separatorStep.matrix.map(row => [...row]);
    
    addTimingPatternsStep(separatorStep, 1);
    
    // 원본 매트릭스는 변경되지 않아야 함
    expect(separatorStep.matrix).toEqual(originalMatrix);
  });
});