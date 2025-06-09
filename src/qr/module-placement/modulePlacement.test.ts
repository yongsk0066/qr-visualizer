import { describe, it, expect } from 'vitest';
import { runModulePlacement, runModulePlacementUntilStep } from './modulePlacement';

describe('Module Placement Pipeline', () => {
  it('should run complete module placement pipeline for version 1', () => {
    const result = runModulePlacement(1);
    
    expect(result.subSteps).toHaveLength(7);
    expect(result.finalMatrix).toHaveLength(21);
    expect(result.finalMatrix[0]).toHaveLength(21);
    expect(result.size).toBe(21);
    expect(result.totalDataModules).toBeGreaterThan(0);
    expect(result.usedDataModules).toBeGreaterThanOrEqual(0);
    
    // 각 단계가 올바른 이름을 가지는지 확인
    expect(result.subSteps[0].stepName).toBe('5-1: Empty Matrix');
    expect(result.subSteps[1].stepName).toBe('5-2: Finder Patterns');
    expect(result.subSteps[2].stepName).toBe('5-3: Separators');
    expect(result.subSteps[3].stepName).toBe('5-4: Timing Patterns');
    expect(result.subSteps[4].stepName).toBe('5-5: Alignment Patterns');
    expect(result.subSteps[5].stepName).toBe('5-6: Format Info');
    expect(result.subSteps[6].stepName).toBe('5-7: Data Placement');
  });

  it('should run with custom bit stream', () => {
    const customBits = "110100100011";
    const result = runModulePlacement(1, customBits);
    
    expect(result.subSteps).toHaveLength(7);
    expect(result.subSteps[6].description).toContain('12비트 데이터 배치');
  });

  it('should work with different QR versions', () => {
    const versions = [1, 2, 5, 7] as const;
    
    for (const version of versions) {
      const result = runModulePlacement(version);
      const expectedSize = 21 + (version - 1) * 4;
      
      expect(result.size).toBe(expectedSize);
      expect(result.finalMatrix).toHaveLength(expectedSize);
      expect(result.subSteps).toHaveLength(7);
    }
  });

  it('should have all pattern types in final matrix', () => {
    const result = runModulePlacement(2); // 버전 2는 얼라인먼트 패턴 포함
    
    const moduleTypes = new Set<string>();
    result.finalModuleTypes.flat().forEach(type => moduleTypes.add(type));
    
    expect(moduleTypes.has('finder')).toBe(true);
    expect(moduleTypes.has('separator')).toBe(true);
    expect(moduleTypes.has('timing')).toBe(true);
    expect(moduleTypes.has('alignment')).toBe(true);
    expect(moduleTypes.has('format')).toBe(true);
    expect(moduleTypes.has('data')).toBe(true);
  });

  it('should calculate data module statistics correctly', () => {
    const result = runModulePlacement(1);
    
    expect(result.totalDataModules).toBeGreaterThan(result.usedDataModules);
    expect(result.usedDataModules).toBeGreaterThanOrEqual(0);
    
    // 총 모듈 수는 size^2과 같아야 함
    const totalModules = result.size * result.size;
    const nonDataModules = result.finalModuleTypes.flat().filter(type => type !== 'data' && type !== 'empty').length;
    const emptyModules = result.finalModuleTypes.flat().filter(type => type === 'empty').length;
    
    expect(nonDataModules + result.usedDataModules + emptyModules).toBe(totalModules);
  });

  it('should run until specific step', () => {
    // 3단계까지만 실행
    const result = runModulePlacementUntilStep(1, 3);
    
    expect(result.subSteps).toHaveLength(3);
    expect(result.subSteps[0].stepName).toBe('5-1: Empty Matrix');
    expect(result.subSteps[1].stepName).toBe('5-2: Finder Patterns');
    expect(result.subSteps[2].stepName).toBe('5-3: Separators');
    
    // 마지막 단계의 매트릭스가 최종 결과여야 함
    expect(result.finalMatrix).toEqual(result.subSteps[2].matrix);
    expect(result.finalModuleTypes).toEqual(result.subSteps[2].moduleTypes);
  });

  it('should handle step boundaries correctly', () => {
    // 1단계만
    const step1 = runModulePlacementUntilStep(1, 1);
    expect(step1.subSteps).toHaveLength(1);
    expect(step1.subSteps[0].stepName).toBe('5-1: Empty Matrix');
    
    // 7단계 전체
    const step7 = runModulePlacementUntilStep(1, 7);
    expect(step7.subSteps).toHaveLength(7);
    expect(step7.subSteps[6].stepName).toBe('5-7: Data Placement');
  });

  it('should maintain step progression correctly', () => {
    const result = runModulePlacement(1);
    
    // 각 단계는 이전 단계보다 더 많은 모듈을 가져야 함 (비어있는 매트릭스 제외)
    for (let i = 1; i < result.subSteps.length; i++) {
      const currentNonEmpty = result.subSteps[i].matrix.flat().filter(m => m !== null).length;
      const previousNonEmpty = result.subSteps[i-1].matrix.flat().filter(m => m !== null).length;
      
      // 각 단계는 모듈을 추가만 해야 함 (제거하지 않음)
      expect(currentNonEmpty).toBeGreaterThanOrEqual(previousNonEmpty);
    }
  });

  it('should preserve matrix structure across steps', () => {
    const result = runModulePlacement(2);
    
    // 모든 단계의 매트릭스 크기가 동일해야 함
    const expectedSize = 25; // 버전 2
    result.subSteps.forEach(step => {
      expect(step.matrix).toHaveLength(expectedSize);
      expect(step.matrix[0]).toHaveLength(expectedSize);
      expect(step.moduleTypes).toHaveLength(expectedSize);
      expect(step.moduleTypes[0]).toHaveLength(expectedSize);
    });
  });

  it('should handle version-specific features correctly', () => {
    // 버전 1 (얼라인먼트 패턴 없음)
    const result1 = runModulePlacement(1);
    expect(result1.subSteps[4].addedModules).toBe(0); // 얼라인먼트 패턴
    expect(result1.subSteps[5].description).not.toContain('버전 정보');
    
    // 버전 7 (얼라인먼트 패턴과 버전 정보 있음)
    const result7 = runModulePlacement(7);
    expect(result7.subSteps[4].addedModules).toBeGreaterThan(0); // 얼라인먼트 패턴
    expect(result7.subSteps[5].description).toContain('버전 정보');
  });
});