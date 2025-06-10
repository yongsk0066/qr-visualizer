/**
 * 모드 선택 효율성 분석을 위한 유틸리티
 */

import { getCharacterCountBits } from './dataAnalysis';
import type { QRMode, QRVersion } from '../../shared/types';

interface EncodingCost {
  mode: QRMode;
  totalBits: number;
  breakdown: {
    modeIndicator: number;
    characterCount: number;
    data: number;
  };
}

/**
 * 특정 모드로 데이터를 인코딩할 때 필요한 비트 수 계산
 */
export const calculateEncodingCost = (
  data: string,
  mode: QRMode,
  version: QRVersion = 1
): EncodingCost => {
  const modeIndicatorBits = 4;
  const characterCountBits = getCharacterCountBits(mode, version);
  
  let dataBits = 0;
  const length = data.length;
  
  switch (mode) {
    case 'numeric':
      dataBits = Math.floor(length / 3) * 10 + 
                 (length % 3 === 2 ? 7 : length % 3 === 1 ? 4 : 0);
      break;
    case 'alphanumeric':
      dataBits = Math.floor(length / 2) * 11 + (length % 2) * 6;
      break;
    case 'byte':
      dataBits = length * 8;
      break;
    case 'kanji':
      dataBits = length * 13;
      break;
  }
  
  return {
    mode,
    totalBits: modeIndicatorBits + characterCountBits + dataBits,
    breakdown: {
      modeIndicator: modeIndicatorBits,
      characterCount: characterCountBits,
      data: dataBits
    }
  };
};

/**
 * 다중 모드 세그먼트로 인코딩할 때 필요한 비트 수 계산
 */
export const calculateMultiModeEncodingCost = (
  segments: Array<{ data: string; mode: QRMode }>,
  version: QRVersion = 1
): { totalBits: number; segments: EncodingCost[] } => {
  const encodedSegments = segments.map(segment => 
    calculateEncodingCost(segment.data, segment.mode, version)
  );
  
  const totalBits = encodedSegments.reduce((sum, seg) => sum + seg.totalBits, 0);
  
  return {
    totalBits,
    segments: encodedSegments
  };
};

/**
 * 주어진 데이터에 대한 모든 가능한 인코딩 방법 비교
 */
export const compareEncodingStrategies = (
  data: string,
  version: QRVersion = 1
): {
  singleMode: Record<string, EncodingCost>;
  multiMode?: { totalBits: number; segments: EncodingCost[] };
  optimal: string;
} => {
  const strategies: Record<string, EncodingCost> = {};
  
  // 단일 모드 전략들
  // Numeric 모드 (숫자만 포함된 경우)
  if (/^[0-9]+$/.test(data)) {
    strategies['numeric'] = calculateEncodingCost(data, 'numeric', version);
  }
  
  // Alphanumeric 모드 (숫자, 대문자, 특수문자)
  if (/^[0-9A-Z $%*+\-./:]+$/.test(data)) {
    strategies['alphanumeric'] = calculateEncodingCost(data, 'alphanumeric', version);
  }
  
  // Byte 모드 (항상 가능)
  strategies['byte'] = calculateEncodingCost(data, 'byte', version);
  
  // 최적 전략 찾기
  const optimal = Object.entries(strategies)
    .reduce((best, [name, cost]) => 
      cost.totalBits < strategies[best].totalBits ? name : best
    , 'byte');
  
  return {
    singleMode: strategies,
    optimal
  };
};

/**
 * 예제 분석 실행
 */
export const analyzeExamples = () => {
  const examples = [
    "123A",           // 숫자 3개 + 알파벳 1개
    "123ABC",         // 숫자 3개 + 알파벳 3개
    "12345A",         // 숫자 5개 + 알파벳 1개
    "A12345",         // 알파벳 1개 + 숫자 5개
    "123456789",      // 숫자만 9개
    "ABCDEFGHI",      // 알파벳만 9개
    "123ABC456DEF",   // 혼합 패턴
  ];
  
  const results = examples.map(data => {
    const comparison = compareEncodingStrategies(data);
    return {
      data,
      ...comparison
    };
  });
  
  return results;
};