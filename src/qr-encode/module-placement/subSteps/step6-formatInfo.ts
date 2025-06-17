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
 * 정확한 포맷 정보 위치 정의 (ISO/IEC 18004 Figure 19 기준)
 * 15비트 포맷 정보: 비트 0(LSB) ~ 비트 14(MSB)
 */
const getFormatInfoPositions = (size: number) => {
  // 위치 1: 좌상단 파인더 패턴 주변 (비트 0-14)
  const position1 = [
    { row: 0, col: 8 },   // 비트 0
    { row: 1, col: 8 },   // 비트 1  
    { row: 2, col: 8 },   // 비트 2
    { row: 3, col: 8 },   // 비트 3
    { row: 4, col: 8 },   // 비트 4
    { row: 5, col: 8 },   // 비트 5
    { row: 7, col: 8 },   // 비트 6 (타이밍 패턴 건너뜀)
    { row: 8, col: 8 },   // 비트 7
    { row: 8, col: 7 },   // 비트 8
    { row: 8, col: 5 },   // 비트 9
    { row: 8, col: 4 },   // 비트 10
    { row: 8, col: 3 },   // 비트 11
    { row: 8, col: 2 },   // 비트 12
    { row: 8, col: 1 },   // 비트 13
    { row: 8, col: 0 }    // 비트 14
  ];
  
  // 위치 2: 우상단과 좌하단 파인더 사이 (비트 0-14 중복)
  const position2 = [
    { row: size - 1, col: 8 },   // 비트 0 
    { row: size - 2, col: 8 },   // 비트 1
    { row: size - 3, col: 8 },   // 비트 2
    { row: size - 4, col: 8 },   // 비트 3
    { row: size - 5, col: 8 },   // 비트 4
    { row: size - 6, col: 8 },   // 비트 5
    { row: size - 7, col: 8 },   // 비트 6
    { row: 8, col: size - 1 },   // 비트 7
    { row: 8, col: size - 2 },   // 비트 8
    { row: 8, col: size - 3 },   // 비트 9
    { row: 8, col: size - 4 },   // 비트 10
    { row: 8, col: size - 5 },   // 비트 11
    { row: 8, col: size - 6 },   // 비트 12
    { row: 8, col: size - 7 },   // 비트 13
    { row: 8, col: size - 8 }    // 비트 14
  ];
  
  return { position1, position2 };
};

/**
 * 정확한 버전 정보 위치 정의 (ISO/IEC 18004 Figure 21 기준)
 * 18비트 버전 정보: 비트 0(LSB) ~ 비트 17(MSB)
 * 버전 7-40에서만 사용
 * 
 * 버전 정보는 분리자와 타이밍 패턴 사이에 배치됨:
 * - 좌하단: 타이밍 패턴 왼쪽, 좌하단 분리자 위 (6×3)
 * - 우상단: 타이밍 패턴 위, 우상단 분리자 왼쪽 (3×6)
 */
const getVersionInfoPositions = (size: number) => {
  // 위치 1: 좌하단 (6×3 블록) - 가로 방향으로 읽기
  // 6열 × 3행, 분리자 밑에서 3칸 더 아래로
  const position1 = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      position1.push({ row: size - 11 + row, col });
    }
  }
  
  // 위치 2: 우상단 (3×6 블록) - 세로 방향으로 읽기  
  // 3열 × 6행, 분리자 오른쪽에서 3칸 더 오른쪽으로
  const position2 = [];
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 6; row++) {
      position2.push({ row, col: size - 11 + col });
    }
  }
  
  return { position1, position2 };
};

/**
 * Step 5-6: Format Information
 * 포맷 정보 및 버전 정보 영역 정확한 예약
 * ISO/IEC 18004 Section 8.9 Format information
 * ISO/IEC 18004 Section 8.10 Version information  
 */
export const reserveFormatInfoStep = (
  previousStep: SubStepResult,
  version: QRVersion
): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  let addedModules = 0;
  
  // 포맷 정보 영역 정확한 예약 (15비트 × 2곳)
  const { position1: formatPos1, position2: formatPos2 } = getFormatInfoPositions(size);
  
  // 포맷 정보 위치 1 배치
  for (const pos of formatPos1) {
    if (isEmpty(matrix, pos.row, pos.col)) {
      setModule(matrix, pos.row, pos.col, 0); // 임시값 (실제로는 BCH 계산 결과)
      setModuleType(moduleTypes, pos.row, pos.col, 'format');
      addedModules++;
    }
  }
  
  // 포맷 정보 위치 2 배치
  for (const pos of formatPos2) {
    if (isEmpty(matrix, pos.row, pos.col)) {
      setModule(matrix, pos.row, pos.col, 0); // 임시값 (실제로는 BCH 계산 결과)
      setModuleType(moduleTypes, pos.row, pos.col, 'format');
      addedModules++;
    }
  }
  
  // 다크 모듈 (Dark module) - 항상 검은색
  // 위치: (4 * version + 9, 8) - ISO/IEC 18004 표준에 따름
  const darkModuleRow = 4 * version + 9;
  const darkModuleCol = 8;
  // 다크 모듈은 무조건 배치 (타이밍 패턴과 겹쳐도)
  setModule(matrix, darkModuleRow, darkModuleCol, 1);
  setModuleType(moduleTypes, darkModuleRow, darkModuleCol, 'format');
  addedModules++;
  
  // 실제 버전 정보 계산 및 배치 (버전 7-40만)
  let versionModules = 0;
  if (version >= 7) {
    const { position1: versionPos1, position2: versionPos2 } = getVersionInfoPositions(size);
    
    // 버전 정보 위치 1: 좌하단 (6×3 블록)
    for (const pos of versionPos1) {
      if (isEmpty(matrix, pos.row, pos.col)) {
        setModule(matrix, pos.row, pos.col, 0); // 임시값 (실제로는 BCH 계산 결과)
        setModuleType(moduleTypes, pos.row, pos.col, 'version');
        versionModules++;
      }
    }
    
    // 버전 정보 위치 2: 우상단 (3×6 블록)  
    for (const pos of versionPos2) {
      if (isEmpty(matrix, pos.row, pos.col)) {
        setModule(matrix, pos.row, pos.col, 0); // 임시값 (실제로는 BCH 계산 결과)
        setModuleType(moduleTypes, pos.row, pos.col, 'version');
        versionModules++;
      }
    }
  }
  
  addedModules += versionModules;
  
  const versionInfo = version >= 7 ? ` + 버전 정보 (18비트×2)` : '';

  return {
    matrix,
    moduleTypes,
    stepName: '5-6: Format Info',
    description: `포맷 정보 (15비트×2) + 다크 모듈${versionInfo}`,
    addedModules,
  };
};