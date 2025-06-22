import type { ZigzagPosition } from '../types';

/**
 * 지그재그 읽기 패턴 생성
 * ISO/IEC 18004 Section 7.7.3 - Symbol character placement
 * 
 * @param size QR 코드 크기
 * @param dataModules 데이터 모듈 위치 (true = 데이터 모듈)
 * @returns 읽기 순서대로 정렬된 위치 배열
 */
export const generateZigzagPattern = (
  size: number,
  dataModules: boolean[][]
): ZigzagPosition[] => {
  const positions: ZigzagPosition[] = [];
  let bitIndex = 0;
  
  // 방향: -1 = 위로, 1 = 아래로
  let direction = -1;
  
  // 오른쪽에서 왼쪽으로 2열씩 처리
  for (let colPair = size - 1; colPair > 0; colPair -= 2) {
    // 타이밍 패턴 (6열) 건너뛰기
    if (colPair === 6) colPair--;
    
    const rightCol = colPair;
    const leftCol = colPair - 1;
    
    // 현재 방향에 따라 행 진행
    const startRow = direction === -1 ? size - 1 : 0;
    const endRow = direction === -1 ? -1 : size;
    
    for (let row = startRow; row !== endRow; row += direction) {
      // 오른쪽 열 먼저, 그 다음 왼쪽 열
      for (const col of [rightCol, leftCol]) {
        if (col >= 0 && dataModules[row][col]) {
          positions.push({
            row,
            col,
            bitIndex,
            byteIndex: Math.floor(bitIndex / 8),
            bitInByte: bitIndex % 8
          });
          bitIndex++;
        }
      }
    }
    
    // 방향 전환
    direction *= -1;
  }
  
  return positions;
};

/**
 * 읽기 순서 매트릭스 생성 (시각화용)
 */
export const createReadingOrderMatrix = (
  size: number,
  positions: ZigzagPosition[]
): number[][] => {
  const matrix = Array.from(
    { length: size },
    () => Array(size).fill(-1)
  );
  
  positions.forEach((pos, index) => {
    matrix[pos.row][pos.col] = index;
  });
  
  return matrix;
};

/**
 * 바이트 블록 매트릭스 생성 (시각화용)
 */
export const createByteBlockMatrix = (
  size: number,
  positions: ZigzagPosition[]
): number[][] => {
  const matrix = Array.from(
    { length: size },
    () => Array(size).fill(-1)
  );
  
  positions.forEach(pos => {
    matrix[pos.row][pos.col] = pos.byteIndex;
  });
  
  return matrix;
};