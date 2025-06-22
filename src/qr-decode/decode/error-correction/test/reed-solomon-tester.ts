/**
 * Reed-Solomon Error Correction Test Utility
 * 
 * 이 도구는 QR 코드의 Reed-Solomon 에러 정정 알고리즘을 테스트하고 디버깅하는 데 사용됩니다.
 * 
 * 주요 기능:
 * 1. 인위적 에러 생성 및 정정 테스트
 * 2. 실제 QR 데이터의 에러 정정 능력 분석
 * 3. 블록별 에러 분포 및 정정 가능성 진단
 * 4. 알고리즘 성능 벤치마크
 */

import { correctErrors } from '../errorCorrector';
import { deinterleaveCodewords } from '../deinterleaver/deinterleaver';
import type { QRVersion, ErrorCorrectionLevel } from '../../../../shared/types';

/**
 * Reed-Solomon 테스트 결과
 */
export interface RSTestResult {
  isRecoverable: boolean;
  confidence: number;
  totalErrors: number;
  blockResults: {
    blockIndex: number;
    errorCount: number;
    maxCorrectableErrors: number;
    isCorrected: boolean;
  }[];
  errorAnalysis: {
    totalCodewords: number;
    errorCount: number;
    errorRate: number;
    errorPositions: number[];
  };
}

/**
 * 인위적 에러를 생성하여 Reed-Solomon 알고리즘 테스트
 * 
 * @param originalCodewords - 원본 코드워드 배열
 * @param errorCount - 생성할 에러 개수
 * @param version - QR 버전 (1-40)
 * @param errorLevel - 에러 정정 레벨 (L/M/Q/H)
 * @returns 테스트 결과
 */
export function testWithArtificialErrors(
  originalCodewords: number[],
  errorCount: number,
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): RSTestResult {
  // 에러 위치를 랜덤하게 선택
  const errorPositions = new Set<number>();
  while (errorPositions.size < errorCount && errorPositions.size < originalCodewords.length) {
    errorPositions.add(Math.floor(Math.random() * originalCodewords.length));
  }
  
  // 에러가 있는 코드워드 생성
  const corruptedCodewords = [...originalCodewords];
  const actualErrorPositions = Array.from(errorPositions);
  
  actualErrorPositions.forEach(pos => {
    // 랜덤 에러 값 생성 (0이 아닌 값으로 XOR)
    const errorValue = Math.floor(Math.random() * 255) + 1;
    corruptedCodewords[pos] ^= errorValue;
  });
  
  // 에러 정정 수행
  const result = correctErrors(corruptedCodewords, version, errorLevel);
  
  // 블록별 분석
  const origBlocks = deinterleaveCodewords(originalCodewords, version, errorLevel);
  const corrBlocks = deinterleaveCodewords(corruptedCodewords, version, errorLevel);
  
  const blockResults = origBlocks.blocks.map((origBlock, i) => {
    const corrBlock = corrBlocks.blocks[i];
    let blockErrorCount = 0;
    
    for (let j = 0; j < origBlock.length; j++) {
      if (origBlock[j] !== corrBlock[j]) {
        blockErrorCount++;
      }
    }
    
    const ecCount = origBlocks.ecCodewordsPerBlock[i];
    const maxCorrectableErrors = Math.floor(ecCount / 2);
    const blockResult = result.blockResults[i];
    
    return {
      blockIndex: i,
      errorCount: blockErrorCount,
      maxCorrectableErrors,
      isCorrected: blockResult.isCorrected
    };
  });
  
  return {
    isRecoverable: result.isRecoverable,
    confidence: result.confidence,
    totalErrors: result.totalErrors,
    blockResults,
    errorAnalysis: {
      totalCodewords: originalCodewords.length,
      errorCount: actualErrorPositions.length,
      errorRate: actualErrorPositions.length / originalCodewords.length,
      errorPositions: actualErrorPositions.sort((a, b) => a - b)
    }
  };
}

/**
 * 두 코드워드 배열을 비교하여 에러 분석
 * 
 * @param original - 원본 코드워드
 * @param detected - 검출된 코드워드
 * @param version - QR 버전
 * @param errorLevel - 에러 정정 레벨
 * @returns 에러 분석 및 정정 결과
 */
