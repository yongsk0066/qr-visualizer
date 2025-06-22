import type { ErrorCorrectionLevel, QRVersion } from '../../../../shared/types';
import { EC_BLOCKS_TABLE } from '../../../../qr-encode/error-correction/ecBlocksTable';

/**
 * 버전과 에러 레벨에 따른 코드워드 정보 가져오기
 */
export const getCodewordInfo = (
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
) => {
  const ecBlocks = EC_BLOCKS_TABLE[version][errorLevel];
  
  // 총 코드워드 수 계산
  let totalCodewords = 0;
  let dataCodewords = 0;
  let ecCodewords = 0;
  
  // 모든 그룹의 블록 정보 수집
  const blocks: Array<{ dataCodewords: number; ecCodewords: number }> = [];
  
  ecBlocks.groups.forEach(group => {
    for (let i = 0; i < group.blocks; i++) {
      totalCodewords += group.totalCount;
      dataCodewords += group.dataCount;
      ecCodewords += (group.totalCount - group.dataCount);
      
      blocks.push({
        dataCodewords: group.dataCount,
        ecCodewords: group.totalCount - group.dataCount
      });
    }
  });
  
  return {
    totalCodewords,
    dataCodewords,
    ecCodewords,
    blocks,
    ecCodewordsPerBlock: ecBlocks.ecCodewordsPerBlock
  };
};

/**
 * 인터리빙된 코드워드를 블록별로 분리
 * ISO/IEC 18004 Section 7.5.2
 */
export const separateCodewordBlocks = (
  codewords: number[],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): {
  dataBlocks: number[][];
  ecBlocks: number[][];
} => {
  const ecBlockInfo = EC_BLOCKS_TABLE[version][errorLevel];
  const blocks: Array<{ data: number[]; ec: number[] }> = [];
  
  // 각 블록 초기화
  ecBlockInfo.groups.forEach(group => {
    for (let i = 0; i < group.blocks; i++) {
      blocks.push({
        data: [],
        ec: []
      });
    }
  });
  
  let codewordIndex = 0;
  
  // 데이터 코드워드 디인터리빙
  // 먼저 짧은 블록들 처리
  const minDataCount = Math.min(...ecBlockInfo.groups.map(g => g.dataCount));
  
  for (let i = 0; i < minDataCount; i++) {
    blocks.forEach(block => {
      if (codewordIndex < codewords.length) {
        block.data.push(codewords[codewordIndex++]);
      }
    });
  }
  
  // 긴 블록들의 추가 데이터 처리
  let blockIndex = 0;
  ecBlockInfo.groups.forEach(group => {
    if (group.dataCount > minDataCount) {
      for (let b = 0; b < group.blocks; b++) {
        for (let i = minDataCount; i < group.dataCount; i++) {
          if (codewordIndex < codewords.length) {
            blocks[blockIndex].data.push(codewords[codewordIndex++]);
          }
        }
        blockIndex++;
      }
    } else {
      blockIndex += group.blocks;
    }
  });
  
  // 에러 정정 코드워드 디인터리빙
  const ecCount = ecBlockInfo.ecCodewordsPerBlock;
  for (let i = 0; i < ecCount; i++) {
    blocks.forEach(block => {
      if (codewordIndex < codewords.length) {
        block.ec.push(codewords[codewordIndex++]);
      }
    });
  }
  
  return {
    dataBlocks: blocks.map(b => b.data),
    ecBlocks: blocks.map(b => b.ec)
  };
};