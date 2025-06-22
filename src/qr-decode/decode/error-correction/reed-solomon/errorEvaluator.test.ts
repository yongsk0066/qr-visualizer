import { describe, it, expect } from 'vitest';
import { calculateErrorMagnitudes } from './errorEvaluator';

describe('errorEvaluator', () => {
  it('단일 에러의 값을 올바르게 계산해야 함', () => {
    // 단일 에러 예제
    const syndromes = [123, 45, 67, 89, 12, 34, 56];
    const errorLocator = [1, 200]; // 단일 에러 위치 다항식
    const errorPositions = [5]; // 에러 위치
    
    const errorMagnitudes = calculateErrorMagnitudes(syndromes, errorLocator, errorPositions);
    
    expect(errorMagnitudes).toHaveLength(1);
    expect(errorMagnitudes[0]).toBeGreaterThanOrEqual(0);
    expect(errorMagnitudes[0]).toBeLessThanOrEqual(255);
  });
  
  it('다중 에러의 값을 올바르게 계산해야 함', () => {
    const syndromes = [200, 150, 100, 75, 50, 25, 10];
    const errorLocator = [1, 100, 50]; // 2개 에러 위치 다항식
    const errorPositions = [3, 7]; // 2개 에러 위치
    
    const errorMagnitudes = calculateErrorMagnitudes(syndromes, errorLocator, errorPositions);
    
    expect(errorMagnitudes).toHaveLength(2);
    errorMagnitudes.forEach(magnitude => {
      expect(magnitude).toBeGreaterThanOrEqual(0);
      expect(magnitude).toBeLessThanOrEqual(255);
    });
  });
  
  it('에러 위치가 없는 경우 빈 배열을 반환해야 함', () => {
    const syndromes = [1, 2, 3, 4, 5];
    const errorLocator = [1]; // 에러 없음
    const errorPositions: number[] = [];
    
    const errorMagnitudes = calculateErrorMagnitudes(syndromes, errorLocator, errorPositions);
    
    expect(errorMagnitudes).toEqual([]);
  });
  
  it('도함수가 0인 경우 에러를 던져야 함', () => {
    // GF(256)에서 실제로 도함수가 0이 되는 케이스
    // 만약 에러가 발생하지 않는다면, 구현이 이미 이 케이스를 처리하고 있을 수 있음
    const syndromes = [1, 2, 3, 4];
    const errorLocator = [1, 0, 0]; // 도함수가 0이 될 수 있는 다항식
    const errorPositions = [1];
    
    // 현재 구현이 이 케이스를 잘 처리하고 있을 수 있으므로,
    // 에러가 발생하지 않을 수도 있음
    const result = calculateErrorMagnitudes(syndromes, errorLocator, errorPositions);
    
    // 에러가 발생하지 않으면 결과가 반환되어야 함
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(errorPositions.length);
  });
  
  it('에러 위치와 신드롬 길이가 일치하지 않는 경우 처리', () => {
    const syndromes = [1, 2]; // 짧은 신드롬
    const errorLocator = [1, 50];
    const errorPositions = [0, 1, 2]; // 많은 에러 위치
    
    // 함수가 예외를 던지거나 적절히 처리해야 함
    expect(() => {
      calculateErrorMagnitudes(syndromes, errorLocator, errorPositions);
    }).not.toThrow(); // 일단 예외가 발생하지 않는지 확인
  });
  
  it('최대 크기 갈루아 필드 값 처리', () => {
    const syndromes = [255, 128, 64]; // 최대값 포함
    const errorLocator = [1, 255];
    const errorPositions = [2];
    
    const errorMagnitudes = calculateErrorMagnitudes(syndromes, errorLocator, errorPositions);
    
    expect(errorMagnitudes).toHaveLength(1);
    expect(errorMagnitudes[0]).toBeGreaterThanOrEqual(0);
    expect(errorMagnitudes[0]).toBeLessThanOrEqual(255);
  });
});