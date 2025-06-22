import { GaloisField256 } from '../utils/galoisField';
import { evaluatePolynomial, calculateErrorEvaluatorPolynomial } from '../utils/polynomial';

/**
 * Forney 알고리즘으로 에러 값 계산
 */
export const calculateErrorMagnitudes = (
  syndromes: number[],
  errorLocator: number[],
  errorPositions: number[]
): number[] => {
  // 에러 평가 다항식 Ω(x) = S(x) * Λ(x) mod x^(2t)
  const omega = calculateErrorEvaluatorPolynomial(syndromes, errorLocator);
  
  // 에러 위치 다항식의 도함수 Λ'(x)
  const derivative = calculateDerivative(errorLocator);
  
  const errorMagnitudes: number[] = [];
  
  for (const position of errorPositions) {
    const alphaInv = GaloisField256.getExp((255 - position) % 255);
    
    // 에러 값 = -Ω(α^(-i)) / Λ'(α^(-i))
    const omegaValue = evaluatePolynomial(omega, alphaInv);
    const derivativeValue = evaluatePolynomial(derivative, alphaInv);
    
    if (derivativeValue === 0) {
      throw new Error('에러 위치 다항식의 도함수가 0입니다');
    }
    
    const errorValue = GaloisField256.divide(omegaValue, derivativeValue);
    
    errorMagnitudes.push(errorValue);
  }
  
  return errorMagnitudes;
};

/**
 * 다항식의 도함수 계산 (형식적 도함수)
 */
const calculateDerivative = (polynomial: number[]): number[] => {
  const derivative: number[] = [];
  
  // f'(x) = sum(i * a_i * x^(i-1))
  // GF(256)에서 i가 홀수일 때만 계수가 남음
  for (let i = 1; i < polynomial.length; i++) {
    if (i % 2 === 1) {
      derivative.push(polynomial[i]);
    } else {
      derivative.push(0);
    }
  }
  
  return derivative;
};