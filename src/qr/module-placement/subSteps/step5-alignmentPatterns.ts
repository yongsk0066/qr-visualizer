import type { QRVersion } from '../../../shared/types';
import type { SubStepResult } from '../types';
import { 
  cloneMatrix, 
  cloneModuleTypes, 
  placePattern,
  isEmpty
} from '../utils/matrixUtils';
import { ALIGNMENT_PATTERN, getAlignmentPatternPositions } from '../utils/constants';

/**
 * Step 5-5: Alignment Patterns
 * 버전별 얼라인먼트 패턴 (5×5) 배치
 * ISO/IEC 18004 7.3.5 Alignment pattern
 */
export const addAlignmentPatternsStep = (
  previousStep: SubStepResult,
  version: QRVersion
): SubStepResult => {
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  const alignmentPositions = getAlignmentPatternPositions(version);
  let addedModules = 0;
  
  // 각 얼라인먼트 패턴 위치에 5×5 패턴 배치
  for (const position of alignmentPositions) {
    // 얼라인먼트 패턴은 중앙 좌표로 주어지므로 좌상단 좌표로 변환
    const startRow = position.row - 2;
    const startCol = position.col - 2;
    
    // 해당 위치가 비어있는지 확인 (다른 패턴과 겹치지 않는지)
    let canPlace = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!isEmpty(matrix, startRow + r, startCol + c)) {
          canPlace = false;
          break;
        }
      }
      if (!canPlace) break;
    }
    
    if (canPlace) {
      const placed = placePattern(
        matrix,
        moduleTypes,
        startRow,
        startCol,
        ALIGNMENT_PATTERN,
        'alignment'
      );
      addedModules += placed;
    }
  }

  return {
    matrix,
    moduleTypes,
    stepName: '5-5: Alignment Patterns',
    description: `${alignmentPositions.length}개 얼라인먼트 패턴 (5×5) 배치`,
    addedModules,
  };
};