import type { QRVersion } from '../../../shared/types';
import type { SubStepResult } from '../types';
import { 
  getMatrixSize, 
  cloneMatrix, 
  cloneModuleTypes, 
  setModule,
  setModuleType,
  isEmpty
} from '../utils/matrixUtils';

/**
 * Step 5-4: Timing Patterns
 * 6행과 6열에 교대로 나타나는 흑백 타이밍 패턴 배치
 * ISO/IEC 18004 7.3.4 Timing pattern
 */
export const addTimingPatternsStep = (
  previousStep: SubStepResult,
  version: QRVersion
): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  let addedModules = 0;
  
  // 6행에 타이밍 패턴 배치 (가로)
  for (let col = 8; col < size - 8; col++) {
    if (isEmpty(matrix, 6, col)) {
      // 교대 패턴: (col - 8) % 2 === 0이면 흑(1), 아니면 백(0)
      const value = (col - 8) % 2 === 0 ? 1 : 0;
      setModule(matrix, 6, col, value);
      setModuleType(moduleTypes, 6, col, 'timing');
      addedModules++;
    }
  }
  
  // 6열에 타이밍 패턴 배치 (세로)
  for (let row = 8; row < size - 8; row++) {
    if (isEmpty(matrix, row, 6)) {
      // 교대 패턴: (row - 8) % 2 === 0이면 흑(1), 아니면 백(0)
      const value = (row - 8) % 2 === 0 ? 1 : 0;
      setModule(matrix, row, 6, value);
      setModuleType(moduleTypes, row, 6, 'timing');
      addedModules++;
    }
  }

  return {
    matrix,
    moduleTypes,
    stepName: '5-4: Timing Patterns',
    description: `6행/6열에 교대 타이밍 패턴 배치`,
    addedModules,
  };
};