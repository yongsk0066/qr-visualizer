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
 * Step 5-6: Format Information
 * 포맷 정보 영역 예약 (에러 정정 레벨 및 마스크 패턴)
 * 버전 정보 영역 예약 (버전 7-40)
 * ISO/IEC 18004 7.9.1 Format information
 */
export const reserveFormatInfoStep = (
  previousStep: SubStepResult,
  version: QRVersion
): SubStepResult => {
  const size = getMatrixSize(version);
  const matrix = cloneMatrix(previousStep.matrix);
  const moduleTypes = cloneModuleTypes(previousStep.moduleTypes);
  
  let addedModules = 0;
  
  // 포맷 정보 영역 예약
  // 위치 1: 좌상단 파인더 주변
  const formatPositions1 = [
    // 파인더 패턴 우측 (0,8)부터 (0,14)까지
    ...Array.from({ length: 7 }, (_, i) => ({ row: 0, col: 8 + i })),
    // 파인더 패턴 하단 (8,0)부터 (14,0)까지  
    ...Array.from({ length: 7 }, (_, i) => ({ row: 8 + i, col: 0 })),
    // 추가 위치
    { row: 8, col: 7 }, { row: 8, col: 8 }, { row: 7, col: 8 }
  ];
  
  // 위치 2: 우상단과 좌하단 파인더 사이
  const formatPositions2 = [
    // 우상단 파인더 하단 세로 라인
    ...Array.from({ length: 8 }, (_, i) => ({ row: size - 8 + i, col: 8 })),
    // 좌하단 파인더 우측 가로 라인  
    ...Array.from({ length: 8 }, (_, i) => ({ row: 8, col: size - 8 + i }))
  ];
  
  const allFormatPositions = [...formatPositions1, ...formatPositions2];
  
  for (const pos of allFormatPositions) {
    if (isEmpty(matrix, pos.row, pos.col)) {
      setModule(matrix, pos.row, pos.col, 0); // 임시로 0으로 설정 (실제로는 계산된 값)
      setModuleType(moduleTypes, pos.row, pos.col, 'format');
      addedModules++;
    }
  }
  
  // 다크 모듈 (Dark module) - 항상 검은색
  // 위치: (4 * version + 9, 8)
  const darkModuleRow = 4 * version + 9;
  const darkModuleCol = 8;
  // 다크 모듈은 무조건 배치 (타이밍 패턴과 겹쳐도)
  setModule(matrix, darkModuleRow, darkModuleCol, 1);
  setModuleType(moduleTypes, darkModuleRow, darkModuleCol, 'format');
  addedModules++;
  
  // 버전 정보 영역 예약 (버전 7-40만)
  let versionModules = 0;
  if (version >= 7) {
    // 버전 정보 위치 1: 좌하단 파인더 우상단
    for (let row = 0; row < 6; row++) {
      for (let col = size - 11; col < size - 8; col++) {
        if (isEmpty(matrix, row, col)) {
          setModule(matrix, row, col, 0); // 임시로 0으로 설정
          setModuleType(moduleTypes, row, col, 'version');
          versionModules++;
        }
      }
    }
    
    // 버전 정보 위치 2: 우상단 파인더 좌하단
    for (let row = size - 11; row < size - 8; row++) {
      for (let col = 0; col < 6; col++) {
        if (isEmpty(matrix, row, col)) {
          setModule(matrix, row, col, 0); // 임시로 0으로 설정
          setModuleType(moduleTypes, row, col, 'version');
          versionModules++;
        }
      }
    }
  }
  
  addedModules += versionModules;
  
  const versionInfo = version >= 7 ? ` + 버전 정보` : '';

  return {
    matrix,
    moduleTypes,
    stepName: '5-6: Format Info',
    description: `포맷 정보 영역 예약${versionInfo}`,
    addedModules,
  };
};