import { GaloisField256 } from '../utils/galoisField';
import { evaluatePolynomial, calculateErrorEvaluatorPolynomial } from '../utils/polynomial';

/**
 * Forney 알고리즘으로 에러 값 계산
 * ISO/IEC 18004 표준에 맞는 개선된 구현
 */
export const calculateErrorMagnitudes = (
  syndromes: number[],
  errorLocator: number[],
  errorPositions: number[]
): number[] => {
  if (errorPositions.length === 0) {
    return [];
  }
  
  // 에러 평가 다항식 Ω(x) = S(x) * Λ(x) mod x^(2t)
  const omega = calculateErrorEvaluatorPolynomial(syndromes, errorLocator);
  
  const errorMagnitudes: number[] = [];
  
  for (const position of errorPositions) {
    // α^(-i) 계산
    const alphaInv = GaloisField256.getExp((255 - position) % 255);
    
    // Ω(α^(-i)) 계산
    const omegaValue = evaluatePolynomial(omega, alphaInv);
    
    // Λ'(α^(-i)) 계산 (Forney's formula)
    let derivativeValue = 0;
    for (let j = 1; j < errorLocator.length; j += 2) {
      // GF(2)에서 형식적 도함수: 홀수 차수만 남음
      const term = GaloisField256.multiply(
        errorLocator[j], 
        GaloisField256.getExp((j * (255 - position)) % 255)
      );
      derivativeValue ^= term;
    }
    
    if (derivativeValue === 0) {
      // 도함수가 0이면 다른 방법 시도: 직접 계산
      derivativeValue = 1;
      for (let k = 0; k < errorPositions.length; k++) {
        if (k !== errorPositions.indexOf(position)) {
          const otherPos = errorPositions[k];
          const alphaOther = GaloisField256.getExp((255 - otherPos) % 255);
          const diff = alphaInv ^ alphaOther; // GF에서 차이는 XOR
          if (diff !== 0) {
            derivativeValue = GaloisField256.multiply(derivativeValue, diff);
          }
        }
      }
    }
    
    if (derivativeValue === 0) {
      throw new Error(`Forney 알고리즘 실패: 위치 ${position}에서 도함수가 0`);
    }
    
    // 에러 값 = Ω(α^(-i)) / Λ'(α^(-i))
    // QR 코드에서는 음수 부호가 필요 없음 (GF(2)에서 -1 = 1)
    const errorValue = GaloisField256.divide(omegaValue, derivativeValue);
    
    errorMagnitudes.push(errorValue);
  }
  
  return errorMagnitudes;
};

