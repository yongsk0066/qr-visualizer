import type { QRVersion } from '../../../shared/types';
import type { SubStepResult } from '../types';
import { 
  getMatrixSize, 
  createEmptyMatrix, 
  createEmptyModuleTypes 
} from '../utils/matrixUtils';
import { t } from '@/config/language';

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
    description: t(`${size}×${size} 빈 매트릭스 초기화`, `${size}×${size} empty matrix initialization`),
    addedModules: 0,
  };
};