/**
 * 비트 스트림을 8비트 코드워드 배열로 변환
 * 마지막 바이트가 8비트 미만일 경우 오른쪽에 0으로 패딩
 */
export const bitStreamToCodewords = (bitStream: string): number[] => {
  const byteGroups = bitStream.match(/.{1,8}/g) || [];
  return byteGroups.map(byte => parseInt(byte.padEnd(8, '0'), 2));
};

/**
 * 여러 블록을 인터리빙하여 하나의 배열로 합침
 * 각 블록에서 동일한 인덱스의 요소들을 순서대로 취함
 * 
 * 예: [[1,2,3], [4,5], [6,7,8]] → [1,4,6,2,5,7,3,8]
 */
const interleaveBlocks = (blocks: number[][]): number[] => {
  if (blocks.length === 0) return [];
  
  const maxLength = Math.max(...blocks.map(block => block.length));
  const result: number[] = [];
  
  for (let position = 0; position < maxLength; position++) {
    for (const block of blocks) {
      if (position < block.length) {
        result.push(block[position]);
      }
    }
  }
  
  return result;
};

/**
 * 데이터 블록과 에러 정정 블록을 최종 전송 순서로 인터리빙
 * ISO/IEC 18004 8.6 (line 1289-1334)
 * 
 * 순서: 모든 데이터 블록 인터리빙 → 모든 EC 블록 인터리빙
 */
export const interleaveCodewords = (
  dataBlocks: number[][],
  ecBlocks: number[][]
): number[] => [
  ...interleaveBlocks(dataBlocks),
  ...interleaveBlocks(ecBlocks)
];
