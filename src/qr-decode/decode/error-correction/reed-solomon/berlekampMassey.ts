import { GaloisField256 } from '../utils/galoisField';

/**
 * Berlekamp-Massey 알고리즘으로 에러 위치 다항식 계산
 * Λ(x) = 1 + Λ_1*x + Λ_2*x^2 + ... + Λ_v*x^v
 */
export const findErrorLocatorPolynomial = (
  syndromes: number[]
): number[] | null => {
  const n = syndromes.length;
  
  // 초기화
  let errorLocator = [1]; // Λ(x) = 1
  let oldLocator = [1];
  let discrepancyDegree = 1;
  
  for (let i = 0; i < n; i++) {
    // 불일치도(discrepancy) 계산
    let discrepancy = syndromes[i];
    
    for (let j = 1; j < errorLocator.length; j++) {
      if (i - j >= 0) {
        const product = GaloisField256.multiply(errorLocator[j], syndromes[i - j]);
        discrepancy ^= product; // XOR는 갈루아 필드에서의 덧셈
      }
    }
    
    if (discrepancy !== 0) {
      // 에러 위치 다항식 업데이트
      const newLocator = [...errorLocator];
      
      // Λ(x) = Λ(x) - d * x^m * B(x)
      for (let j = 0; j < oldLocator.length; j++) {
        const index = j + discrepancyDegree;
        const product = GaloisField256.multiply(discrepancy, oldLocator[j]);
        if (index < newLocator.length) {
          newLocator[index] ^= product;
        } else {
          newLocator.push(product);
        }
      }
      
      // 조건에 따라 B(x) 업데이트
      if (2 * errorLocator.length <= i + 1) {
        const invDiscrepancy = GaloisField256.inverse(discrepancy);
        oldLocator = errorLocator.map(coefficient => GaloisField256.multiply(coefficient, invDiscrepancy));
        discrepancyDegree = 1;
      } else {
        discrepancyDegree++;
      }
      
      errorLocator = newLocator;
    } else {
      discrepancyDegree++;
    }
  }
  
  return errorLocator;
};

/**
 * 에러 위치 찾기 (Chien search)
 */
export const findErrorPositions = (
  errorLocator: number[],
  messageLength: number
): number[] => {
  const errorPositions: number[] = [];
  
  // 각 위치에서 에러 위치 다항식 평가
  for (let i = 0; i < messageLength; i++) {
    let sum = 0;
    
    for (let j = 0; j < errorLocator.length; j++) {
      const product = GaloisField256.multiply(errorLocator[j], GaloisField256.getExp((j * i) % 255));
      sum ^= product; // XOR는 갈루아 필드에서의 덧셈
    }
    
    // Λ(α^(-i)) = 0이면 i 위치에 에러
    if (sum === 0) {
      errorPositions.push(messageLength - 1 - i);
    }
  }
  
  return errorPositions;
};