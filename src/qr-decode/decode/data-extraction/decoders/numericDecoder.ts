/**
 * 숫자 모드 디코더
 * ISO/IEC 18004 Section 7.4.3
 */

import { pipe } from '@mobily/ts-belt';
import type { BitStream } from '../types';
import { readBits, readBitString } from '../utils/bitStream';

/**
 * 숫자 모드 디코딩
 * - 3자리씩: 10비트 (000-999)
 * - 2자리: 7비트 (00-99)
 * - 1자리: 4비트 (0-9)
 */
export const decodeNumeric = (bitStream: BitStream, count: number): { data: string; bits: string } | null => {
  let result = '';
  let bits = '';
  let remaining = count;
  const savedPosition = bitStream.position;
  
  // 3자리씩 처리
  while (remaining >= 3) {
    const value = readBits(bitStream, 10);
    if (value === null) {
      bitStream.position = savedPosition; // 실패 시 위치 복원
      return null;
    }
    
    // 999를 초과하면 에러
    if (value > 999) {
      bitStream.position = savedPosition;
      return null;
    }
    
    result += value.toString().padStart(3, '0');
    bits += value.toString(2).padStart(10, '0');
    remaining -= 3;
  }
  
  // 2자리 처리
  if (remaining === 2) {
    const value = readBits(bitStream, 7);
    if (value === null) {
      bitStream.position = savedPosition;
      return null;
    }
    
    // 99를 초과하면 에러
    if (value > 99) {
      bitStream.position = savedPosition;
      return null;
    }
    
    result += value.toString().padStart(2, '0');
    bits += value.toString(2).padStart(7, '0');
  }
  // 1자리 처리
  else if (remaining === 1) {
    const value = readBits(bitStream, 4);
    if (value === null) {
      bitStream.position = savedPosition;
      return null;
    }
    
    // 9를 초과하면 에러
    if (value > 9) {
      bitStream.position = savedPosition;
      return null;
    }
    
    result += value.toString();
    bits += value.toString(2).padStart(4, '0');
  }
  
  return { data: result, bits };
};