import { pipe } from '@mobily/ts-belt';
import type { QRVersion, ErrorCorrectionLevel } from './types';
import { EC_BLOCKS_TABLE } from './ecBlocksTable';

// GF(256) 갈루아 필드 연산을 위한 상수와 테이블
const GALOIS_FIELD_256 = 256;
const PRIMITIVE_POLYNOMIAL = 0x11d; // x^8 + x^4 + x^3 + x^2 + 1

// 지수 및 로그 테이블 (GF(256) 연산 최적화)
const gfExp: number[] = new Array(256);
const gfLog: number[] = new Array(256);

// 갈루아 필드 테이블 초기화
const initializeGaloisField = () => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    gfExp[i] = x;
    gfLog[x] = i;
    x <<= 1;
    if (x >= GALOIS_FIELD_256) {
      x ^= PRIMITIVE_POLYNOMIAL;
    }
  }
  gfExp[255] = gfExp[0];
};

// 테이블 초기화 실행
initializeGaloisField();

/**
 * 갈루아 필드에서 두 수의 곱셈
 * ISO/IEC 18004 부속서 A
 */
const gfMultiply = (a: number, b: number): number => {
  if (a === 0 || b === 0) return 0;
  return gfExp[(gfLog[a] + gfLog[b]) % 255];
};

/**
 * 갈루아 필드에서 다항식 곱셈
 */
const multiplyPolynomials = (a: number[], b: number[]): number[] => {
  const result = new Array(a.length + b.length - 1).fill(0);
  
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] ^= gfMultiply(a[i], b[j]);
    }
  }
  
  return result;
};

/**
 * Reed-Solomon 생성 다항식 생성
 * ISO/IEC 18004 표 A.1-A.7 (line 1888-1917)
 */
export const generateRSPolynomial = (degree: number): number[] => {
  let result = [1];
  
  for (let i = 0; i < degree; i++) {
    result = multiplyPolynomials(result, [1, gfExp[i]]);
  }
  
  return result;
};

/**
 * 에러 정정 블록 정보
 */
export interface ECBlock {
  totalCount: number;  // 블록당 총 코드워드 수
  dataCount: number;   // 블록당 데이터 코드워드 수
}

/**
 * 에러 정정 블록 구조
 */
export interface ECBlocks {
  ecCodewordsPerBlock: number;  // 블록당 에러 정정 코드워드 수
  groups: {
    blocks: number;     // 이 그룹의 블록 수
    totalCount: number; // 블록당 총 코드워드 수
    dataCount: number;  // 블록당 데이터 코드워드 수
  }[];
}

/**
 * 버전과 에러 정정 레벨에 따른 블록 구조 반환
 * ISO/IEC 18004 표 13-22 (line 1157-1517)
 */
export const getECBlocks = (
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): ECBlocks => {
  return EC_BLOCKS_TABLE[version]?.[errorLevel] || EC_BLOCKS_TABLE[1][errorLevel];
};

/**
 * 데이터 코드워드에 대한 에러 정정 코드워드 생성
 * ISO/IEC 18004 8.5 (line 1129-1156)
 */
export const generateErrorCorrectionCodewords = (
  dataCodewords: number[],
  ecCodewordCount: number
): number[] => {
  const generator = generateRSPolynomial(ecCodewordCount);
  const result = [...dataCodewords];
  
  // 에러 정정을 위한 공간 확보
  for (let i = 0; i < ecCodewordCount; i++) {
    result.push(0);
  }
  
  // 다항식 나눗셈 수행
  for (let i = 0; i < dataCodewords.length; i++) {
    const coefficient = result[i];
    if (coefficient !== 0) {
      for (let j = 0; j < generator.length; j++) {
        result[i + j] ^= gfMultiply(generator[j], coefficient);
      }
    }
  }
  
  // 나머지(에러 정정 코드워드) 추출
  return result.slice(dataCodewords.length);
};

/**
 * 전체 메시지에 대한 에러 정정 처리
 * 블록 분할 및 각 블록에 대한 에러 정정 코드워드 생성
 */
export interface ErrorCorrectionResult {
  dataBlocks: number[][];      // 각 블록의 데이터 코드워드
  ecBlocks: number[][];        // 각 블록의 에러 정정 코드워드
  totalDataCodewords: number;  // 총 데이터 코드워드 수
  totalECCodewords: number;    // 총 에러 정정 코드워드 수
}

/**
 * 메시지를 블록으로 분할하고 각 블록에 대한 에러 정정 코드워드 생성
 */
export const performErrorCorrection = (
  dataCodewords: number[],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): ErrorCorrectionResult => {
  const ecBlocks = getECBlocks(version, errorLevel);
  const dataBlocks: number[][] = [];
  const ecBlocksResult: number[][] = [];
  
  let dataOffset = 0;
  
  // 각 그룹의 블록 처리
  for (const group of ecBlocks.groups) {
    for (let i = 0; i < group.blocks; i++) {
      // 이 블록의 데이터 코드워드 추출
      const blockData = dataCodewords.slice(
        dataOffset,
        dataOffset + group.dataCount
      );
      dataBlocks.push(blockData);
      
      // 에러 정정 코드워드 생성
      const ecCodewords = generateErrorCorrectionCodewords(
        blockData,
        ecBlocks.ecCodewordsPerBlock
      );
      ecBlocksResult.push(ecCodewords);
      
      dataOffset += group.dataCount;
    }
  }
  
  return {
    dataBlocks,
    ecBlocks: ecBlocksResult,
    totalDataCodewords: dataOffset,
    totalECCodewords: ecBlocksResult.reduce((sum, block) => sum + block.length, 0),
  };
};

/**
 * 비트 스트림을 8비트 코드워드 배열로 변환
 */
export const bitStreamToCodewords = (bitStream: string): number[] => {
  const codewords: number[] = [];
  
  for (let i = 0; i < bitStream.length; i += 8) {
    const byte = bitStream.substr(i, 8);
    codewords.push(parseInt(byte.padEnd(8, '0'), 2));
  }
  
  return codewords;
};

/**
 * 인터리빙: 데이터 블록과 에러 정정 블록을 최종 순서로 배치
 * ISO/IEC 18004 8.6 (line 1289-1334)
 */
export const interleaveCodewords = (
  dataBlocks: number[][],
  ecBlocks: number[][]
): number[] => {
  const result: number[] = [];
  
  // 데이터 코드워드 인터리빙
  const maxDataLength = Math.max(...dataBlocks.map(block => block.length));
  for (let i = 0; i < maxDataLength; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }
  
  // 에러 정정 코드워드 인터리빙
  const maxECLength = Math.max(...ecBlocks.map(block => block.length));
  for (let i = 0; i < maxECLength; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }
  
  return result;
};