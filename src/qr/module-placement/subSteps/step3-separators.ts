import type { QRVersion } from '../../../shared/types';
import type { SubStepResult } from '../types';
import { 
  getMatrixSize, 
  cloneMatrix, 
  cloneModuleTypes, 
  setModule,
  setModuleType,
  isValidPosition
} from '../utils/matrixUtils';
import { getFinderPatternPositions } from '../utils/constants';

/**
 * Step 5-3: Separators
 * 파인더 패턴 주변에 1모듈 폭 흰색 분리자 배치
 * ISO/IEC 18004 7.3.3 Separator
 */
export const addSeparatorsStep = (
  previousStep: SubStepResult,
  version: QRVersion
): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  const finderPositions = getFinderPatternPositions(size);
  let addedModules = 0;
  
  // 각 파인더 패턴 주변에 분리자 배치
  for (const position of finderPositions) {
    const { row: startRow, col: startCol } = position;
    
    // 분리자는 파인더 패턴(7×7) 주변 1모듈 테두리
    // 8×8 영역에서 파인더 패턴 영역 제외한 부분
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startRow + r;
        const col = startCol + c;
        
        // 매트릭스 범위 내이고, 파인더 패턴 영역이 아닌 경우
        const isInBounds = isValidPosition(matrix, row, col);
        const isFinderArea = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        
        if (isInBounds && !isFinderArea) {
          // 분리자는 항상 흰색(0)
          setModule(matrix, row, col, 0);
          setModuleType(moduleTypes, row, col, 'separator');
          addedModules++;
        }
      }
    }
  }

  return {
    matrix,
    moduleTypes,
    stepName: '5-3: Separators',
    description: `파인더 패턴 주변 분리자 배치`,
    addedModules,
  };
};