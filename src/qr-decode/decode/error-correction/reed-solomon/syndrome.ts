import { GaloisField256 } from '../utils/galoisField';

/**
 * Reed-Solomon 신드롬 계산
 * ISO/IEC 18004 부속서 B.1.2에 따라 S_i = r(α^i) 계산
 * 신드롬이 모두 0이면 에러 없음
 */
export const calculateSyndrome = (
  codewords: number[],
  ecCodewordCount: number
): number[] => {
  const syndromes: number[] = [];
  
  // S_i = r(α^i) for i = 0 to ecCodewordCount-1  
  // QR 코드는 MSB first 순서 사용: 높은 차수부터 낮은 차수로 평가
  for (let i = 0; i < ecCodewordCount; i++) {
    let syndrome = 0;
    
    // 다항식 평가: r(x) at x = α^i (MSB first 순서)
    // r(x) = c_0*x^(n-1) + c_1*x^(n-2) + ... + c_(n-1)*x^0
    for (let j = 0; j < codewords.length; j++) {
      // MSB first: 첫 번째 코드워드가 최고차항, 마지막이 최저차항
      const power = ((codewords.length - 1 - j) * i) % 255;
      const alphaToJI = power === 0 ? 1 : GaloisField256.getExp(power);
      const product = GaloisField256.multiply(codewords[j], alphaToJI);
      syndrome ^= product; // XOR는 갈루아 필드에서의 덧셈
    }
    
    syndromes.push(syndrome);
  }
  
  return syndromes;
};

/**
 * 신드롬이 모두 0인지 확인
 */
export const hasNoError = (syndromes: number[]): boolean => {
  return syndromes.every(s => s === 0);
};