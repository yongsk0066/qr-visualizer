import { describe, it, expect } from 'vitest';
import { deinterleaveCodewords } from './deinterleaver';
import type { QRVersion, ErrorCorrectionLevel } from '../../../../shared/types';

describe('deinterleaver', () => {
  it('버전 1-L의 인터리빙된 코드워드를 올바르게 분리해야 함', () => {
    // 버전 1-L: 1개 블록, 데이터 19개 + EC 7개 = 총 26개
    const codewords = Array.from({ length: 26 }, (_, i) => i);
    const result = deinterleaveCodewords(codewords, 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    expect(result.blocks).toHaveLength(1);
    expect(result.dataCodewordsPerBlock).toEqual([19]);
    expect(result.ecCodewordsPerBlock).toEqual([7]);
    expect(result.blocks[0]).toHaveLength(26);
    expect(result.blocks[0]).toEqual(codewords);
  });
  
  it('버전 5-Q의 다중 블록을 올바르게 분리해야 함', () => {
    // 버전 5-Q: 4개 블록
    // 그룹 1: 2블록 × (데이터 15 + EC 18) = 2 × 33 = 66
    // 그룹 2: 2블록 × (데이터 16 + EC 18) = 2 × 34 = 68
    // 총 134개 코드워드
    const totalCodewords = 134;
    const codewords = Array.from({ length: totalCodewords }, (_, i) => i);
    
    const result = deinterleaveCodewords(codewords, 5 as QRVersion, 'Q' as ErrorCorrectionLevel);
    
    expect(result.blocks).toHaveLength(4);
    expect(result.dataCodewordsPerBlock).toEqual([15, 15, 16, 16]);
    expect(result.ecCodewordsPerBlock).toEqual([18, 18, 18, 18]);
    
    // 각 블록의 총 크기 확인
    expect(result.blocks[0]).toHaveLength(33); // 15 + 18
    expect(result.blocks[1]).toHaveLength(33); // 15 + 18
    expect(result.blocks[2]).toHaveLength(34); // 16 + 18
    expect(result.blocks[3]).toHaveLength(34); // 16 + 18
  });
  
  it('인터리빙 순서가 올바른지 확인', () => {
    // 간단한 케이스로 버전 2-L 테스트
    // 1개 블록, 데이터 34개 + EC 10개 = 총 44개
    const codewords = Array.from({ length: 44 }, (_, i) => i + 100);
    const result = deinterleaveCodewords(codewords, 2 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toEqual(codewords);
    
    // 데이터 부분과 EC 부분 분리 확인
    const dataCodewords = result.blocks[0].slice(0, 34);
    const ecCodewords = result.blocks[0].slice(34);
    
    expect(dataCodewords).toHaveLength(34);
    expect(ecCodewords).toHaveLength(10);
  });
  
  it('빈 코드워드 배열 처리', () => {
    const result = deinterleaveCodewords([], 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toHaveLength(0);
  });
  
  it('부족한 코드워드 처리', () => {
    // 버전 1-L은 26개가 필요하지만 10개만 제공
    const codewords = Array.from({ length: 10 }, (_, i) => i);
    const result = deinterleaveCodewords(codewords, 1 as QRVersion, 'L' as ErrorCorrectionLevel);
    
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toHaveLength(10);
    expect(result.blocks[0]).toEqual(codewords);
  });
});