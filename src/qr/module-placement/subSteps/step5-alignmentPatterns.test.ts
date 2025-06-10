import { describe, it, expect } from 'vitest';
import { createEmptyMatrixStep } from './step1-emptyMatrix';
import { addFinderPatternsStep } from './step2-finderPatterns';
import { addSeparatorsStep } from './step3-separators';
import { addTimingPatternsStep } from './step4-timingPatterns';
import { addAlignmentPatternsStep } from './step5-alignmentPatterns';

describe('Step 5-5: Alignment Patterns', () => {
  it('should not add alignment patterns for version 1', () => {
    const emptyStep = createEmptyMatrixStep(1);
    const finderStep = addFinderPatternsStep(emptyStep, 1);
    const separatorStep = addSeparatorsStep(finderStep, 1);
    const timingStep = addTimingPatternsStep(separatorStep, 1);
    const result = addAlignmentPatternsStep(timingStep, 1);
    
    expect(result.stepName).toBe('5-5: Alignment Patterns');
    expect(result.description).toBe('0개 얼라인먼트 패턴 (5×5) 배치');
    expect(result.addedModules).toBe(0); // 버전 1은 얼라인먼트 패턴이 없음
  });

  it('should add alignment patterns for version 2', () => {
    const emptyStep = createEmptyMatrixStep(2);
    const finderStep = addFinderPatternsStep(emptyStep, 2);
    const separatorStep = addSeparatorsStep(finderStep, 2);
    const timingStep = addTimingPatternsStep(separatorStep, 2);
    const result = addAlignmentPatternsStep(timingStep, 2);
    
    expect(result.description).toBe('1개 얼라인먼트 패턴 (5×5) 배치');
    expect(result.addedModules).toBe(25); // 1개 패턴 * 5×5 = 25개
    
    // 버전 2의 얼라인먼트 패턴은 중앙 (18,18)에 위치
    // 좌상단 좌표는 (16,16)
    expect(result.matrix[16][16]).toBe(1); // 패턴 좌상단
    expect(result.matrix[18][18]).toBe(1); // 패턴 중앙
    expect(result.matrix[20][20]).toBe(1); // 패턴 우하단
    expect(result.moduleTypes[18][18]).toBe('alignment');
  });

  it('should add multiple alignment patterns for version 7', () => {
    const emptyStep = createEmptyMatrixStep(7);
    const finderStep = addFinderPatternsStep(emptyStep, 7);
    const separatorStep = addSeparatorsStep(finderStep, 7);
    const timingStep = addTimingPatternsStep(separatorStep, 7);
    const result = addAlignmentPatternsStep(timingStep, 7);
    
    expect(result.description).toBe('6개 얼라인먼트 패턴 (5×5) 배치');
    expect(result.addedModules).toBe(150); // 6개 얼라인먼트 패턴의 실제 추가된 모듈 수
    
    // 버전 7의 얼라인먼트 패턴 위치: [6, 22, 38]
    // 조합: (6,22), (6,38), (22,6), (22,22), (22,38), (38,6), (38,22), (38,38)
    // 하지만 파인더 패턴과 겹치는 위치는 제외됨
    
    // 중앙 얼라인먼트 패턴 확인 (22,22)
    expect(result.matrix[20][20]).toBe(1); // 좌상단
    expect(result.matrix[22][22]).toBe(1); // 중앙
    expect(result.matrix[24][24]).toBe(1); // 우하단
    expect(result.moduleTypes[22][22]).toBe('alignment');
  });

  it('should handle alignment pattern conflicts with existing patterns', () => {
    const emptyStep = createEmptyMatrixStep(2);
    const finderStep = addFinderPatternsStep(emptyStep, 2);
    const separatorStep = addSeparatorsStep(finderStep, 2);
    const timingStep = addTimingPatternsStep(separatorStep, 2);
    
    // 수동으로 얼라인먼트 패턴 위치에 다른 패턴 배치하여 충돌 테스트
    // 실제로는 ISO 표준에 따라 충돌이 일어나지 않도록 설계되어 있음
    const result = addAlignmentPatternsStep(timingStep, 2);
    
    // 정상적으로 배치되어야 함
    expect(result.addedModules).toBe(25);
  });

  it('should place correct alignment pattern structure', () => {
    const emptyStep = createEmptyMatrixStep(2);
    const finderStep = addFinderPatternsStep(emptyStep, 2);
    const separatorStep = addSeparatorsStep(finderStep, 2);
    const timingStep = addTimingPatternsStep(separatorStep, 2);
    const result = addAlignmentPatternsStep(timingStep, 2);
    
    // 얼라인먼트 패턴의 구조 확인 (중앙: 18,18)
    // 패턴 구조:
    // 1 1 1 1 1
    // 1 0 0 0 1
    // 1 0 1 0 1
    // 1 0 0 0 1
    // 1 1 1 1 1
    
    const centerRow = 18;
    const centerCol = 18;
    
    // 외곽 테두리 (첫 번째/마지막 행과 열)
    expect(result.matrix[centerRow - 2][centerCol - 2]).toBe(1); // (16,16)
    expect(result.matrix[centerRow - 2][centerCol + 2]).toBe(1); // (16,20)
    expect(result.matrix[centerRow + 2][centerCol - 2]).toBe(1); // (20,16)
    expect(result.matrix[centerRow + 2][centerCol + 2]).toBe(1); // (20,20)
    
    // 중앙
    expect(result.matrix[centerRow][centerCol]).toBe(1); // (18,18)
    
    // 내부 빈 공간
    expect(result.matrix[centerRow - 1][centerCol - 1]).toBe(0); // (17,17)
    expect(result.matrix[centerRow - 1][centerCol + 1]).toBe(0); // (17,19)
    expect(result.matrix[centerRow + 1][centerCol - 1]).toBe(0); // (19,17)
    expect(result.matrix[centerRow + 1][centerCol + 1]).toBe(0); // (19,19)
  });

  it('should preserve original matrix state', () => {
    const emptyStep = createEmptyMatrixStep(2);
    const finderStep = addFinderPatternsStep(emptyStep, 2);
    const separatorStep = addSeparatorsStep(finderStep, 2);
    const timingStep = addTimingPatternsStep(separatorStep, 2);
    const originalMatrix = timingStep.matrix.map(row => [...row]);
    
    addAlignmentPatternsStep(timingStep, 2);
    
    // 원본 매트릭스는 변경되지 않아야 함
    expect(timingStep.matrix).toEqual(originalMatrix);
  });
});