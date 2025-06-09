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
 * Step 5-7: Data Placement
 * 지그재그 패턴으로 데이터 비트 배치
 * ISO/IEC 18004 7.7.3 Placement of data and error correction codewords
 */
export const placeDataBitsStep = (
  previousStep: SubStepResult,
  version: QRVersion,
  bitStream?: string
): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  // 샘플 데이터 (실제로는 Step 4의 finalBitStream 사용)
  const sampleBits = bitStream !== undefined ? bitStream : "11010010001101010101010000000000";
  let bitIndex = 0;
  let addedModules = 0;
  
  // 지그재그 패턴으로 데이터 배치
  // 우하단에서 시작하여 2열씩 위아래로 진행
  let direction = -1; // -1: 위로, 1: 아래로
  
  // 세로 타이밍 라인(6열) 왼쪽부터 2열씩 처리
  for (let colPair = size - 1; colPair > 0; colPair -= 2) {
    // 타이밍 패턴(6열) 건너뛰기
    if (colPair === 6) colPair--;
    
    const leftCol = colPair - 1;
    const rightCol = colPair;
    
    // 현재 방향에 따라 행 진행
    const startRow = direction === -1 ? size - 1 : 0;
    const endRow = direction === -1 ? -1 : size;
    
    for (let row = startRow; row !== endRow; row += direction) {
      // 오른쪽 열 먼저, 그 다음 왼쪽 열
      for (const col of [rightCol, leftCol]) {
        if (isEmpty(matrix, row, col) && bitIndex < sampleBits.length) {
          const bit = parseInt(sampleBits[bitIndex], 10);
          setModule(matrix, row, col, bit as 0 | 1);
          setModuleType(moduleTypes, row, col, 'data');
          bitIndex++;
          addedModules++;
        }
      }
    }
    
    // 방향 전환
    direction *= -1;
  }
  
  const placedBits = Math.min(bitIndex, sampleBits.length);

  return {
    matrix,
    moduleTypes,
    stepName: '5-7: Data Placement',
    description: `지그재그 패턴으로 ${placedBits}비트 데이터 배치`,
    addedModules,
  };
};