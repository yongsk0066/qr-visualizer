import type { TriStateQR } from '../../types';
import type { ErrorCorrectionLevel } from '../../../shared/types';
import type { FormatInfoResult, FormatBitsLocation, MaskPattern } from './types';
import { FORMAT_INFO_MASK, FORMAT_GENERATOR_POLYNOMIAL } from './types';

/**
 * tri-state 매트릭스에서 포맷 정보 추출
 * ISO/IEC 18004 Section 8.9
 */
export const extractFormatInfo = (triStateQR: TriStateQR): FormatInfoResult | null => {
  if (!triStateQR || !triStateQR.matrix) {
    return null;
  }

  const { matrix, size } = triStateQR;

  // 두 위치에서 포맷 비트 추출
  const formatBits1 = extractFormatBitsFromLocation1(matrix);
  const formatBits2 = extractFormatBitsFromLocation2(matrix, size);

  // 둘 다 null이면 포맷 정보 추출 실패
  if (!formatBits1 && !formatBits2) return null;

  // 더 신뢰할 수 있는 포맷 정보 선택
  const result1 = formatBits1 ? decodeFormatInfo(formatBits1) : null;
  const result2 = formatBits2 ? decodeFormatInfo(formatBits2) : null;

  // 신뢰도 기반 선택
  if (!result1 && !result2) return null;
  
  // 더 신뢰할 수 있는 결과 선택
  let bestResult: FormatInfoResult;
  if (!result1) {
    bestResult = result2!;
  } else if (!result2) {
    bestResult = result1;
  } else {
    bestResult = result1.confidence >= result2.confidence ? result1 : result2;
  }
  
  // 두 위치의 상세 정보 추가
  if (result1) {
    bestResult.location1 = {
      rawBits: result1.rawBits,
      isValid: result1.isValid,
      errorBits: result1.errorBits || 0,
      confidence: result1.confidence
    };
  }
  
  if (result2) {
    bestResult.location2 = {
      rawBits: result2.rawBits,
      isValid: result2.isValid,
      errorBits: result2.errorBits || 0,
      confidence: result2.confidence
    };
  }
  
  return bestResult;
};

/**
 * 위치 1에서 포맷 비트 추출 (왼쪽 상단 파인더 주변)
 */
const extractFormatBitsFromLocation1 = (matrix: (-1 | 0 | 1)[][]): string | null => {
  // 포맷 정보 위치 1: 파인더 패턴 주변
  const locations: FormatBitsLocation[] = [
    // 왼쪽 상단 파인더 주변 (0-7번 비트)
    { row: 8, col: 0, bitIndex: 0 },
    { row: 8, col: 1, bitIndex: 1 },
    { row: 8, col: 2, bitIndex: 2 },
    { row: 8, col: 3, bitIndex: 3 },
    { row: 8, col: 4, bitIndex: 4 },
    { row: 8, col: 5, bitIndex: 5 },
    { row: 8, col: 7, bitIndex: 6 }, // 6열은 타이밍 패턴
    { row: 8, col: 8, bitIndex: 7 },
    // 왼쪽 상단 파인더 아래쪽 (8-14번 비트)
    { row: 7, col: 8, bitIndex: 8 },
    { row: 5, col: 8, bitIndex: 9 },
    { row: 4, col: 8, bitIndex: 10 },
    { row: 3, col: 8, bitIndex: 11 },
    { row: 2, col: 8, bitIndex: 12 },
    { row: 1, col: 8, bitIndex: 13 },
    { row: 0, col: 8, bitIndex: 14 },
  ];

  return extractBitsFromLocations(matrix, locations);
};

/**
 * 위치 2에서 포맷 비트 추출 (오른쪽 하단)
 */
const extractFormatBitsFromLocation2 = (matrix: (-1 | 0 | 1)[][], size: number): string | null => {
  // 포맷 정보 위치 2: 대각선 반대편
  const locations: FormatBitsLocation[] = [
    // 오른쪽 하단 (0-6번 비트)
    { row: size - 1, col: 8, bitIndex: 0 },
    { row: size - 2, col: 8, bitIndex: 1 },
    { row: size - 3, col: 8, bitIndex: 2 },
    { row: size - 4, col: 8, bitIndex: 3 },
    { row: size - 5, col: 8, bitIndex: 4 },
    { row: size - 6, col: 8, bitIndex: 5 },
    { row: size - 7, col: 8, bitIndex: 6 },
    // 오른쪽 상단 (7-14번 비트)
    { row: 8, col: size - 8, bitIndex: 7 },
    { row: 8, col: size - 7, bitIndex: 8 },
    { row: 8, col: size - 6, bitIndex: 9 },
    { row: 8, col: size - 5, bitIndex: 10 },
    { row: 8, col: size - 4, bitIndex: 11 },
    { row: 8, col: size - 3, bitIndex: 12 },
    { row: 8, col: size - 2, bitIndex: 13 },
    { row: 8, col: size - 1, bitIndex: 14 },
  ];

  return extractBitsFromLocations(matrix, locations);
};

