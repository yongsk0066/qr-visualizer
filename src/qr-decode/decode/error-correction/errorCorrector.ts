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
  // 개발 모드에서만 디버깅 로그 출력  
  const isDebugMode = false; // Disable debug output
  
  if (isDebugMode) {
    console.log(`🔍 Error correction - Version: ${version}, Level: ${errorLevel}`);
    console.log(`📊 Input codewords: ${codewords.length} (first 10):`, codewords.slice(0, 10));
    
    // 실제 데이터 출력 (사용자가 복사 가능한 형태)
    console.log(`\n📋 COPY THIS - Input codewords for analysis:`);
    console.log(`Version: ${version}`);
    console.log(`Error Level: ${errorLevel}`);
    console.log(`Total codewords: ${codewords.length}`);
    console.log(`Codewords (hex): ${codewords.map(c => c.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`);
    console.log(`Codewords (decimal): ${codewords.join(',')}`);
  }
  
  // 1. 디인터리빙
  const deinterleaved = deinterleaveCodewords(codewords, version, errorLevel);
  if (isDebugMode) {
    console.log(`📦 Deinterleaved blocks: ${deinterleaved.blocks.length}`);
    deinterleaved.blocks.forEach((block, i) => {
      console.log(`   Block ${i}: ${block.length} codewords (data: ${deinterleaved.dataCodewordsPerBlock[i]}, ec: ${deinterleaved.ecCodewordsPerBlock[i]})`);
    });
  }
  
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
    
    // 실제 QR 코드에서는 대부분 에러가 있을 것으로 예상
    const nonZeroSyndromes = blockSyndromes.filter(s => s !== 0).length;
    
    if (isDebugMode) {
      console.log(`🧮 Block ${blockIndex} syndromes:`, blockSyndromes.slice(0, 5));
      console.log(`   Zero syndromes: ${blockSyndromes.length - nonZeroSyndromes}/${blockSyndromes.length}, Non-zero: ${nonZeroSyndromes}`);
    }
    
    // 실제 QR 이미지에서는 perfect한 데이터가 나올 가능성이 낮음
    // 에러 정정을 시도하되, 결과에 따라 판단
    const shouldAttemptCorrection = nonZeroSyndromes > 0;
    
    // 에러 없음 (하지만 실제로는 매우 드문 경우)
    if (hasNoError(blockSyndromes)) {
      if (isDebugMode) {
        console.log(`✅ Block ${blockIndex}: No errors detected (rare case)`);
      }
      blockResults.push({
        blockIndex,
        originalCodewords: [...block],
        correctedCodewords: [...block],
        errorPositions: [],
        errorMagnitudes: [],
        isCorrected: true,
        hasNoError: true,
        detectedErrors: 0,
        maxCorrectableErrors: Math.floor(ecCount / 2)
      });
      return;
    }
    
    // 에러 정정 시도
    if (!shouldAttemptCorrection) {
      if (isDebugMode) {
        console.log(`⚠️ Block ${blockIndex}: Skipping correction (no non-zero syndromes)`);
      }
      blockResults.push({
        blockIndex,
        originalCodewords: [...block],
        correctedCodewords: [...block],
        errorPositions: [],
        errorMagnitudes: [],
        isCorrected: false,
        hasNoError: false,
        failureReason: '신드롬이 모두 0이 아니지만 에러 정정을 시도하지 않음',
        detectedErrors: nonZeroSyndromes,
        maxCorrectableErrors: Math.floor(ecCount / 2)
      });
      allRecoverable = false;
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
      const maxCorrectableErrors = Math.floor(ecCount / 2);
      if (isDebugMode) {
        console.log(`🔧 Block ${blockIndex}: Found ${errorPositions.length} errors, max correctable: ${maxCorrectableErrors}`);
      }
      
      if (errorPositions.length > maxCorrectableErrors) {
        if (isDebugMode) {
          console.log(`❌ Block ${blockIndex}: Too many errors (${errorPositions.length} > ${maxCorrectableErrors})`);
        }
        throw new Error(`EXCEED_CAPACITY:${errorPositions.length}:${maxCorrectableErrors}`);
      }
      
      if (errorPositions.length === 0) {
        if (isDebugMode) {
          console.log(`⚠️ Block ${blockIndex}: No error positions found despite non-zero syndromes`);
        }
        throw new Error('에러 위치를 찾을 수 없습니다');
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
        // Reed-Solomon 위치를 배열 인덱스로 변환
        // RS position은 오른쪽부터 세므로, 배열 인덱스는 (전체길이 - 1 - RS위치)
        const arrayIndex = block.length - 1 - position;
        correctedBlock[arrayIndex] ^= errorMagnitudes[i]; // XOR로 에러 정정
      });
      
      // 정정 후 신드롬 재계산하여 검증
      const verificationSyndromes = calculateSyndrome(correctedBlock, ecCount);
      const isVerified = hasNoError(verificationSyndromes);
      
      if (isDebugMode) {
        console.log(`🔍 Block ${blockIndex}: Correction ${isVerified ? 'successful' : 'failed'}`);
        console.log(`   Original: [${block.slice(0, 5).join(', ')}...]`);
        console.log(`   Corrected: [${correctedBlock.slice(0, 5).join(', ')}...]`);
        console.log(`   Error RS positions: [${errorPositions.join(', ')}]`);
        const arrayIndices = errorPositions.map(pos => block.length - 1 - pos);
        console.log(`   Error array indices: [${arrayIndices.join(', ')}]`);
        console.log(`   Error magnitudes: [${errorMagnitudes.join(', ')}]`);
      }
      
      blockResults.push({
        blockIndex,
        originalCodewords: [...block],
        correctedCodewords: correctedBlock,
        errorPositions,
        errorMagnitudes,
        isCorrected: isVerified,
        hasNoError: false,
        detectedErrors: errorPositions.length,
        maxCorrectableErrors,
        failureReason: isVerified ? undefined : `정정 후 검증 실패: ${errorPositions.length}개 에러를 수정했지만 여전히 에러가 남아있음 (실제 에러가 ${maxCorrectableErrors}개를 초과할 가능성)`
      });
      
      totalErrors += errorPositions.length;
      if (!isVerified) {
        if (isDebugMode) {
          console.log(`❌ Block ${blockIndex}: Verification failed, syndrome still non-zero`);
        }
        allRecoverable = false;
      } else {
        if (isDebugMode) {
          console.log(`✅ Block ${blockIndex}: Successfully corrected ${errorPositions.length} errors`);
        }
      }
      
    } catch (error) {
      // 정정 실패
      if (isDebugMode) {
        console.log(`❌ Block ${blockIndex}: Error correction failed:`, error instanceof Error ? error.message : String(error));
      }
      
      // 에러 메시지 파싱
      let failureReason = '알 수 없는 에러';
      let detectedErrors = 0;
      
      if (error instanceof Error) {
        const errorMsg = error.message;
        if (errorMsg.startsWith('EXCEED_CAPACITY:')) {
          const parts = errorMsg.split(':');
          detectedErrors = parseInt(parts[1]) || 0;
          const maxErrors = parseInt(parts[2]) || Math.floor(ecCount / 2);
          failureReason = `에러 개수 초과: ${detectedErrors}개 검출 (최대 ${maxErrors}개 정정 가능)`;
        } else if (errorMsg.includes('에러 위치 다항식')) {
          failureReason = 'Berlekamp-Massey 알고리즘 실패: 에러 위치 다항식을 찾을 수 없음';
        } else if (errorMsg.includes('에러 위치를 찾을 수 없습니다')) {
          failureReason = 'Chien search 실패: 에러 위치를 찾을 수 없음';
        } else if (errorMsg.includes('Forney')) {
          failureReason = errorMsg;
        } else {
          failureReason = errorMsg;
        }
      }
      
      blockResults.push({
        blockIndex,
        originalCodewords: [...block],
        correctedCodewords: [...block],
        errorPositions: [],
        errorMagnitudes: [],
        isCorrected: false,
        hasNoError: false,
        failureReason,
        detectedErrors,
        maxCorrectableErrors: Math.floor(ecCount / 2)
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
  
  if (isDebugMode) {
    console.log(`📊 Error correction summary:`);
    console.log(`   Total blocks: ${blockResults.length}`);
    console.log(`   Successful corrections: ${successfulBlocks}`);
    console.log(`   Total errors corrected: ${totalErrors}`);
    console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`   Is recoverable: ${allRecoverable}`);
    console.log(`   Corrected data codewords: ${correctedDataCodewords.length}`);
  }
  
  return {
    correctedDataCodewords,
    blockResults,
    totalErrors,
    isRecoverable: allRecoverable,
    confidence,
    syndromes
  };
};