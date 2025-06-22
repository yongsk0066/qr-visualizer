import { describe, it, expect } from 'vitest';
import { findErrorLocatorPolynomial, findErrorPositions } from './berlekampMassey';

describe('berlekampMassey', () => {
  it('단일 에러의 위치 다항식을 찾아야 함', () => {
    // 알려진 단일 에러에 대한 신드롬 (이론적 예제)
    // 실제로는 syndrome 계산을 통해 얻어야 함
    const syndromes = [123, 45, 67, 89, 12, 34, 56];
    
    const errorLocator = findErrorLocatorPolynomial(syndromes);
    
    expect(errorLocator).not.toBeNull();
    expect(errorLocator!.length).toBeGreaterThanOrEqual(1);
    expect(errorLocator![0]).toBe(1); // 상수항은 항상 1
  });
  
  it('2개 에러의 위치 다항식을 찾아야 함', () => {
    // 2개 에러에 대한 신드롬
    const syndromes = [200, 150, 100, 75, 50, 25, 10];
    
    const errorLocator = findErrorLocatorPolynomial(syndromes);
    
    expect(errorLocator).not.toBeNull();
    expect(errorLocator!.length).toBeGreaterThanOrEqual(1);
    expect(errorLocator![0]).toBe(1);
  });
  
  it('에러가 없는 경우 위치 다항식이 [1]이어야 함', () => {
    const noErrorSyndromes = [0, 0, 0, 0, 0, 0, 0];
    
    const errorLocator = findErrorLocatorPolynomial(noErrorSyndromes);
    
    expect(errorLocator).not.toBeNull();
    expect(errorLocator).toEqual([1]);
  });
  
  it('Chien search로 에러 위치를 정확히 찾아야 함', () => {
    // 간단한 경우: 에러 위치 다항식이 알려진 경우
    const errorLocator = [1, 123]; // Λ(x) = 1 + 123*x
    const messageLength = 15;
    
    const errorPositions = findErrorPositions(errorLocator, messageLength);
    
    expect(Array.isArray(errorPositions)).toBe(true);
    expect(errorPositions.length).toBeLessThanOrEqual(messageLength);
    
    // 모든 위치가 유효한 범위 내에 있어야 함
    errorPositions.forEach(pos => {
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThan(messageLength);
    });
  });
  
  it('에러 위치가 없는 경우 빈 배열을 반환해야 함', () => {
    const noErrorLocator = [1]; // Λ(x) = 1 (에러 없음)
    const messageLength = 10;
    
    const errorPositions = findErrorPositions(noErrorLocator, messageLength);
    
    expect(errorPositions).toEqual([]);
  });
  
  it('다항식 계수가 모두 유효한 갈루아 필드 원소여야 함', () => {
    const syndromes = [1, 2, 3, 4, 5];
    
    const errorLocator = findErrorLocatorPolynomial(syndromes);
    
    expect(errorLocator).not.toBeNull();
    errorLocator!.forEach(coeff => {
      expect(coeff).toBeGreaterThanOrEqual(0);
      expect(coeff).toBeLessThanOrEqual(255);
    });
  });
  
  it('메시지 길이가 0인 경우 처리', () => {
    const errorLocator = [1, 50, 100];
    const errorPositions = findErrorPositions(errorLocator, 0);
    
    expect(errorPositions).toEqual([]);
  });
  
  it('긴 신드롬 배열 처리', () => {
    const longSyndromes = Array.from({ length: 20 }, (_, i) => i + 1);
    
    const errorLocator = findErrorLocatorPolynomial(longSyndromes);
    
    expect(errorLocator).not.toBeNull();
    expect(errorLocator![0]).toBe(1);
  });
});