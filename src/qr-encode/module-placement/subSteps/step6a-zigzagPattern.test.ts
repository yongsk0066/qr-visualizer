import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';
import { addFinderPatternsStep } from './step2-finderPatterns';
import { addSeparatorsStep } from './step3-separators';
import { addTimingPatternsStep } from './step4-timingPatterns';
import { addAlignmentPatternsStep } from './step5-alignmentPatterns';
import { reserveFormatInfoStep } from './step6-formatInfo';
import { showZigzagPatternStep } from './step6a-zigzagPattern';

describe('Step 5-6A: Zigzag Pattern', () => {
  it('should show zigzag pattern visualization for version 1', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = showZigzagPatternStep(formatStep, 1);
    
    expect(result.stepName).toBe('5-6A: Zigzag Pattern');
    expect(result.description).toContain('지그재그 패턴');
    expect(result.addedModules).toBeGreaterThan(0);
    
    // 바이트 블록 모듈이 있는지 확인
    const byteModules = result.matrix.flat().filter((_, idx) => {
      const row = Math.floor(idx / result.matrix.length);
      const col = idx % result.matrix.length;
      return result.moduleTypes[row][col].startsWith('byte-');
    });
    
    expect(byteModules.length).toBe(result.addedModules);
  });

  it('should start from bottom-right corner in zigzag pattern', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = showZigzagPatternStep(formatStep, 1);
    
    // 우하단 근처에서 바이트 블록 패턴이 시작되는지 확인
    const size = 21;
    let foundByteBlockNearBottomRight = false;
    
    for (let row = size - 3; row < size; row++) {
      for (let col = size - 3; col < size; col++) {
        if (result.moduleTypes[row] && result.moduleTypes[row][col].startsWith('byte-')) {
          foundByteBlockNearBottomRight = true;
          break;
        }
      }
      if (foundByteBlockNearBottomRight) break;
    }
    
    expect(foundByteBlockNearBottomRight).toBe(true);
  });

  it('should not overwrite existing patterns', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const formatStep = reserveFormatInfoStep(alignmentStep, 1);
    const result = showZigzagPatternStep(formatStep, 1);
    
    // 기존 패턴들이 유지되어야 함
    expect(result.moduleTypes[0][0]).toBe('finder');
    expect(result.moduleTypes[7][7]).toBe('separator');
    expect(result.moduleTypes[6][8]).toBe('timing');
    expect(result.moduleTypes[13][8]).toBe('format');
  });

  it('should skip timing pattern column', () => {
    const emptyStep = createEmptyMatrixStep(2);
    const finderStep = addFinderPatternsStep(emptyStep, 2);
    const separatorStep = addSeparatorsStep(finderStep, 2);
    const timingStep = addTimingPatternsStep(separatorStep, 2);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 2);
    const formatStep = reserveFormatInfoStep(alignmentStep, 2);
    const result = showZigzagPatternStep(formatStep, 2);
    
    // 타이밍 패턴 열(6열)에는 바이트 블록 패턴이 배치되지 않아야 함
    for (let row = 0; row < result.matrix.length; row++) {
      if (result.moduleTypes[row][6].startsWith('byte-')) {
        expect(false).toBe(true); // 타이밍 패턴 열에 바이트 블록이 있으면 실패
      }
    }
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
      const result = showZigzagPatternStep(formatStep, version);
      
      expect(result.stepName).toBe('5-6A: Zigzag Pattern');
      expect(result.addedModules).toBeGreaterThan(0);
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
    
    showZigzagPatternStep(formatStep, 1);
    
    // 원본 매트릭스는 변경되지 않아야 함
    expect(formatStep.matrix).toEqual(originalMatrix);
  });
});