import type { ErrorCorrectionResult, BlockCorrectionResult } from './types';
import type { QRVersion, ErrorCorrectionLevel } from '../../../shared/types';
import { deinterleaveCodewords } from './deinterleaver/deinterleaver';
import { calculateSyndrome, hasNoError } from './reed-solomon/syndrome';
import { findErrorLocatorPolynomial, findErrorPositions } from './reed-solomon/berlekampMassey';
import { calculateErrorMagnitudes } from './reed-solomon/errorEvaluator';

/**
 * QR 코드 에러 정정
 * ISO/IEC 18004 Section 7.5.3
 */
export const correctErrors = (
  codewords: number[],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): ErrorCorrectionResult => {
  // 1. 디인터리빙
  const deinterleaved = deinterleaveCodewords(codewords, version, errorLevel);
  
  const blockResults: BlockCorrectionResult[] = [];
  const syndromes: number[][] = [];
  let totalErrors = 0;
  let allRecoverable = true;
  
  // 2. 각 블록별로 에러 정정
  deinterleaved.blocks.forEach((block, blockIndex) => {
    const ecCount = deinterleaved.ecCodewordsPerBlock[blockIndex];
    
    // 신드롬 계산
    const blockSyndromes = calculateSyndrome(block, ecCount);
    syndromes.push(blockSyndromes);
    
    // 에러 없음
    if (hasNoError(blockSyndromes)) {
      blockResults.push({
        blockIndex,
        originalCodewords: [...block],
        correctedCodewords: [...block],
        errorPositions: [],
        errorMagnitudes: [],
        isCorrected: true,
        hasNoError: true
      });
      return;
    }
    
    try {
      // 에러 위치 다항식 계산
      const errorLocator = findErrorLocatorPolynomial(blockSyndromes);
      if (!errorLocator) {
        throw new Error('에러 위치 다항식을 찾을 수 없습니다');
      }
      
      // 에러 위치 찾기
      const errorPositions = findErrorPositions(errorLocator, block.length);
      
      // 에러 개수가 정정 능력을 초과하는지 확인
      if (errorPositions.length > ecCount / 2) {
        throw new Error(`에러 개수(${errorPositions.length})가 정정 능력(${ecCount / 2})을 초과합니다`);
      }
      
      // 에러 값 계산
      const errorMagnitudes = calculateErrorMagnitudes(
        blockSyndromes,
        errorLocator,
        errorPositions
      );
      
      // 에러 정정 적용
      const correctedBlock = [...block];
      errorPositions.forEach((position, i) => {
        correctedBlock[position] ^= errorMagnitudes[i]; // XOR로 에러 정정
      });
      
      // 정정 후 신드롬 재계산하여 검증
      const verificationSyndromes = calculateSyndrome(correctedBlock, ecCount);
      const isVerified = hasNoError(verificationSyndromes);
      
      blockResults.push({
        blockIndex,
        originalCodewords: [...block],
        correctedCodewords: correctedBlock,
        errorPositions,
        errorMagnitudes,
        isCorrected: isVerified,
        hasNoError: false
      });
      
      totalErrors += errorPositions.length;
      if (!isVerified) {
        allRecoverable = false;
      }
      
    } catch {
      // 정정 실패
      blockResults.push({
        blockIndex,
        originalCodewords: [...block],
        correctedCodewords: [...block],
        errorPositions: [],
        errorMagnitudes: [],
        isCorrected: false,
        hasNoError: false
      });
      allRecoverable = false;
    }
  });
  
  // 3. 정정된 데이터 코드워드 추출
  const correctedDataCodewords: number[] = [];
  blockResults.forEach((result, index) => {
    const dataCount = deinterleaved.dataCodewordsPerBlock[index];
    correctedDataCodewords.push(...result.correctedCodewords.slice(0, dataCount));
  });
  
  // 4. 신뢰도 계산
  const successfulBlocks = blockResults.filter(r => r.isCorrected).length;
  const confidence = successfulBlocks / blockResults.length;
  
  return {
    correctedDataCodewords,
    blockResults,
    totalErrors,
    isRecoverable: allRecoverable,
    confidence,
    syndromes
  };
};