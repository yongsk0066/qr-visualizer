import type { QRVersion } from '../../../shared/types';
import type { SubStepResult } from '../types';
import { 
  getMatrixSize, 
  createEmptyMatrix, 
  createEmptyModuleTypes 
} from '../utils/matrixUtils';

/**
 * Step 5-1: Empty Matrix
 * 버전에 따른 빈 QR 매트릭스 초기화
 */
export const createEmptyMatrixStep = (version: QRVersion): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = createEmptyMatrix(size);
  const moduleTypes = createEmptyModuleTypes(size);

  return {
    matrix,
    moduleTypes,
    stepName: '5-1: Empty Matrix',
    description: `${size}×${size} 빈 매트릭스 초기화`,
    addedModules: 0,
  };
};