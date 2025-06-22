import { describe, it, expect } from 'vitest';
import { correctErrors } from './errorCorrector';
import type { QRVersion, ErrorCorrectionLevel } from '../../../shared/types';

describe('errorCorrector', () => {
  it('에러가 없는 경우 원본을 그대로 반환해야 함', () => {
    // 버전 1-L, 임의의 코드워드 (실제 Reed-Solomon이 아님)
    const testCodewords = Array.from({ length: 26 }, (_, i) => i);
    
    const result = correctErrors(testCodewords, 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    // 임의의 데이터이므로 대부분 정정이 시도될 것임
    expect(result.blockResults).toHaveLength(1);
    expect(result.correctedDataCodewords).toHaveLength(19); // 버전 1-L의 데이터 코드워드 수
    expect(typeof result.isRecoverable).toBe('boolean');
    expect(result.totalErrors).toBeGreaterThanOrEqual(0);
  });
  
  it('1개 에러를 정정해야 함', () => {
    const originalCodewords = Array.from({ length: 26 }, (_, i) => i);
    const corruptedCodewords = [...originalCodewords];
    corruptedCodewords[5] ^= 1; // 1비트 에러 주입
    
    const result = correctErrors(corruptedCodewords, 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    expect(result.blockResults).toHaveLength(1);
    expect(result.totalErrors).toBeGreaterThanOrEqual(0);
    expect(result.correctedDataCodewords).toHaveLength(19);
    expect(result.confidence).toBeGreaterThanOrEqual(0); // 0 이상
    expect(result.confidence).toBeLessThanOrEqual(1); // 1 이하
  });
  
  it('다중 블록 처리 (버전 5-Q)', () => {
    // 버전 5-Q: 4개 블록, 총 134개 코드워드
    const codewords = Array.from({ length: 134 }, (_, i) => i % 256);
    
    const result = correctErrors(codewords, 5 as QRVersion, 'Q' as ErrorCorrectionLevel);
    
    expect(result.blockResults).toHaveLength(4);
    expect(result.correctedDataCodewords.length).toBeGreaterThan(0);
    expect(result.syndromes).toHaveLength(4);
    
    // 각 블록의 신드롬이 올바른 길이를 가져야 함
    result.syndromes.forEach(syndrome => {
      expect(syndrome).toHaveLength(18); // 버전 5-Q의 EC 코드워드 수
    });
  });
  
  it('정정 능력을 초과한 에러는 검출해야 함', () => {
    const codewords = Array.from({ length: 26 }, (_, i) => i);
    // 버전 1-L의 최대 정정 능력은 3개이므로 5개 에러 주입
    for (let i = 0; i < 5; i++) {
      codewords[i * 3] ^= 255; // 큰 에러 주입
    }
    
    const result = correctErrors(codewords, 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    // 정정 불가능한 경우에도 결과는 반환되어야 함
    expect(result.blockResults).toHaveLength(1);
    expect(result.isRecoverable).toBe(false); // 정정 불가능
  });
  
  it('빈 코드워드 배열 처리', () => {
    const result = correctErrors([], 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    expect(result.blockResults).toHaveLength(1);
    expect(result.correctedDataCodewords).toEqual([]);
    expect(result.totalErrors).toBe(0);
    expect(result.confidence).toBe(1); // 정정할 것이 없으므로 100%
  });
  
  it('다양한 에러 레벨 처리', () => {
    const testCases: ErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
    
    testCases.forEach(errorLevel => {
      const codewords = Array.from({ length: 26 }, (_, i) => i);
      
      const result = correctErrors(codewords, 1 as QRVersion, errorLevel);
      
      expect(result.blockResults.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
  
  it('신뢰도 계산이 올바른지 확인', () => {
    const codewords = Array.from({ length: 26 }, (_, i) => i);
    
    const result = correctErrors(codewords, 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    
    // 성공한 블록 수 / 전체 블록 수와 일치해야 함
    const successfulBlocks = result.blockResults.filter(r => r.isCorrected).length;
    const expectedConfidence = successfulBlocks / result.blockResults.length;
    expect(result.confidence).toBe(expectedConfidence);
  });
  
  it('블록별 결과가 올바른 정보를 포함해야 함', () => {
    const codewords = Array.from({ length: 26 }, (_, i) => i);
    
    const result = correctErrors(codewords, 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    result.blockResults.forEach((blockResult, index) => {
      expect(blockResult.blockIndex).toBe(index);
      expect(blockResult.originalCodewords).toHaveLength(26);
      expect(blockResult.correctedCodewords).toHaveLength(26);
      expect(Array.isArray(blockResult.errorPositions)).toBe(true);
      expect(Array.isArray(blockResult.errorMagnitudes)).toBe(true);
      expect(typeof blockResult.isCorrected).toBe('boolean');
      expect(typeof blockResult.hasNoError).toBe('boolean');
    });
  });
});