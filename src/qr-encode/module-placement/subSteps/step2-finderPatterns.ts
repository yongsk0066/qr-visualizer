import type { QRVersion } from '../../../shared/types';
import type { SubStepResult } from '../types';
import { 
  getMatrixSize, 
  cloneMatrix, 
  cloneModuleTypes, 
  placePattern 
} from '../utils/matrixUtils';
import { FINDER_PATTERN, getFinderPatternPositions } from '../utils/constants';

/**
 * Step 5-2: Finder Patterns
 * 3개 모서리에 파인더 패턴 (7×7) 배치
 * ISO/IEC 18004 7.3.2 Position detection pattern
 */
export const addFinderPatternsStep = (
  previousStep: SubStepResult,
  version: QRVersion
): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  const finderPositions = getFinderPatternPositions(size);
  let addedModules = 0;
  
  // 3개 파인더 패턴 배치: 좌상단, 우상단, 좌하단
  for (const position of finderPositions) {
    const placed = placePattern(
      matrix,
      moduleTypes,
      position.row,
      position.col,
      FINDER_PATTERN,
      'finder'
    );
    addedModules += placed;
  }

  return {
    matrix,
    moduleTypes,
    stepName: '5-2: Finder Patterns',
    description: `3개 파인더 패턴 (7×7) 배치`,
    addedModules,
  };
};