/**
 * 지정된 위치에서 비트 추출
 */
const extractBitsFromLocations = (
  matrix: (-1 | 0 | 1)[][],
  locations: FormatBitsLocation[]
): string | null => {
  const bits: string[] = [];
  let unknownCount = 0;

  for (const { row, col, bitIndex } of locations) {
    const module = matrix[row]?.[col];
    
    if (module === undefined || module === -1) {
      unknownCount++;
      // Unknown 모듈은 일단 0으로 가정
      bits[bitIndex] = '0';
    } else {
      // QR 코드에서: 검은색(0) = 비트 1, 흰색(1) = 비트 0
      bits[bitIndex] = module === 0 ? '1' : '0';
    }
  }

  // 너무 많은 unknown 모듈이면 신뢰할 수 없음 (9개 이상)
  if (unknownCount >= 9) return null;

  return bits.join('');
};

/**
 * 포맷 정보 디코딩 및 BCH 에러 정정
 */
const decodeFormatInfo = (formatBits: string): FormatInfoResult => {
  // 문자열을 숫자로 변환
  const formatCode = parseInt(formatBits, 2);
  
  // 마스크 제거
  const unmaskedCode = formatCode ^ FORMAT_INFO_MASK;
  
  // BCH 에러 정정 시도
  const { correctedCode, errorCount } = correctFormatBCH(unmaskedCode);
  
  // 데이터 비트 추출 (상위 5비트)
  const dataBits = correctedCode >> 10;
  
  // 에러 정정 레벨 (상위 2비트)
  const errorLevelBits = dataBits >> 3;
  const errorLevel = decodeErrorLevel(errorLevelBits);
  
  // 마스크 패턴 (하위 3비트)
  const maskPattern = (dataBits & 0b111) as MaskPattern;
  
  // 신뢰도 계산
  const confidence = calculateConfidence(errorCount);
  
  return {
    errorLevel,
    maskPattern,
    isValid: errorCount <= 3, // BCH(15,5)는 최대 3비트 에러 정정 가능
    rawBits: formatBits,
    confidence,
    errorBits: errorCount,
  };
};

/**
 * BCH(15,5) 에러 정정
 */
const correctFormatBCH = (code: number): { correctedCode: number; errorCount: number } => {
  // 신드롬 계산
  const syndrome = calculateSyndrome(code);
  
  if (syndrome === 0) {
    // 에러 없음
    return { correctedCode: code, errorCount: 0 };
  }
  
  // 1비트 에러 정정 시도
  for (let i = 0; i < 15; i++) {
    const testCode = code ^ (1 << i);
    if (calculateSyndrome(testCode) === 0) {
      return { correctedCode: testCode, errorCount: 1 };
    }
  }
  
  // 2비트 에러 정정 시도
  for (let i = 0; i < 15; i++) {
    for (let j = i + 1; j < 15; j++) {
      const testCode = code ^ (1 << i) ^ (1 << j);
      if (calculateSyndrome(testCode) === 0) {
        return { correctedCode: testCode, errorCount: 2 };
      }
    }
  }
  
  // 3비트 에러 정정 시도
  for (let i = 0; i < 15; i++) {
    for (let j = i + 1; j < 15; j++) {
      for (let k = j + 1; k < 15; k++) {
        const testCode = code ^ (1 << i) ^ (1 << j) ^ (1 << k);
        if (calculateSyndrome(testCode) === 0) {
          return { correctedCode: testCode, errorCount: 3 };
        }
      }
    }
  }
  
  // 정정 불가능
  return { correctedCode: code, errorCount: 4 };
};

/**
 * BCH 신드롬 계산
 */
const calculateSyndrome = (code: number): number => {
  let remainder = code;
  
  // 다항식 나눗셈
  for (let i = 14; i >= 10; i--) {
    if (remainder & (1 << i)) {
      remainder ^= FORMAT_GENERATOR_POLYNOMIAL << (i - 10);
    }
  }
  
  return remainder & 0x3FF; // 하위 10비트만
};

/**
 * 에러 정정 레벨 디코딩
 */
const decodeErrorLevel = (bits: number): ErrorCorrectionLevel => {
  switch (bits) {
    case 0b01: return 'L';
    case 0b00: return 'M';
    case 0b11: return 'Q';
    case 0b10: return 'H';
    default: return 'L'; // 기본값
  }
};

/**
 * 신뢰도 계산
 */
const calculateConfidence = (errorCount: number): number => {
  // 에러가 없으면 100% 신뢰도
  if (errorCount === 0) return 1;
  
  // 에러 수를 기반으로 신뢰도 계산
  const errorPenalty = errorCount * 0.25;
  
  return Math.max(0, 1 - errorPenalty);
};