export function analyzeAndCorrectErrors(
  original: number[],
  detected: number[],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel
): RSTestResult & { comparison: { position: number; original: number; detected: number }[] } {
  // 에러 위치 찾기
  const errors: { position: number; original: number; detected: number }[] = [];
  
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== detected[i]) {
      errors.push({
        position: i,
        original: original[i],
        detected: detected[i]
      });
    }
  }
  
  // 에러 정정 수행
  const result = correctErrors(detected, version, errorLevel);
  
  // 블록별 분석
  const origBlocks = deinterleaveCodewords(original, version, errorLevel);
  const detBlocks = deinterleaveCodewords(detected, version, errorLevel);
  
  const blockResults = origBlocks.blocks.map((origBlock, i) => {
    const detBlock = detBlocks.blocks[i];
    let blockErrorCount = 0;
    
    for (let j = 0; j < origBlock.length; j++) {
      if (origBlock[j] !== detBlock[j]) {
        blockErrorCount++;
      }
    }
    
    const ecCount = origBlocks.ecCodewordsPerBlock[i];
    const maxCorrectableErrors = Math.floor(ecCount / 2);
    const blockResult = result.blockResults[i];
    
    return {
      blockIndex: i,
      errorCount: blockErrorCount,
      maxCorrectableErrors,
      isCorrected: blockResult.isCorrected
    };
  });
  
  return {
    isRecoverable: result.isRecoverable,
    confidence: result.confidence,
    totalErrors: result.totalErrors,
    blockResults,
    errorAnalysis: {
      totalCodewords: original.length,
      errorCount: errors.length,
      errorRate: errors.length / original.length,
      errorPositions: errors.map(e => e.position)
    },
    comparison: errors
  };
}

/**
 * Reed-Solomon 성능 벤치마크
 * 
 * @param codewords - 테스트할 코드워드
 * @param version - QR 버전
 * @param errorLevel - 에러 정정 레벨
 * @param iterations - 반복 횟수
 * @returns 평균 실행 시간 (ms)
 */
export function benchmarkReedSolomon(
  codewords: number[],
  version: QRVersion,
  errorLevel: ErrorCorrectionLevel,
  iterations: number = 100
): number {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    correctErrors(codewords, version, errorLevel);
  }
  
  const endTime = performance.now();
  return (endTime - startTime) / iterations;
}

/**
 * 테스트 결과를 읽기 쉬운 형태로 출력
 * 
 * @param result - 테스트 결과
 * @param showDetails - 상세 정보 표시 여부
 */
export function printTestResult(result: RSTestResult, showDetails: boolean = true): void {
  console.log('🔍 Reed-Solomon Error Correction Test Result\n');
  
  console.log('📊 Error Analysis:');
  console.log(`Total codewords: ${result.errorAnalysis.totalCodewords}`);
  console.log(`Error count: ${result.errorAnalysis.errorCount}`);
  console.log(`Error rate: ${(result.errorAnalysis.errorRate * 100).toFixed(1)}%`);
  
  if (showDetails && result.errorAnalysis.errorPositions.length <= 20) {
    console.log(`Error positions: [${result.errorAnalysis.errorPositions.join(', ')}]`);
  } else if (showDetails) {
    console.log(`Error positions (first 20): [${result.errorAnalysis.errorPositions.slice(0, 20).join(', ')}...]`);
  }
  
  console.log('\n📦 Block Analysis:');
  result.blockResults.forEach(block => {
    const status = block.isCorrected ? '✅' : '❌';
    const withinLimit = block.errorCount <= block.maxCorrectableErrors;
    console.log(
      `Block ${block.blockIndex}: ${block.errorCount}/${block.maxCorrectableErrors} errors ` +
      `${withinLimit ? '(within limit)' : '(exceeds limit)'} ${status}`
    );
  });
  
  console.log('\n🔧 Correction Result:');
  console.log(`Recoverable: ${result.isRecoverable ? '✅ YES' : '❌ NO'}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Total errors corrected: ${result.totalErrors}`);
}