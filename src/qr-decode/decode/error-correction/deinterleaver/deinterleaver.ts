import type { QRVersion, ErrorCorrectionLevel } from '../../../../shared/types';
import type { DeinterleavedBlocks } from '../types';
import { EC_BLOCKS_TABLE } from '../../../../qr-encode/error-correction/ecBlocksTable';

/**
 * 인터리빙된 코드워드를 블록별로 분리
 * ISO/IEC 18004 Section 7.5.2의 역과정
 */
export const deinterleaveCodewords = (
  codewords: number[],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): DeinterleavedBlocks => {
  const ecBlockInfo = EC_BLOCKS_TABLE[version][errorLevel];
  const blocks: number[][] = [];
  const dataCodewordsPerBlock: number[] = [];
  const ecCodewordsPerBlock: number[] = [];
  
  // 블록 초기화
  let totalBlocks = 0;
  ecBlockInfo.groups.forEach(group => {
    for (let i = 0; i < group.blocks; i++) {
      blocks.push([]);
      dataCodewordsPerBlock.push(group.dataCount);
      ecCodewordsPerBlock.push(group.totalCount - group.dataCount);
      totalBlocks++;
    }
  });
  
  let codewordIndex = 0;
  
  // 1. 데이터 코드워드 디인터리빙
  // 먼저 짧은 블록들의 데이터
  const minDataCount = Math.min(...dataCodewordsPerBlock);
  
  for (let i = 0; i < minDataCount; i++) {
    for (let blockIndex = 0; blockIndex < totalBlocks; blockIndex++) {
      if (codewordIndex < codewords.length) {
        blocks[blockIndex].push(codewords[codewordIndex++]);
      }
    }
  }
  
  // 긴 블록들의 추가 데이터
  for (let blockIndex = 0; blockIndex < totalBlocks; blockIndex++) {
    const remainingData = dataCodewordsPerBlock[blockIndex] - minDataCount;
    for (let i = 0; i < remainingData; i++) {
      if (codewordIndex < codewords.length) {
        blocks[blockIndex].push(codewords[codewordIndex++]);
      }
    }
  }
  
  // 2. EC 코드워드 디인터리빙
  const ecCount = ecBlockInfo.ecCodewordsPerBlock;
  for (let i = 0; i < ecCount; i++) {
    for (let blockIndex = 0; blockIndex < totalBlocks; blockIndex++) {
      if (codewordIndex < codewords.length) {
        blocks[blockIndex].push(codewords[codewordIndex++]);
      }
    }
  }
  
  return {
    blocks,
    dataCodewordsPerBlock,
    ecCodewordsPerBlock
  };
};