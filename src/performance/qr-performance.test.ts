import { describe, it, expect } from 'vitest';
import { analyzeData } from '../qr/analysis/dataAnalysis';
import { runDataEncoding } from '../qr/encoding/dataEncoding';
import { runErrorCorrection } from '../qr/error-correction/errorCorrection';
import { constructMessage } from '../qr/message-construction/messageConstruction';
import { runModulePlacement } from '../qr/module-placement/modulePlacement';
import { generateAllEncodingMaskMatrices, evaluateAllMaskPatterns } from '../qr/masking/maskPatterns';
import { generateFinalQR } from '../qr/final-generation/finalGeneration';
import type { QRVersion, ErrorCorrectionLevel } from '../shared/types';

interface PerformanceResult {
  step1_analysis: number;
  step2_encoding: number;
  step3_errorCorrection: number;
  step4_messageConstruction: number;
  step5_modulePlacement: number;
  step6_masking: number;
  step7_finalGeneration: number;
  total: number;
}

const measureQRPerformance = (inputData: string, version: QRVersion, errorLevel: ErrorCorrectionLevel = 'M'): PerformanceResult => {
  const startTotal = performance.now();
  
  // Step 1: Data Analysis
  const start1 = performance.now();
  const dataAnalysis = analyzeData(inputData, errorLevel);
  const step1_analysis = performance.now() - start1;
  
  if (!dataAnalysis.isValid) {
    throw new Error('Invalid data for QR generation');
  }
  
  // Step 2: Data Encoding
  const start2 = performance.now();
  const dataEncoding = runDataEncoding(inputData, dataAnalysis, version, errorLevel);
  const step2_encoding = performance.now() - start2;
  
  if (!dataEncoding) {
    throw new Error('Data encoding failed');
  }
  
  // Step 3: Error Correction
  const start3 = performance.now();
  const errorCorrection = runErrorCorrection(dataEncoding, version, errorLevel);
  const step3_errorCorrection = performance.now() - start3;
  
  if (!errorCorrection) {
    throw new Error('Error correction failed');
  }
  
  // Step 4: Message Construction
  const start4 = performance.now();
  const messageConstruction = constructMessage(errorCorrection);
  const step4_messageConstruction = performance.now() - start4;
  
  if (!messageConstruction) {
    throw new Error('Message construction failed');
  }
  
  // Step 5: Module Placement
  const start5 = performance.now();
  const modulePlacement = runModulePlacement(version, messageConstruction.finalBitStream);
  const step5_modulePlacement = performance.now() - start5;
  
  if (!modulePlacement) {
    throw new Error('Module placement failed');
  }
  
  // Step 6: Masking
  const start6 = performance.now();
  const { matrix, moduleTypes } = modulePlacement.subSteps[modulePlacement.subSteps.length - 1];
  const encodingMaskMatrices = generateAllEncodingMaskMatrices(version, moduleTypes);
  const evaluationResults = evaluateAllMaskPatterns(matrix, encodingMaskMatrices);
  const selectedEvaluation = evaluationResults.find(e => e.isSelected);
  const step6_masking = performance.now() - start6;
  
  if (!selectedEvaluation) {
    throw new Error('Mask selection failed');
  }
  
  // Step 7: Final Generation
  const start7 = performance.now();
  const selectedMaskMatrix = encodingMaskMatrices[selectedEvaluation.pattern];
  const finalGeneration = generateFinalQR(
    matrix,
    selectedMaskMatrix,
    selectedEvaluation.pattern,
    version,
    errorLevel
  );
  const step7_finalGeneration = performance.now() - start7;
  
  if (!finalGeneration) {
    throw new Error('Final generation failed');
  }
  
  const total = performance.now() - startTotal;
  
  return {
    step1_analysis,
    step2_encoding,
    step3_errorCorrection,
    step4_messageConstruction,
    step5_modulePlacement,
    step6_masking,
    step7_finalGeneration,
    total
  };
};

const formatTime = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const logPerformanceResults = (testName: string, result: PerformanceResult) => {
  console.log(`\n🚀 ${testName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Step 1 - Data Analysis:      ${formatTime(result.step1_analysis)}`);
  console.log(`📊 Step 2 - Data Encoding:      ${formatTime(result.step2_encoding)}`);
  console.log(`📊 Step 3 - Error Correction:   ${formatTime(result.step3_errorCorrection)} ${result.step3_errorCorrection > 50 ? '🔴' : result.step3_errorCorrection > 20 ? '🟡' : '🟢'}`);
  console.log(`📊 Step 4 - Message Construction: ${formatTime(result.step4_messageConstruction)}`);
  console.log(`📊 Step 5 - Module Placement:   ${formatTime(result.step5_modulePlacement)} ${result.step5_modulePlacement > 50 ? '🔴' : result.step5_modulePlacement > 20 ? '🟡' : '🟢'}`);
  console.log(`📊 Step 6 - Masking:            ${formatTime(result.step6_masking)} ${result.step6_masking > 100 ? '🔴' : result.step6_masking > 50 ? '🟡' : '🟢'}`);
  console.log(`📊 Step 7 - Final Generation:   ${formatTime(result.step7_finalGeneration)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⏱️  Total Time:                 ${formatTime(result.total)} ${result.total > 200 ? '🔴' : result.total > 100 ? '🟡' : '🟢'}`);
  
  // 병목 분석
  const steps = [
    { name: 'Error Correction', time: result.step3_errorCorrection },
    { name: 'Module Placement', time: result.step5_modulePlacement },
    { name: 'Masking', time: result.step6_masking },
    { name: 'Data Encoding', time: result.step2_encoding },
    { name: 'Message Construction', time: result.step4_messageConstruction },
    { name: 'Final Generation', time: result.step7_finalGeneration },
    { name: 'Data Analysis', time: result.step1_analysis },
  ].sort((a, b) => b.time - a.time);
  
  console.log(`\n🎯 Top Bottlenecks:`);
  steps.slice(0, 3).forEach((step, i) => {
    const percentage = ((step.time / result.total) * 100).toFixed(1);
    console.log(`   ${i + 1}. ${step.name}: ${formatTime(step.time)} (${percentage}%)`);
  });
};

