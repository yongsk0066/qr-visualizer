import type { QRVersion, ErrorCorrectionLevel, ErrorCorrectionData } from '../../shared/types';
import { EC_BLOCKS_TABLE } from './ecBlocksTable';
import type { EncodedData } from '../encoding/dataEncoding';
import type { ECBlocks, ErrorCorrectionResult } from './types';
import { generateErrorCorrectionCodewords } from './reed-solomon/reedSolomon';
import { bitStreamToCodewords, interleaveCodewords } from './utils';



/**
 * 버전과 에러 정정 레벨에 따른 블록 구조 반환
 * ISO/IEC 18004 표 13-22 (line 1157-1517)
 */
export const getECBlocks = (
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): ECBlocks => {
  return EC_BLOCKS_TABLE[version]?.[errorLevel] || EC_BLOCKS_TABLE[1][errorLevel];
};



/**
 * 메시지를 블록으로 분할하고 각 블록에 대한 에러 정정 코드워드 생성
 */
export const performErrorCorrection = (
  dataCodewords: number[],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): ErrorCorrectionResult => {
  const ecBlocks = getECBlocks(version, errorLevel);
  
  // 모든 블록 정보를 평면화된 배열로 생성
  const allBlocks = ecBlocks.groups.flatMap(group => 
    Array.from({ length: group.blocks }, () => group)
  );
  
  // 데이터 코드워드를 블록으로 분할
  let offset = 0;
  const dataBlocks = allBlocks.map(group => {
    const blockData = dataCodewords.slice(offset, offset + group.dataCount);
    offset += group.dataCount;
    return blockData;
  });
  
  // 각 데이터 블록에 대한 에러 정정 코드워드 생성
  const ecBlocksResult = dataBlocks.map(blockData =>
    generateErrorCorrectionCodewords(blockData, ecBlocks.ecCodewordsPerBlock)
  );
  
  return {
    dataBlocks,
    ecBlocks: ecBlocksResult,
    totalDataCodewords: dataBlocks.reduce((sum, block) => sum + block.length, 0),
    totalECCodewords: ecBlocksResult.reduce((sum, block) => sum + block.length, 0),
  };
};


/**
 * 전체 에러 정정 파이프라인 실행
 * 인코딩된 데이터를 받아서 최종 에러 정정까지 완료된 결과 반환
 */
export const runErrorCorrection = (
  encodedData: EncodedData | null,
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): ErrorCorrectionData | null => {
  if (!encodedData) return null;
  
  // 1. 비트 스트림을 8비트 코드워드 배열로 변환
  // 예: "0001000100010001" → [17, 17, ...]
  const dataCodewords = bitStreamToCodewords(encodedData.bitStream);
  
  // 2. 데이터 코드워드를 블록으로 분할하고 Reed-Solomon 에러 정정 코드워드 생성
  // - 버전/에러레벨에 따라 블록 구조 결정
  // - 각 블록마다 갈루아 필드 연산으로 에러 정정 코드워드 계산
  const ecResult = performErrorCorrection(dataCodewords, version, errorLevel);
  
  // 3. 데이터 블록과 에러 정정 블록을 최종 전송 순서로 인터리빙
  // ISO/IEC 18004 8.6: 먼저 데이터 블록들 인터리빙, 그다음 EC 블록들 인터리빙
  const interleavedCodewords = interleaveCodewords(ecResult.dataBlocks, ecResult.ecBlocks);
  
  return {
    dataCodewords,
    ecCodewords: ecResult.ecBlocks.flat(),
    interleavedCodewords,
    totalCodewords: interleavedCodewords.length,
    dataBlocks: ecResult.dataBlocks,
    ecBlocks: ecResult.ecBlocks,
  };
};