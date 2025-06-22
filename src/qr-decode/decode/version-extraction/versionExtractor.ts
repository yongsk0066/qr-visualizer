/**
 * 버전 정보 추출기
 * ISO/IEC 18004 Section 8.10 및 13.3.2
 */

import type { TriStateQR } from '../../types';
import type { VersionInfoResult, VersionBitsLocation } from './types';
import { correctVersionBCH, validateVersionInfo } from './bchDecoder';

/**
 * tri-state 매트릭스에서 버전 정보 추출
 * 버전 7 이상의 QR 코드에만 존재
 */
export const extractVersionInfo = (triStateQR: TriStateQR): VersionInfoResult | null => {
  if (!triStateQR || !triStateQR.matrix) {
    return null;
  }

  const { matrix, size } = triStateQR;

  // 버전 6 이하는 버전 정보가 없음
  // 크기로 버전 추정: version = (size - 17) / 4
  const estimatedVersion = (size - 17) / 4;
  if (estimatedVersion <= 6) {
    return null; // 버전 정보 영역이 없음
  }

  // 두 위치에서 버전 비트 추출
  const versionBits1 = extractVersionBitsFromLocation1(matrix, size);
  const versionBits2 = extractVersionBitsFromLocation2(matrix, size);

  // 둘 다 null이면 버전 정보 추출 실패
  if (!versionBits1 && !versionBits2) return null;

  // 각 위치에서 디코딩 시도
  const result1 = versionBits1 ? decodeVersionInfo(versionBits1) : null;
  const result2 = versionBits2 ? decodeVersionInfo(versionBits2) : null;

  // 신뢰도 기반 선택
  if (!result1 && !result2) return null;
  
  // 더 신뢰할 수 있는 결과 선택
  let bestResult: VersionInfoResult;
  if (!result1) {
    bestResult = result2!;
  } else if (!result2) {
    bestResult = result1;
  } else {
    // 두 결과가 모두 있을 때
    if (result1.version === result2.version) {
      // 같은 버전이면 신뢰도 합산
      bestResult = {
        ...result1,
        confidence: Math.min(1.0, (result1.confidence + result2.confidence) / 1.5),
      };
    } else {
      // 다른 버전이면 신뢰도가 높은 것 선택
      bestResult = result1.confidence >= result2.confidence ? result1 : result2;
    }
  }
  
  // 두 위치의 상세 정보 추가
  if (result1) {
    bestResult.location1 = {
      rawBits: result1.rawBits || 0,
      isValid: result1.isValid,
      errorBits: result1.errorBits || 0,
      confidence: result1.confidence,
    };
  }
  
  if (result2) {
    bestResult.location2 = {
      rawBits: result2.rawBits || 0,
      isValid: result2.isValid,
      errorBits: result2.errorBits || 0,
      confidence: result2.confidence,
    };
  }

  return bestResult;
};

/**
 * Location 1: 왼쪽 하단 (6×3 블록)
 * ISO/IEC 18004 Figure 25
 */
const extractVersionBitsFromLocation1 = (
  matrix: (-1 | 0 | 1)[][],
  size: number
): VersionBitsLocation | null => {
  const bits: (number | -1)[] = [];
  let unknownCount = 0;

  // 6×3 블록 읽기 (transpose - 열 우선)
  // 좌하단: 가로 6 × 세로 3
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 3; row++) {
      const x = col;
      const y = size - 11 + row;
      
      if (y < 0 || y >= size || x < 0 || x >= size) {
        return null;
      }
      
      const bit = matrix[y][x];
      bits.push(bit);
      if (bit === -1) unknownCount++;
    }
  }

  return { bits, unknownCount };
};

/**
 * Location 2: 오른쪽 상단 (3×6 블록)
 * ISO/IEC 18004 Figure 25
 */
const extractVersionBitsFromLocation2 = (
  matrix: (-1 | 0 | 1)[][],
  size: number
): VersionBitsLocation | null => {
  const bits: (number | -1)[] = [];
  let unknownCount = 0;

  // 3×6 블록 읽기 (transpose - 행 우선)
  // 우상단: 가로 3 × 세로 6
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 3; col++) {
      const x = size - 11 + col;
      const y = row;
      
      if (y < 0 || y >= size || x < 0 || x >= size) {
        return null;
      }
      
      const bit = matrix[y][x];
      bits.push(bit);
      if (bit === -1) unknownCount++;
    }
  }

  return { bits, unknownCount };
};

/**
 * 버전 정보 디코딩
 */
const decodeVersionInfo = (versionBits: VersionBitsLocation): VersionInfoResult | null => {
  const { bits, unknownCount } = versionBits;

  // unknown 비트가 너무 많으면 신뢰할 수 없음
  if (unknownCount > 6) {
    return null;
  }

  // unknown 비트를 0과 1로 시도하여 가장 적은 에러를 가진 결과 선택
  let bestResult: VersionInfoResult | null = null;
  let minErrors = Infinity;

  // unknown 비트 조합 생성 (최대 2^6 = 64 조합)
  const unknownIndices = bits.map((bit, idx) => bit === -1 ? idx : -1).filter(idx => idx !== -1);
  const combinations = 1 << unknownCount;

  for (let combo = 0; combo < combinations; combo++) {
    // unknown 비트에 값 할당
    const testBits = [...bits];
    for (let i = 0; i < unknownCount; i++) {
      testBits[unknownIndices[i]] = (combo >> i) & 1;
    }

    // 18비트로 조합 (MSB first로 변환)
    let rawBits = 0;
    for (let i = 0; i < 18; i++) {
      rawBits |= (testBits[i] as number) << (17 - i);
    }

    // BCH 디코딩
    const { version, errorBits, correctedBits } = correctVersionBCH(rawBits);
    
    if (version !== null && correctedBits !== undefined) {
      // 유효성 검증
      const isValid = validateVersionInfo(version, correctedBits);
      
      if (isValid && errorBits < minErrors) {
        minErrors = errorBits;
        const confidence = calculateConfidence(errorBits, unknownCount);
        
        bestResult = {
          version,
          isValid,
          confidence,
          rawBits,
          errorBits,
        };
      }
    }
  }

  return bestResult;
};

/**
 * 신뢰도 계산
 */
const calculateConfidence = (errorBits: number, unknownCount: number): number => {
  // 에러 비트 수에 따른 감점
  const errorPenalty = errorBits * 0.15;
  
  // unknown 비트 수에 따른 감점
  const unknownPenalty = unknownCount * 0.05;
  
  return Math.max(0, 1.0 - errorPenalty - unknownPenalty);
};