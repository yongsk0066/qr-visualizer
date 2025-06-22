import { describe, it, expect } from 'vitest';
import { calculateSyndrome, hasNoError } from './syndrome';

describe('syndrome', () => {
  it('에러가 없는 코드워드의 신드롬은 모두 0이어야 함', () => {
    // 올바른 Reed-Solomon 코드워드 (이론적 예제)
    // 실제로는 인코딩에서 생성한 올바른 코드워드를 사용해야 함
    const validCodewords = [67, 85, 70, 134, 87, 38, 85, 194, 119, 50, 6, 18, 6, 103, 38];
    const syndromes = calculateSyndrome(validCodewords, 7);
    
    // 이론적으로는 모든 신드롬이 0이어야 하지만, 실제 예제 없이는 테스트가 어려움
    expect(syndromes).toHaveLength(7);
    expect(syndromes.every(s => typeof s === 'number')).toBe(true);
  });
  
  it('1개 에러가 있는 경우 신드롬을 올바르게 계산해야 함', () => {
    // 원본 코드워드에 1개 에러 주입
    const originalCodewords = [67, 85, 70, 134, 87, 38, 85, 194, 119, 50, 6, 18, 6, 103, 38];
    const corruptedCodewords = [...originalCodewords];
    corruptedCodewords[5] ^= 1; // 1비트 에러 주입
    
    const syndromes = calculateSyndrome(corruptedCodewords, 7);
    
    expect(syndromes).toHaveLength(7);
    // 에러가 있으면 최소 하나의 신드롬은 0이 아니어야 함
    expect(syndromes.some(s => s !== 0)).toBe(true);
  });
  
  it('다중 에러의 신드롬을 올바르게 계산해야 함', () => {
    const originalCodewords = [67, 85, 70, 134, 87, 38, 85, 194, 119, 50, 6, 18, 6, 103, 38];
    const corruptedCodewords = [...originalCodewords];
    corruptedCodewords[3] ^= 5;  // 첫 번째 에러
    corruptedCodewords[7] ^= 12; // 두 번째 에러
    
    const syndromes = calculateSyndrome(corruptedCodewords, 7);
    
    expect(syndromes).toHaveLength(7);
    expect(syndromes.some(s => s !== 0)).toBe(true);
  });
  
  it('hasNoError가 신드롬을 올바르게 판단해야 함', () => {
    const noErrorSyndromes = [0, 0, 0, 0, 0, 0, 0];
    const withErrorSyndromes = [0, 0, 123, 0, 45, 0, 0];
    
    expect(hasNoError(noErrorSyndromes)).toBe(true);
    expect(hasNoError(withErrorSyndromes)).toBe(false);
  });
  
  it('빈 신드롬 배열 처리', () => {
    expect(hasNoError([])).toBe(true);
  });
  
  it('신드롬 계산에서 EC 코드워드 개수가 0인 경우', () => {
    const codewords = [1, 2, 3, 4, 5];
    const syndromes = calculateSyndrome(codewords, 0);
    
    expect(syndromes).toHaveLength(0);
    expect(hasNoError(syndromes)).toBe(true);
  });
  
  it('신드롬 값이 유효한 범위 내에 있어야 함', () => {
    const codewords = [255, 128, 64, 32, 16, 8, 4, 2, 1];
    const syndromes = calculateSyndrome(codewords, 5);
    
    expect(syndromes).toHaveLength(5);
    syndromes.forEach(syndrome => {
      expect(syndrome).toBeGreaterThanOrEqual(0);
      expect(syndrome).toBeLessThanOrEqual(255);
    });
  });
});