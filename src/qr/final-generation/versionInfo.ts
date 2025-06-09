/**
 * QR 코드 버전 정보 생성 (버전 7-40)
 * ISO/IEC 18004 Section 8.10
 */

import type { QRVersion } from '../../shared/types';

/**
 * 버전 정보 생성기 다항식: x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1
 * 이진수: 1111100100101 (7973 decimal)
 */
const VERSION_GENERATOR_POLYNOMIAL = 0b1111100100101;

/**
 * BCH(18,6) 에러 정정 코드로 버전 정보 생성
 */
const calculateVersionBCH = (version: number): number => {
  // 6비트 버전을 12비트 왼쪽으로 시프트 (x^12를 곱함)
  let remainder = version << 12;
  
  // 다항식 나눗셈
  for (let i = 17; i >= 12; i--) {
    if (remainder & (1 << i)) {
      remainder ^= VERSION_GENERATOR_POLYNOMIAL << (i - 12);
    }
  }
  
  return remainder;
};

/**
 * 완전한 18비트 버전 정보 생성 (버전 7-40만)
 */
export const generateVersionInfo = (version: QRVersion): number | null => {
  const versionNum = version;
  
  // 버전 7 미만에는 버전 정보가 없음
  if (versionNum < 7) {
    return null;
  }
  
  // BCH 에러 정정 코드 계산 (12비트)
  const errorCorrectionBits = calculateVersionBCH(versionNum);
  
  // 18비트 버전 정보: 버전(6비트) + 에러정정(12비트)
  return (versionNum << 12) | errorCorrectionBits;
};

/**
 * 버전 정보를 비트 배열로 변환
 */
export const versionInfoToBits = (versionInfo: number): number[] => {
  const bits: number[] = [];
  for (let i = 17; i >= 0; i--) {
    bits.push((versionInfo >> i) & 1);
  }
  return bits;
};

/**
 * 버전 정보 비트들을 QR 매트릭스의 지정된 위치에 배치
 * ISO/IEC 18004 Figure 25 참조
 */
export const placeVersionInfo = (
  matrix: (0 | 1 | null)[][],
  version: QRVersion
): (0 | 1 | null)[][] => {
  const versionInfo = generateVersionInfo(version);
  
  // 버전 7 미만에는 버전 정보가 없음
  if (!versionInfo) {
    return matrix;
  }
  
  const size = matrix.length;
  const bits = versionInfoToBits(versionInfo);
  const result = matrix.map(row => [...row]);
  
  // 버전 정보 위치 1: 좌하단 (6×3 블록)
  // 6열 × 3행, 분리자 밑에서 3칸 더 아래로
  const position1: [number, number][] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      position1.push([size - 11 + row, col]);
    }
  }
  
  // 버전 정보 위치 2: 우상단 (3×6 블록)  
  // 3열 × 6행, 분리자 오른쪽에서 3칸 더 오른쪽으로
  const position2: [number, number][] = [];
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 6; row++) {
      position2.push([row, size - 11 + col]);
    }
  }
  
  // 위치 1에 버전 정보 배치 (가로 방향으로 읽기)
  position1.forEach(([row, col], index) => {
    if (row < size && col < size && index < bits.length) {
      result[row][col] = bits[index] as (0 | 1);
    }
  });
  
  // 위치 2에 버전 정보 배치 (세로 방향으로 읽기)
  position2.forEach(([row, col], index) => {
    if (row < size && col < size && index < bits.length) {
      result[row][col] = bits[index] as (0 | 1);
    }
  });
  
  return result;
};