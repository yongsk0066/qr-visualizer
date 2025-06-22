/**
 * 바이트 모드 디코더
 * ISO/IEC 18004 Section 7.4.5
 */

import type { BitStream } from '../types';
import { readBits } from '../utils/bitStream';

/**
 * 바이트 모드 디코딩
 * - 각 바이트를 8비트로 직접 인코딩
 * - UTF-8 디코딩 지원
 */
export const decodeByte = (bitStream: BitStream, count: number): { data: string; bits: string; bytes: number[] } | null => {
  const bytes: number[] = [];
  let bits = '';
  const savedPosition = bitStream.position;
  
  // 각 바이트 읽기
  for (let i = 0; i < count; i++) {
    const value = readBits(bitStream, 8);
    if (value === null) {
      bitStream.position = savedPosition;
      return null;
    }
    
    bytes.push(value);
    bits += value.toString(2).padStart(8, '0');
  }
  
  // UTF-8 디코딩 시도
  try {
    const uint8Array = new Uint8Array(bytes);
    const decoder = new TextDecoder('utf-8');
    const data = decoder.decode(uint8Array);
    
    return { data, bits, bytes };
  } catch {
    // UTF-8 디코딩 실패 시 ISO-8859-1로 폴백
    const data = bytes.map(byte => String.fromCharCode(byte)).join('');
    return { data, bits, bytes };
  }
};