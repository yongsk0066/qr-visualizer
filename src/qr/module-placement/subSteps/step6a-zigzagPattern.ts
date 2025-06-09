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
  
  // 8비트 블록 번호를 저장할 배열 추가
  const byteBlocks: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
  // 지그재그 순서를 저장할 배열 추가
  const zigzagOrder: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
  
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
          // 8비트 블록 번호 계산 (0번 블록, 1번 블록, 2번 블록...)
          const blockNumber = Math.floor(moduleIndex / 8);
          byteBlocks[row][col] = blockNumber;
          zigzagOrder[row][col] = moduleIndex; // 지그재그 순서 저장
          
          // 지그재그 패턴 시각화를 위한 임시 값 설정
          const displayValue = (blockNumber % 2) as 0 | 1;
          setModule(matrix, row, col, displayValue);
          setModuleType(moduleTypes, row, col, `byte-${blockNumber % 8}`); // 8가지 색상 순환
          moduleIndex++;
          addedModules++;
        }
      }
    }
    
    // 방향 전환
    direction *= -1;
  }

  const totalBlocks = Math.ceil(moduleIndex / 8);

  return {
    matrix,
    moduleTypes,
    stepName: '5-6A: Zigzag Pattern',
    description: `8비트 블록별 지그재그 패턴 (${totalBlocks}개 블록)`,
    addedModules,
    byteBlocks, // 8비트 블록 정보 추가
    zigzagOrder, // 지그재그 순서 정보 추가
  };
};