describe('QR Code Generation Performance Tests', () => {
  
  it('should measure performance for small QR code (Version 1)', () => {
    const result = measureQRPerformance('Hello', 1, 'M');
    logPerformanceResults('Version 1 - Small Data', result);
    
    // 기본적인 성능 검증
    expect(result.total).toBeLessThan(100); // 100ms 이하
    expect(result.step1_analysis).toBeLessThan(10);
    expect(result.step2_encoding).toBeLessThan(10);
  });
  
  it('should measure performance for medium QR code (Version 10)', () => {
    const data = 'A'.repeat(100); // 100 characters
    const result = measureQRPerformance(data, 10, 'M');
    logPerformanceResults('Version 10 - Medium Data', result);
    
    expect(result.total).toBeLessThan(200); // 200ms 이하
  });
  
  it('should measure performance for large QR code (Version 25)', () => {
    const data = 'A'.repeat(500); // 500 characters  
    const result = measureQRPerformance(data, 25, 'M');
    logPerformanceResults('Version 25 - Large Data', result);
    
    expect(result.total).toBeLessThan(500); // 500ms 이하
  });
  
  it('should measure performance for maximum QR code (Version 40)', () => {
    const data = 'A'.repeat(1000); // 1000 characters
    const result = measureQRPerformance(data, 40, 'M');
    logPerformanceResults('Version 40 - Maximum Data', result);
    
    // 최대 버전에서도 합리적인 시간 내에 완료되어야 함
    expect(result.total).toBeLessThan(2000); // 2초 이하
  });
  
  it('should compare different error correction levels (Version 40)', () => {
    const data = 'A'.repeat(800);
    
    const resultL = measureQRPerformance(data, 40, 'L');
    const resultM = measureQRPerformance(data, 40, 'M');
    const resultQ = measureQRPerformance(data, 40, 'Q');
    const resultH = measureQRPerformance(data, 40, 'H');
    
    logPerformanceResults('Version 40 - Error Level L', resultL);
    logPerformanceResults('Version 40 - Error Level M', resultM);
    logPerformanceResults('Version 40 - Error Level Q', resultQ);
    logPerformanceResults('Version 40 - Error Level H', resultH);
    
    console.log('\n📈 Error Level Comparison:');
    console.log(`   L: ${formatTime(resultL.total)}`);
    console.log(`   M: ${formatTime(resultM.total)}`);
    console.log(`   Q: ${formatTime(resultQ.total)}`);
    console.log(`   H: ${formatTime(resultH.total)}`);
    
    // 모든 에러 정정 레벨이 정상적으로 완료되어야 함
    expect(resultL.step3_errorCorrection).toBeGreaterThan(0);
    expect(resultM.step3_errorCorrection).toBeGreaterThan(0);
    expect(resultQ.step3_errorCorrection).toBeGreaterThan(0);
    expect(resultH.step3_errorCorrection).toBeGreaterThan(0);
  });
  
  it('should identify performance bottlenecks across versions', () => {
    const testCases = [
      { version: 1 as QRVersion, data: 'Hi' },
      { version: 5 as QRVersion, data: 'Hello World' },
      { version: 15 as QRVersion, data: 'A'.repeat(200) },
      { version: 30 as QRVersion, data: 'A'.repeat(600) },
      { version: 40 as QRVersion, data: 'A'.repeat(1000) },
    ];
    
    console.log('\n🔍 Cross-Version Performance Analysis');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const allResults = testCases.map(({ version, data }) => {
      const result = measureQRPerformance(data, version, 'M');
      return { version, result };
    });
    
    // 버전별 병목 분석
    console.log('\n📊 Bottleneck by Version:');
    allResults.forEach(({ version, result }) => {
      const bottleneck = [
        { step: 'ErrorCorrection', time: result.step3_errorCorrection },
        { step: 'ModulePlacement', time: result.step5_modulePlacement },
        { step: 'Masking', time: result.step6_masking },
      ].sort((a, b) => b.time - a.time)[0];
      
      console.log(`   V${version}: ${bottleneck.step} (${formatTime(bottleneck.time)})`);
    });
    
    // 성장률 분석
    console.log('\n📈 Performance Growth Rate:');
    for (let i = 1; i < allResults.length; i++) {
      const prev = allResults[i - 1];
      const curr = allResults[i];
      const growth = ((curr.result.total / prev.result.total - 1) * 100).toFixed(1);
      console.log(`   V${prev.version} → V${curr.version}: +${growth}% (${formatTime(prev.result.total)} → ${formatTime(curr.result.total)})`);
    }
  });
});