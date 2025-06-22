import { GaloisField256 } from '../utils/galoisField';

/**
 * Berlekamp-Massey 알고리즘으로 에러 위치 다항식 계산
 * ISO/IEC 18004 표준에 맞는 개선된 구현
 * Λ(x) = 1 + Λ_1*x + Λ_2*x^2 + ... + Λ_v*x^v
 */
export const findErrorLocatorPolynomial = (
  syndromes: number[]
): number[] | null => {
  const n = syndromes.length;
  
  // 모든 신드롬이 0이면 에러 없음
  if (syndromes.every(s => s === 0)) {
    return [1]; // Λ(x) = 1 (에러 없음)
  }
  
  // 초기화
  let lambda = [1]; // 현재 에러 위치 다항식 Λ(x)
  let b = [1]; // 보조 다항식 B(x)  
  let l = 0; // 현재 길이 (degree)
  let m = 1; // 마지막 업데이트 이후 단계 수
  let bGamma = 1; // 마지막 불일치도
  
  for (let r = 0; r < n; r++) {
    // 불일치도 계산: δ_r = S_r + λ_1*S_(r-1) + ... + λ_l*S_(r-l)
    let delta = syndromes[r];
    
    for (let i = 1; i < lambda.length && r - i >= 0; i++) {
      delta ^= GaloisField256.multiply(lambda[i], syndromes[r - i]);
    }
    
    if (delta === 0) {
      // 불일치도가 0이면 다음으로
      m++;
      continue;
    }
    
    // T(x) = Λ(x) - (δ/γ) * x^m * B(x)
    const t = [...lambda];
    const coefficient = GaloisField256.divide(delta, bGamma);
    
    // 필요한 길이 계산
    const newLength = Math.max(lambda.length, b.length + m);
    const newLambda = new Array(newLength).fill(0);
    
    // 기존 Λ(x) 복사
    for (let i = 0; i < lambda.length; i++) {
      newLambda[i] = lambda[i];
    }
    
    // (δ/γ) * x^m * B(x) 빼기
    for (let i = 0; i < b.length; i++) {
      if (i + m < newLength) {
        newLambda[i + m] ^= GaloisField256.multiply(coefficient, b[i]);
      }
    }
    
    // 조건 확인: 2l <= r
    if (2 * l <= r) {
      l = r + 1 - l;
      b = [...t];
      bGamma = delta;
      m = 1;
    } else {
      m++;
    }
    
    lambda = newLambda;
  }
  
  // 뒤쪽 0 제거
  while (lambda.length > 1 && lambda[lambda.length - 1] === 0) {
    lambda.pop();
  }
  
  return lambda.length > 0 ? lambda : null;
};

/**
 * 에러 위치 찾기 (Chien search algorithm)
 * ISO/IEC 18004 표준에 맞는 개선된 구현
 */
export const findErrorPositions = (
  errorLocator: number[],
  messageLength: number
): number[] => {
  const errorPositions: number[] = [];
  
  // 에러 위치 다항식이 [1]이면 에러 없음
  if (errorLocator.length === 1 && errorLocator[0] === 1) {
    return [];
  }
  
  // 각 위치 α^(-i)에서 에러 위치 다항식 Λ(x) 평가
  // Λ(α^(-i)) = 0이면 위치 i에 에러가 있음
  for (let i = 0; i < messageLength; i++) {
    let sum = 0;
    
    // Λ(α^(-i)) = λ_0 + λ_1*α^(-i) + λ_2*α^(-2i) + ... 
    for (let j = 0; j < errorLocator.length; j++) {
      const exponent = (255 - (i * j) % 255) % 255; // α^(-i*j)
      const alphaValue = exponent === 0 ? 1 : GaloisField256.getExp(exponent);
      const product = GaloisField256.multiply(errorLocator[j], alphaValue);
      sum ^= product; // GF에서 덧셈은 XOR
    }
    
    // 다항식 값이 0이면 해당 위치에 에러
    if (sum === 0) {
      errorPositions.push(i);
    }
  }
  
  return errorPositions;
};