/**
 * QR 코드 포맷 정보 생성
 * ISO/IEC 18004 Section 8.9
 */

import type { ErrorCorrectionLevel } from '../../shared/types';
import type { MaskPattern } from '../masking/maskPatterns';

/**
 * 에러 정정 레벨 지시자 (ISO/IEC 18004 표 25)
 */
const ERROR_CORRECTION_INDICATORS = {
  L: 0b01, // 01
  M: 0b00, // 00  
  Q: 0b11, // 11
  H: 0b10  // 10
} as const;

/**
 * 포맷 정보 생성기 다항식: x^10 + x^8 + x^5 + x^4 + x^2 + x + 1
 * 이진수: 10100110111 (1335 decimal)
 */
const FORMAT_GENERATOR_POLYNOMIAL = 0b10100110111;

/**
 * 포맷 정보 마스크 패턴: 101010000010010
 * ISO/IEC 18004에서 정의된 고정 마스크
 */
const FORMAT_MASK_PATTERN = 0b101010000010010;

/**
 * BCH(15,5) 에러 정정 코드로 포맷 정보 생성
 */
const calculateFormatBCH = (data: number): number => {
  // 5비트 데이터를 10비트 왼쪽으로 시프트 (x^10을 곱함)
  let remainder = data << 10;
  
  // 다항식 나눗셈
  for (let i = 14; i >= 10; i--) {
    if (remainder & (1 << i)) {
      remainder ^= FORMAT_GENERATOR_POLYNOMIAL << (i - 10);
    }
  }
  
  return remainder;
};

/**
 * 완전한 15비트 포맷 정보 생성
 */
export const generateFormatInfo = (
  errorLevel: ErrorCorrectionLevel, 
  maskPattern: MaskPattern
): number => {
  // 5비트 데이터: 에러 정정 레벨(2비트) + 마스크 패턴(3비트)
  const errorIndicator = ERROR_CORRECTION_INDICATORS[errorLevel];
  const formatData = (errorIndicator << 3) | maskPattern;
  
  // BCH 에러 정정 코드 계산 (10비트)
  const errorCorrectionBits = calculateFormatBCH(formatData);
  
  // 15비트 포맷 정보: 데이터(5비트) + 에러정정(10비트)
  const formatInfo = (formatData << 10) | errorCorrectionBits;
  
  // 마스크 패턴 적용
  return formatInfo ^ FORMAT_MASK_PATTERN;
};

/**
 * 포맷 정보를 비트 배열로 변환
 * MSB first 방식: 최상위 비트(bit 14)가 배열의 첫 번째 요소가 됨
 * 예: 0x5412 -> [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0]
 */
export const formatInfoToBits = (formatInfo: number): number[] => {
  const bits: number[] = [];
  // MSB first: i=14부터 0까지 (최상위 비트부터 추출)
  for (let i = 14; i >= 0; i--) {
    bits.push((formatInfo >> i) & 1);
  }
  return bits;
};

/**
 * 포맷 정보 비트들을 QR 매트릭스의 지정된 위치에 배치
 * ISO/IEC 18004 Figure 25 참조
 */
export const placeFormatInfo = (
  matrix: (0 | 1 | null)[][],
  formatInfo: number
): (0 | 1 | null)[][] => {
  const size = matrix.length;
  const bits = formatInfoToBits(formatInfo);
  const result = matrix.map(row => [...row]);
  
  // 포맷 정보 위치 1: 파인더 패턴 주변 (시계방향)
  const positions1: [number, number][] = [
    // 왼쪽 상단 파인더 주변 (0-7번 비트)
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    // 왼쪽 상단 파인더 아래쪽 (8-14번 비트)  
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  
  // 포맷 정보 위치 2: 대각선 반대편
  const positions2: [number, number][] = [
    // 오른쪽 하단 (0-6번 비트)
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], 
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    // 오른쪽 상단 (7-14번 비트)
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5], 
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
  ];
  
  // 위치 1에 포맷 정보 배치
  positions1.forEach(([row, col], index) => {
    if (row < size && col < size && index < bits.length) {
      result[row][col] = bits[index] as (0 | 1);
    }
  });
  
  // 위치 2에 포맷 정보 배치
  positions2.forEach(([row, col], index) => {
    if (row < size && col < size && index < bits.length) {
      result[row][col] = bits[index] as (0 | 1);
    }
  });
  
  return result;
};