import { GaloisField256 as GF } from './galoisField';

/**
 * 갈루아 필드에서 다항식 곱셈
 */
const multiplyPolynomials = (a: number[], b: number[]): number[] => {
  const result = new Array(a.length + b.length - 1).fill(0);

  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] ^= GF.multiply(a[i], b[j]);
    }
  }

  return result;
};

/**
 * 다항식 나눗셈 (Reed-Solomon 알고리즘 핵심)
 */
const dividePolynomial = (dividend: number[], generator: number[]): number[] => {
  const result = [...dividend];

  for (let i = 0; i < dividend.length - generator.length + 1; i++) {
    const coefficient = result[i];
    if (coefficient !== 0) {
      for (let j = 0; j < generator.length; j++) {
        result[i + j] ^= GF.multiply(generator[j], coefficient);
      }
    }
  }

  return result;
};

/**
 * Reed-Solomon 생성 다항식 생성
 * 차수 n에 대해 (x - α^0)(x - α^1)...(x - α^(n-1)) 계산
 * ISO/IEC 18004 표 A.1-A.7 (line 1888-1917)
 */
export const createGeneratorPolynomial = (degree: number): number[] => {
  let result = [1];

  for (let i = 0; i < degree; i++) {
    result = multiplyPolynomials(result, [1, GF.getExp(i)]);
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
  const generator = createGeneratorPolynomial(ecCodewordCount);
  const paddedData = [...dataCodewords, ...new Array(ecCodewordCount).fill(0)];
  const remainder = dividePolynomial(paddedData, generator);

  return remainder.slice(dataCodewords.length);
};
