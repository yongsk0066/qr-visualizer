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
 * Step 5-6A: Zigzag Pattern Visualization
 * 지그재그 데이터 배치 패턴을 시각적으로 표시
 * (실제 데이터 배치 전에 어느 위치에 데이터가 들어갈지 미리 보여줌)
 */
export const showZigzagPatternStep = (
  previousStep: SubStepResult,
  version: QRVersion
): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  let addedModules = 0;
  let moduleIndex = 0;
  
  // 지그재그 패턴으로 데이터 모듈 위치 표시
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
        if (isEmpty(matrix, row, col)) {
          // 지그재그 패턴을 시각적으로 표시 (번호 순서)
          const displayValue = moduleIndex < 50 ? 1 : 0; // 처음 50개만 강조 표시
          setModule(matrix, row, col, displayValue);
          setModuleType(moduleTypes, row, col, 'zigzag');
          moduleIndex++;
          addedModules++;
        }
      }
    }
    
    // 방향 전환
    direction *= -1;
  }

  return {
    matrix,
    moduleTypes,
    stepName: '5-6A: Zigzag Pattern',
    description: `지그재그 데이터 배치 패턴 표시`,
    addedModules,
  };
};