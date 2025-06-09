import type { QRVersion } from '../../shared/types';
import type { ModulePlacementResult } from './types';
import { createEmptyMatrixStep } from './subSteps/step1-emptyMatrix';
import { addFinderPatternsStep } from './subSteps/step2-finderPatterns';
import { addSeparatorsStep } from './subSteps/step3-separators';
import { addTimingPatternsStep } from './subSteps/step4-timingPatterns';
import { addAlignmentPatternsStep } from './subSteps/step5-alignmentPatterns';
import { reserveFormatInfoStep } from './subSteps/step6-formatInfo';
import { showZigzagPatternStep } from './subSteps/step6a-zigzagPattern';
import { placeDataBitsStep } from './subSteps/step7-dataPlacement';

/**
 * Step 5: Module Placement - 전체 파이프라인 실행
 * 8단계 세부 과정을 순차적으로 실행하여 완전한 QR 매트릭스 생성
 */
export const runModulePlacement = (
  version: QRVersion,
  bitStream?: string
): ModulePlacementResult => {
  // Step 5-1: Empty Matrix
  const step1 = createEmptyMatrixStep(version);
  
  // Step 5-2: Finder Patterns
  const step2 = addFinderPatternsStep(step1, version);
  
  // Step 5-3: Separators
  const step3 = addSeparatorsStep(step2, version);
  
  // Step 5-4: Timing Patterns
  const step4 = addTimingPatternsStep(step3, version);
  
  // Step 5-5: Alignment Patterns
  const step5 = addAlignmentPatternsStep(step4, version);
  
  // Step 5-6: Format Information
  const step6 = reserveFormatInfoStep(step5, version);
  
  // Step 5-6A: Zigzag Pattern Visualization
  const step6a = showZigzagPatternStep(step6, version);
  
  // Step 5-7: Data Placement
  const step7 = placeDataBitsStep(step6, version, bitStream);

  // 모든 세부 단계 결과 수집
  const subSteps = [step1, step2, step3, step4, step5, step6, step6a, step7];
  
  // 데이터 모듈 개수 계산
  const dataModuleCount = step7.matrix.flat().filter((_, idx) => {
    const row = Math.floor(idx / step7.matrix.length);
    const col = idx % step7.matrix.length;
    return step7.moduleTypes[row][col] === 'data';
  }).length;
  
  // 총 데이터 가능 모듈 개수 (빈 공간)
  const totalDataModules = step6.matrix.flat().filter((_, idx) => {
    const row = Math.floor(idx / step6.matrix.length);
    const col = idx % step6.matrix.length;
    return step6.moduleTypes[row][col] === 'empty';
  }).length;

  return {
    subSteps,
    finalMatrix: step7.matrix,
    finalModuleTypes: step7.moduleTypes,
    size: step7.matrix.length,
    totalDataModules,
    usedDataModules: dataModuleCount,
  };
};

/**
 * 특정 단계까지만 실행 (UI 시각화용)
 */
export const runModulePlacementUntilStep = (
  version: QRVersion,
  stepNumber: number,
  bitStream?: string
): ModulePlacementResult => {
  const fullResult = runModulePlacement(version, bitStream);
  
  // 지정된 단계까지만 subSteps 반환
  const subSteps = fullResult.subSteps.slice(0, stepNumber);
  const finalStep = subSteps[subSteps.length - 1];
  
  return {
    ...fullResult,
    subSteps,
    finalMatrix: finalStep.matrix,
    finalModuleTypes: finalStep.moduleTypes,
  };
};