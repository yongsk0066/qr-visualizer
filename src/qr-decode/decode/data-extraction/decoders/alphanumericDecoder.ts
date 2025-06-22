/**
 * 영숫자 모드 디코더
 * ISO/IEC 18004 Section 7.4.4
 */

import type { BitStream } from '../types';
import { readBits } from '../utils/bitStream';

/**
 * 영숫자 모드 문자 테이블
 * ISO/IEC 18004 Table 5
 */
const ALPHANUMERIC_TABLE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/**
 * 영숫자 모드 디코딩
 * - 2문자씩: 11비트 (첫 문자 × 45 + 두 번째 문자)
 * - 1문자: 6비트
 */
export const decodeAlphanumeric = (bitStream: BitStream, count: number): { data: string; bits: string } | null => {
  let result = '';
  let bits = '';
  let remaining = count;
  const savedPosition = bitStream.position;
  
  // 2문자씩 처리
  while (remaining >= 2) {
    const value = readBits(bitStream, 11);
    if (value === null) {
      bitStream.position = savedPosition;
      return null;
    }
    
    // 값을 45로 나누어 두 문자의 인덱스 계산
    const firstCharIndex = Math.floor(value / 45);
    const secondCharIndex = value % 45;
    
    // 유효한 인덱스인지 확인
    if (firstCharIndex >= ALPHANUMERIC_TABLE.length || secondCharIndex >= ALPHANUMERIC_TABLE.length) {
      bitStream.position = savedPosition;
      return null;
    }
    
    result += ALPHANUMERIC_TABLE[firstCharIndex] + ALPHANUMERIC_TABLE[secondCharIndex];
    bits += value.toString(2).padStart(11, '0');
    remaining -= 2;
  }
  
  // 1문자 처리
  if (remaining === 1) {
    const value = readBits(bitStream, 6);
    if (value === null) {
      bitStream.position = savedPosition;
      return null;
    }
    
    // 유효한 인덱스인지 확인
    if (value >= ALPHANUMERIC_TABLE.length) {
      bitStream.position = savedPosition;
      return null;
    }
    
    result += ALPHANUMERIC_TABLE[value];
    bits += value.toString(2).padStart(6, '0');
  }
  
  return { data: result, bits };
};