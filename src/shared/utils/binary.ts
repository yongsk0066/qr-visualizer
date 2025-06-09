/**
 * 숫자를 지정된 길이의 이진 문자열로 변환
 * @param value 변환할 숫자
 * @param length 이진 문자열 길이
 * @returns 지정된 길이의 이진 문자열 (앞에 0으로 패딩)
 */
export const toBinaryString = (value: number, length: number): string =>
  value.toString(2).padStart(length, '0');

/**
 * 이진 문자열을 8비트 단위로 그룹화하여 포맷
 * @param bits 이진 문자열
 * @returns 8비트마다 공백으로 구분된 문자열
 */
export const formatBitGroups = (bits: string): string =>
  bits.match(/.{1,8}/g)?.join(' ') || bits;

/**
 * 문자열을 8비트 경계로 패딩
 * @param bitStream 입력 비트 스트림
 * @returns 8의 배수로 패딩된 비트 스트림
 */
export const padToByteBoundary = (bitStream: string): string => {
  const remainder = bitStream.length % 8;
  if (remainder === 0) return bitStream;

  const paddingBits = 8 - remainder;
  return bitStream + '0'.repeat(paddingBits);
};

/**
 * 비트 스트림에 반복 패턴으로 패딩 추가
 * @param bitStream 입력 비트 스트림
 * @param targetLength 목표 길이
 * @param patterns 반복할 패턴 배열
 * @returns 패딩이 추가된 비트 스트림
 */
export const addPaddingPattern = (
  bitStream: string,
  targetLength: number,
  patterns: string[]
): string => {
  let result = bitStream;
  let patternIndex = 0;

  while (result.length < targetLength) {
    const remainingBits = targetLength - result.length;
    const currentPattern = patterns[patternIndex];
    
    if (remainingBits >= currentPattern.length) {
      result += currentPattern;
      patternIndex = (patternIndex + 1) % patterns.length;
    } else {
      result += '0'.repeat(remainingBits);
      break;
    }
  }

  return result;
};