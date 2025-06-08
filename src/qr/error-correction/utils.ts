import { GALOIS_FIELD } from '../../shared/consts';

/**
 * GF(256) 갈루아 필드 클래스
 * 테이블 기반 최적화된 갈루아 필드 연산 제공
 */
class GaloisField256 {
  private static readonly FIELD_SIZE = GALOIS_FIELD.FIELD_SIZE;
  private static readonly PRIMITIVE_POLYNOMIAL = GALOIS_FIELD.PRIMITIVE_POLYNOMIAL;
  
  private readonly expTable: number[];
  private readonly logTable: number[];
  
  constructor() {
    this.expTable = new Array(256);
    this.logTable = new Array(256);
    this.initializeTables();
  }
  
  private initializeTables(): void {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      this.expTable[i] = x;
      this.logTable[x] = i;
      x = this.shiftWithPrimitive(x);
    }
    this.expTable[255] = this.expTable[0];
  }
  
  private shiftWithPrimitive(x: number): number {
    x <<= 1;
    return x >= GaloisField256.FIELD_SIZE 
      ? x ^ GaloisField256.PRIMITIVE_POLYNOMIAL 
      : x;
  }
  
  /**
   * 갈루아 필드에서 두 수의 곱셈
   * ISO/IEC 18004 부속서 A
   */
  multiply = (a: number, b: number): number => {
    if (a === 0 || b === 0) return 0;
    return this.expTable[(this.logTable[a] + this.logTable[b]) % 255];
  };
  
  /**
   * α^i 값 반환 (지수 테이블 접근)
   */
  getExp = (i: number): number => this.expTable[i % 255];
}

// 싱글톤 갈루아 필드 인스턴스
const gf256 = new GaloisField256();

/**
 * 갈루아 필드에서 다항식 곱셈
 */
const multiplyPolynomials = (a: number[], b: number[]): number[] => {
  const result = new Array(a.length + b.length - 1).fill(0);
  
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] ^= gf256.multiply(a[i], b[j]);
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
    result = multiplyPolynomials(result, [1, gf256.getExp(i)]);
  }
  
  return result;
};

/**
 * Reed-Solomon 다항식 나눗셈 연산
 */
const performPolynomialDivision = (dividend: number[], generator: number[]): number[] => {
  const result = [...dividend];
  
  for (let i = 0; i < dividend.length - generator.length + 1; i++) {
    const coefficient = result[i];
    if (coefficient !== 0) {
      for (let j = 0; j < generator.length; j++) {
        result[i + j] ^= gf256.multiply(generator[j], coefficient);
      }
    }
  }
  
  return result;
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
  const paddedData = [...dataCodewords, ...new Array(ecCodewordCount).fill(0)];
  const result = performPolynomialDivision(paddedData, generator);
  
  return result.slice(dataCodewords.length);
};

/**
 * 비트 스트림을 8비트 코드워드 배열로 변환
 */
export const bitStreamToCodewords = (bitStream: string): number[] => {
  const matches = bitStream.match(/.{1,8}/g) || [];
  return matches.map((byte) => parseInt(byte.padEnd(8, '0'), 2));
};

/**
 * 블록들의 인터리빙 헬퍼 함수
 */
const interleaveBlocks = (blocks: number[][]): number[] => {
  const result: number[] = [];
  const maxLength = Math.max(...blocks.map(block => block.length));
  
  for (let i = 0; i < maxLength; i++) {
    for (const block of blocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }
  
  return result;
};

/**
 * 인터리빙: 데이터 블록과 에러 정정 블록을 최종 순서로 배치
 * ISO/IEC 18004 8.6 (line 1289-1334)
 */
export const interleaveCodewords = (
  dataBlocks: number[][],
  ecBlocks: number[][]
): number[] => [
  ...interleaveBlocks(dataBlocks),
  ...interleaveBlocks(ecBlocks)
];