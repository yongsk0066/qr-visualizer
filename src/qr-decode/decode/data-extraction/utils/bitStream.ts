/**
 * 비트 스트림 유틸리티 함수들
 */

import type { BitStream } from '../types';

/**
 * 코드워드 배열을 비트 스트림으로 변환
 */
export const codewordsToBitStream = (codewords: number[]): BitStream => {
  const bits: number[] = [];
  
  codewords.forEach(codeword => {
    // 각 코드워드를 8비트로 변환
    for (let i = 7; i >= 0; i--) {
      bits.push((codeword >> i) & 1);
    }
  });
  
  return {
    bits,
    position: 0
  };
};

/**
 * 비트 스트림에서 지정된 수의 비트 읽기
 */
export const readBits = (bitStream: BitStream, count: number): number | null => {
  if (bitStream.position + count > bitStream.bits.length) {
    return null; // 읽을 수 있는 비트가 부족함
  }
  
  let value = 0;
  for (let i = 0; i < count; i++) {
    value = (value << 1) | bitStream.bits[bitStream.position++];
  }
  
  return value;
};

/**
 * 비트 스트림에서 문자열로 비트 읽기 (시각화용)
 */
export const readBitString = (bitStream: BitStream, count: number): string | null => {
  if (bitStream.position + count > bitStream.bits.length) {
    return null;
  }
  
  let result = '';
  const startPosition = bitStream.position;
  
  for (let i = 0; i < count; i++) {
    result += bitStream.bits[bitStream.position++].toString();
  }
  
  return result;
};

/**
 * 비트 스트림을 문자열로 변환 (시각화용)
 */
export const bitStreamToString = (bitStream: BitStream): string => {
  return bitStream.bits.join('');
};

/**
 * 남은 비트 수 확인
 */
export const getRemainingBits = (bitStream: BitStream): number => {
  return bitStream.bits.length - bitStream.position;
};

/**
 * 비트 스트림 위치 저장/복원 (백트래킹용)
 */
export const savePosition = (bitStream: BitStream): number => {
  return bitStream.position;
};

export const restorePosition = (bitStream: BitStream, position: number): void => {
  bitStream.position = position;
};

/**
 * 현재 위치에서 미리보기 (위치 변경 없이)
 */
export const peekBits = (bitStream: BitStream, count: number): number | null => {
  const savedPosition = savePosition(bitStream);
  const value = readBits(bitStream, count);
  restorePosition(bitStream, savedPosition);
  return value;
};