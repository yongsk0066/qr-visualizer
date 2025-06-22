import { GaloisField256 } from '../utils/galoisField';

/**
 * Reed-Solomon 신드롬 계산
 * 신드롬이 모두 0이면 에러 없음
 */
export const calculateSyndrome = (
  codewords: number[],
  ecCodewordCount: number
): number[] => {
  const syndromes: number[] = [];
  
  // S_i = r(α^i) for i = 0 to ecCodewordCount-1
  for (let i = 0; i < ecCodewordCount; i++) {
    let syndrome = 0;
    
    // 다항식 평가: r(x) at x = α^i
    for (let j = 0; j < codewords.length; j++) {
      const alphaToJI = GaloisField256.getExp((j * i) % 255);
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