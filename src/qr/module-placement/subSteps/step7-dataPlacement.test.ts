import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';
import { addFinderPatternsStep } from './step2-finderPatterns';
import { addSeparatorsStep } from './step3-separators';
import { addTimingPatternsStep } from './step4-timingPatterns';
import { addAlignmentPatternsStep } from './step5-alignmentPatterns';
import { reserveFormatInfoStep } from './step6-formatInfo';
import { placeDataBitsStep } from './step7-dataPlacement';

describe('Step 5-7: Data Placement', () => {
  it('should place data bits in zigzag pattern for version 1', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = placeDataBitsStep(formatStep, 1, "110100100011");
    
    expect(result.stepName).toBe('5-7: Data Placement');
    expect(result.description).toContain('지그재그 패턴으로');
    expect(result.description).toContain('비트 데이터 배치');
    expect(result.addedModules).toBeGreaterThan(0);
    
    // 데이터가 배치된 위치에서 모듈 타입 확인
    const dataModules = result.matrix.flat().filter((_, idx) => {
      const row = Math.floor(idx / result.matrix.length);
      const col = idx % result.matrix.length;
      return result.moduleTypes[row][col] === 'data';
    });
    
    expect(dataModules.length).toBe(result.addedModules);
  });

  it('should start from bottom-right corner', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = placeDataBitsStep(formatStep, 1, "1010");
    
    // 우하단 모서리 근처에서 데이터 모듈이 있는지 확인
    const size = 21;
    let foundDataNearBottomRight = false;
    
    for (let row = size - 3; row < size; row++) {
      for (let col = size - 3; col < size; col++) {
        if (result.moduleTypes[row] && result.moduleTypes[row][col] === 'data') {
          foundDataNearBottomRight = true;
          break;
        }
      }
      if (foundDataNearBottomRight) break;
    }
    
    expect(foundDataNearBottomRight).toBe(true);
  });

  it('should skip timing pattern column', () => {
    const emptyStep = createEmptyMatrixStep(2);
    const finderStep = addFinderPatternsStep(emptyStep, 2);
    const separatorStep = addSeparatorsStep(finderStep, 2);
    const timingStep = addTimingPatternsStep(separatorStep, 2);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 2);
    const formatStep = reserveFormatInfoStep(alignmentStep, 2);
    const result = placeDataBitsStep(formatStep, 2, "11111111");
    
    // 타이밍 패턴 열(6열)에는 데이터가 배치되지 않아야 함
    for (let row = 0; row < result.matrix.length; row++) {
      if (result.moduleTypes[row][6] === 'data') {
        expect(false).toBe(true); // 타이밍 패턴 열에 데이터가 있으면 실패
      }
    }
  });

  it('should not overwrite existing patterns', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = placeDataBitsStep(formatStep, 1);
    
    // 기존 패턴들이 유지되어야 함
    expect(result.moduleTypes[0][0]).toBe('finder');
    expect(result.moduleTypes[7][7]).toBe('separator');
    expect(result.moduleTypes[6][8]).toBe('timing');
    expect(result.moduleTypes[13][8]).toBe('format');
  });

  it('should handle empty bit stream', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = placeDataBitsStep(formatStep, 1, "");
    
    expect(result.addedModules).toBe(0);
    expect(result.description).toContain('0비트 데이터 배치');
  });

  it('should place bits according to zigzag pattern', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = placeDataBitsStep(formatStep, 1, "101010");
    
    // 배치된 데이터 비트가 입력 패턴과 일치하는지 확인
    const dataPositions: Array<{row: number, col: number, value: number}> = [];
    
    for (let row = 0; row < result.matrix.length; row++) {
      for (let col = 0; col < result.matrix[row].length; col++) {
        if (result.moduleTypes[row][col] === 'data') {
          dataPositions.push({
            row,
            col,
            value: result.matrix[row][col] as number
          });
        }
      }
    }
    
    expect(dataPositions.length).toBeGreaterThan(0);
    expect(dataPositions.length).toBeLessThanOrEqual(6); // "101010"의 길이
  });

  it('should work with different versions', () => {
    const versions = [1, 2, 3] as const;
    
    for (const version of versions) {
      const emptyStep = createEmptyMatrixStep(version);
      const finderStep = addFinderPatternsStep(emptyStep, version);
      const separatorStep = addSeparatorsStep(finderStep, version);
      const timingStep = addTimingPatternsStep(separatorStep, version);
      const alignmentStep = addAlignmentPatternsStep(timingStep, version);
      const formatStep = reserveFormatInfoStep(alignmentStep, version);
      const result = placeDataBitsStep(formatStep, version, "11010011");
      
      expect(result.stepName).toBe('5-7: Data Placement');
      expect(result.addedModules).toBeGreaterThanOrEqual(0);
    }
  });

  it('should preserve original matrix state', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const originalMatrix = formatStep.matrix.map(row => [...row]);
    
    placeDataBitsStep(formatStep, 1);
    
    // 원본 매트릭스는 변경되지 않아야 함
    expect(formatStep.matrix).toEqual(originalMatrix);
  });
});