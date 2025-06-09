/**
 * QR 코드 마스킹 패널티 점수 계산
 * ISO/IEC 18004 Section 8.8.2 기준
 */

export interface PenaltyScore {
  penalty1: number; // 연속된 같은 색 모듈
  penalty2: number; // 2×2 블록
  penalty3: number; // 1:1:3:1:1 패턴
  penalty4: number; // 검정 모듈 비율
  total: number;    // 총 패널티 점수
}

// 패널티 가중치 (ISO/IEC 18004 표준)
const N1 = 3;  // 연속 모듈 패널티
const N2 = 3;  // 블록 패널티
const N3 = 40; // 파인더 패턴 유사 패널티
const N4 = 10; // 모듈 비율 패널티

/**
 * 패널티 1: 같은 색깔로 행/열에서 인접한 모듈
 * 5개 이상 연속된 같은 색 모듈에 대해 패널티 부과
 */
export const calculatePenalty1 = (matrix: (0 | 1 | null)[][]): number => {
  const size = matrix.length;
  let penalty = 0;

  // 행 검사
  for (let row = 0; row < size; row++) {
    let count = 1;
    let prevColor = matrix[row][0];
    
    for (let col = 1; col < size; col++) {
      const currentColor = matrix[row][col];
      
      if (currentColor === prevColor && currentColor !== null) {
        count++;
      } else {
        if (count >= 5 && prevColor !== null) {
          penalty += N1 + (count - 5);
        }
        count = 1;
        prevColor = currentColor;
      }
    }
    
    // 행 끝에서 검사
    if (count >= 5 && prevColor !== null) {
      penalty += N1 + (count - 5);
    }
  }

  // 열 검사
  for (let col = 0; col < size; col++) {
    let count = 1;
    let prevColor = matrix[0][col];
    
    for (let row = 1; row < size; row++) {
      const currentColor = matrix[row][col];
      
      if (currentColor === prevColor && currentColor !== null) {
        count++;
      } else {
        if (count >= 5 && prevColor !== null) {
          penalty += N1 + (count - 5);
        }
        count = 1;
        prevColor = currentColor;
      }
    }
    
    // 열 끝에서 검사
    if (count >= 5 && prevColor !== null) {
      penalty += N1 + (count - 5);
    }
  }

  return penalty;
};

/**
 * 패널티 2: 같은 색깔 모듈의 2×2 블록
 */
export const calculatePenalty2 = (matrix: (0 | 1 | null)[][]): number => {
  const size = matrix.length;
  let penalty = 0;

  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const topLeft = matrix[row][col];
      const topRight = matrix[row][col + 1];
      const bottomLeft = matrix[row + 1][col];
      const bottomRight = matrix[row + 1][col + 1];

      // 2×2 블록이 모두 같은 색이고 null이 아닌 경우
      if (topLeft !== null && 
          topLeft === topRight && 
          topLeft === bottomLeft && 
          topLeft === bottomRight) {
        penalty += N2;
      }
    }
  }

  return penalty;
};

/**
 * 패널티 3: 행/열에서 1:1:3:1:1 비율 패턴 (파인더 패턴과 유사)
 * 패턴: dark:light:dark:dark:dark:light:dark (1:1:3:1:1)
 */
export const calculatePenalty3 = (matrix: (0 | 1 | null)[][]): number => {
  const size = matrix.length;
  let penalty = 0;

  // 파인더 패턴: 1011101 (dark-light-dark-dark-dark-light-dark)
  const checkPattern = (sequence: (0 | 1 | null)[], startIndex: number): boolean => {
    if (startIndex + 6 >= sequence.length) return false;
    
    const pattern = [1, 0, 1, 1, 1, 0, 1]; // 1:1:3:1:1 패턴
    
    for (let i = 0; i < 7; i++) {
      if (sequence[startIndex + i] !== pattern[i]) {
        return false;
      }
    }
    
    // 앞뒤로 4개 이상의 light 모듈이 있는지 확인 (선택사항)
    return true;
  };

  // 행 검사
  for (let row = 0; row < size; row++) {
    const rowSequence = matrix[row];
    for (let col = 0; col <= size - 7; col++) {
      if (checkPattern(rowSequence, col)) {
        penalty += N3;
      }
    }
  }

  // 열 검사
  for (let col = 0; col < size; col++) {
    const colSequence: (0 | 1 | null)[] = [];
    for (let row = 0; row < size; row++) {
      colSequence.push(matrix[row][col]);
    }
    
    for (let row = 0; row <= size - 7; row++) {
      if (checkPattern(colSequence, row)) {
        penalty += N3;
      }
    }
  }

  return penalty;
};

/**
 * 패널티 4: 전체 심벌에서 검정 모듈의 비율
 * 50%에서 벗어난 정도에 따라 패널티 부과
 */
export const calculatePenalty4 = (matrix: (0 | 1 | null)[][]): number => {
  const size = matrix.length;
  let darkCount = 0;
  let totalCount = 0;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const module = matrix[row][col];
      if (module !== null) {
        totalCount++;
        if (module === 1) {
          darkCount++;
        }
      }
    }
  }

  if (totalCount === 0) return 0;

  const darkPercentage = (darkCount / totalCount) * 100;
  
  // 50%에서 벗어난 정도를 5% 단위로 계산
  const deviation = Math.abs(darkPercentage - 50);
  const k = Math.floor(deviation / 5);
  
  return N4 * k;
};

/**
 * 총 패널티 점수 계산
 */
export const calculateTotalPenalty = (matrix: (0 | 1 | null)[][]): PenaltyScore => {
  const penalty1 = calculatePenalty1(matrix);
  const penalty2 = calculatePenalty2(matrix);
  const penalty3 = calculatePenalty3(matrix);
  const penalty4 = calculatePenalty4(matrix);
  
  return {
    penalty1,
    penalty2,
    penalty3,
    penalty4,
    total: penalty1 + penalty2 + penalty3 + penalty4
  };
};

/**
 * XOR 결과 매트릭스 생성 (패널티 계산용)
 */
export const applyMaskToMatrix = (
  originalMatrix: (0 | 1 | null)[][],
  maskMatrix: boolean[][]
): (0 | 1 | null)[][] => {
  const size = originalMatrix.length;
  const result: (0 | 1 | null)[][] = [];

  for (let row = 0; row < size; row++) {
    result[row] = [];
    for (let col = 0; col < size; col++) {
      const originalValue = originalMatrix[row][col];
      const shouldMask = maskMatrix[row][col];

      if (originalValue === null) {
        result[row][col] = null;
      } else {
        // XOR 연산: 마스킹이 적용되면 비트 반전
        result[row][col] = shouldMask ? (1 - originalValue) as (0 | 1) : originalValue;
      }
    }
  }

  return result;
};