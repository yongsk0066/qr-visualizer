import { GaloisField256 } from './galoisField';

/**
 * 다항식을 특정 점에서 평가
 */
export const evaluatePolynomial = (
  polynomial: number[],
  x: number
): number => {
  let result = 0;
  
  for (let i = 0; i < polynomial.length; i++) {
    if (polynomial[i] !== 0) {
      const power = GaloisField256.getExp((i * GaloisField256.getLog(x)) % 255);
      const product = GaloisField256.multiply(polynomial[i], power);
      result ^= product; // XOR는 갈루아 필드에서의 덧셈
    }
  }
  
  return result;
};

/**
 * 에러 평가 다항식 계산 (Ω(x) = S(x) * Λ(x) mod x^(2t))
 */
export const calculateErrorEvaluatorPolynomial = (
  syndromes: number[],
  errorLocator: number[]
): number[] => {
  const degree = syndromes.length;
  const omega: number[] = new Array(degree).fill(0);
  
  // 다항식 곱셈: S(x) * Λ(x)
  for (let i = 0; i < syndromes.length; i++) {
    for (let j = 0; j < errorLocator.length; j++) {
      const index = i + j;
      if (index < degree) {
        const product = GaloisField256.multiply(syndromes[i], errorLocator[j]);
        omega[index] ^= product; // XOR는 갈루아 필드에서의 덧셈
      }
    }
  }
  
  return omega;
};