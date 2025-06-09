/**
 * 문자열이 숫자로만 구성되어 있는지 확인
 * @param str 확인할 문자열
 * @returns 숫자로만 구성되어 있으면 true
 */
export const isNumericString = (str: string): boolean => /^[0-9]*$/.test(str);

/**
 * 문자열을 지정된 크기의 청크로 분할
 * @param str 분할할 문자열
 * @param chunkSize 청크 크기
 * @returns 청크 배열
 */
export const chunkString = (str: string, chunkSize: number): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * 문자의 ASCII 코드 값을 반환
 * @param char 문자
 * @returns ASCII 코드 값
 */
export const getCharCode = (char: string): number => char.charCodeAt(0);

/**
 * 문자열을 문자 배열로 변환
 * @param str 변환할 문자열
 * @returns 문자 배열
 */
export const toCharArray = (str: string): string[] => str.split('');