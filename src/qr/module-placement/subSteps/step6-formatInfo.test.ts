import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';
import { addFinderPatternsStep } from './step2-finderPatterns';
import { addSeparatorsStep } from './step3-separators';
import { addTimingPatternsStep } from './step4-timingPatterns';
import { addAlignmentPatternsStep } from './step5-alignmentPatterns';
import { reserveFormatInfoStep } from './step6-formatInfo';

describe('Step 5-6: Format Information', () => {
  it('should reserve format information areas for version 1', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const result = reserveFormatInfoStep(alignmentStep, 1);
    
    expect(result.stepName).toBe('5-6: Format Info');
    expect(result.description).toBe('포맷 정보 영역 예약');
    expect(result.addedModules).toBeGreaterThan(0);
    
    // 다크 모듈 확인 (4 * 1 + 9 = 13, 8)
    expect(result.matrix[13][8]).toBe(1);
    expect(result.moduleTypes[13][8]).toBe('format');
    
    // 포맷 정보 영역 확인
    expect(result.moduleTypes[0][8]).toBe('format');
    expect(result.moduleTypes[8][0]).toBe('format');
  });

  it('should reserve format and version information areas for version 7', () => {
    const emptyStep = createEmptyMatrixStep(7);
    const finderStep = addFinderPatternsStep(emptyStep, 7);
    const separatorStep = addSeparatorsStep(finderStep, 7);
    const timingStep = addTimingPatternsStep(separatorStep, 7);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 7);
    const result = reserveFormatInfoStep(alignmentStep, 7);
    
    expect(result.description).toBe('포맷 정보 영역 예약 + 버전 정보');
    
    // 다크 모듈 확인 (4 * 7 + 9 = 37, 8)
    expect(result.matrix[37][8]).toBe(1);
    expect(result.moduleTypes[37][8]).toBe('format');
    
    // 버전 정보 영역 확인
    expect(result.moduleTypes[0][45 - 11]).toBe('version'); // 좌상단 버전 정보
    expect(result.moduleTypes[45 - 11][0]).toBe('version'); // 좌하단 버전 정보
  });

  it('should not overwrite existing patterns', () => {
    const emptyStep = createEmptyMatrixStep(2);
    const finderStep = addFinderPatternsStep(emptyStep, 2);
    const separatorStep = addSeparatorsStep(finderStep, 2);
    const timingStep = addTimingPatternsStep(separatorStep, 2);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 2);
    const result = reserveFormatInfoStep(alignmentStep, 2);
    
    // 기존 패턴들이 유지되어야 함
    expect(result.moduleTypes[0][0]).toBe('finder');
    expect(result.moduleTypes[7][7]).toBe('separator');
    expect(result.moduleTypes[6][8]).toBe('timing');
    expect(result.moduleTypes[18][18]).toBe('alignment');
  });

  it('should place dark module at correct position for different versions', () => {
    const versions = [1, 3, 5, 10] as const;
    
    for (const version of versions) {
      const emptyStep = createEmptyMatrixStep(version);
      const finderStep = addFinderPatternsStep(emptyStep, version);
      const separatorStep = addSeparatorsStep(finderStep, version);
      const timingStep = addTimingPatternsStep(separatorStep, version);
      const alignmentStep = addAlignmentPatternsStep(timingStep, version);
      const result = reserveFormatInfoStep(alignmentStep, version);
      
      const darkModuleRow = 4 * version + 9;
      expect(result.matrix[darkModuleRow][8]).toBe(1);
      expect(result.moduleTypes[darkModuleRow][8]).toBe('format');
    }
  });

  it('should only add version information for versions 7 and above', () => {
    // 버전 6 (버전 정보 없음)
    const version6Steps = [
      createEmptyMatrixStep(6),
      addFinderPatternsStep(createEmptyMatrixStep(6), 6),
      addSeparatorsStep(addFinderPatternsStep(createEmptyMatrixStep(6), 6), 6),
      addTimingPatternsStep(addSeparatorsStep(addFinderPatternsStep(createEmptyMatrixStep(6), 6), 6), 6),
      addAlignmentPatternsStep(addTimingPatternsStep(addSeparatorsStep(addFinderPatternsStep(createEmptyMatrixStep(6), 6), 6), 6), 6)
    ];
    const result6 = reserveFormatInfoStep(version6Steps[4], 6);
    expect(result6.description).toBe('포맷 정보 영역 예약');
    
    // 버전 7 (버전 정보 있음)
    const version7Steps = [
      createEmptyMatrixStep(7),
      addFinderPatternsStep(createEmptyMatrixStep(7), 7),
      addSeparatorsStep(addFinderPatternsStep(createEmptyMatrixStep(7), 7), 7),
      addTimingPatternsStep(addSeparatorsStep(addFinderPatternsStep(createEmptyMatrixStep(7), 7), 7), 7),
      addAlignmentPatternsStep(addTimingPatternsStep(addSeparatorsStep(addFinderPatternsStep(createEmptyMatrixStep(7), 7), 7), 7), 7)
    ];
    const result7 = reserveFormatInfoStep(version7Steps[4], 7);
    expect(result7.description).toBe('포맷 정보 영역 예약 + 버전 정보');
  });

  it('should reserve format information in correct positions', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const result = reserveFormatInfoStep(alignmentStep, 1);
    
    // 포맷 정보 영역이 올바른 위치에 있는지 확인
    // 좌상단 파인더 우측
    expect(['format', 'separator']).toContain(result.moduleTypes[0][8]);
    
    // 좌상단 파인더 하단
    expect(['format', 'separator']).toContain(result.moduleTypes[8][0]);
    
    // 우하단 영역
    expect(['format', 'separator']).toContain(result.moduleTypes[20][8]);
    expect(['format', 'separator']).toContain(result.moduleTypes[8][20]);
  });

  it('should preserve original matrix state', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const alignmentStep = addAlignmentPatternsStep(timingStep, 1);
    const originalMatrix = alignmentStep.matrix.map(row => [...row]);
    
    reserveFormatInfoStep(alignmentStep, 1);
    
    // 원본 매트릭스는 변경되지 않아야 함
    expect(alignmentStep.matrix).toEqual(originalMatrix);
  });
});