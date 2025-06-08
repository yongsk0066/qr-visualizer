import { analyzeData } from './dataAnalysis';
import { encodeData } from './dataEncoding';
import { DATA_CAPACITY_TABLE } from './constants';
import { 
  bitStreamToCodewords, 
  performErrorCorrection, 
  interleaveCodewords 
} from './errorCorrection';
import type { ErrorCorrectionLevel, QRVersion, DataAnalysisResult, ErrorCorrectionData } from './types';
import type { EncodedData } from './dataEncoding';

export interface QRPipelineParams {
  inputData: string;
  qrVersion: string;
  errorLevel: ErrorCorrectionLevel;
}

export interface QRPipelineResult {
  dataAnalysis: DataAnalysisResult | null;
  dataEncoding: EncodedData | null;
  errorCorrection: ErrorCorrectionData | null;
  qrGeneration: number[][];
}

export const runQRPipeline = (params: QRPipelineParams): QRPipelineResult => {
  const { inputData, qrVersion, errorLevel } = params;

  // Step 1: 데이터 분석
  const runDataAnalysis = (data: string) => 
    data ? analyzeData(data, errorLevel) : null;

  // Step 2: 데이터 인코딩
  const runDataEncoding = (data: string, analysis: DataAnalysisResult) => {
    if (!analysis.isValid) return null;
    
    const version = parseInt(qrVersion, 10) as QRVersion;
    const capacity = DATA_CAPACITY_TABLE[version][errorLevel];
    return encodeData(data, analysis.recommendedMode, version, capacity);
  };

  // Step 3: 에러 정정
  const runErrorCorrection = (encodedData: EncodedData | null): ErrorCorrectionData | null => {
    if (!encodedData) return null;
    
    const version = parseInt(qrVersion, 10) as QRVersion;
    const dataCodewords = bitStreamToCodewords(encodedData.bitStream);
    const ecResult = performErrorCorrection(dataCodewords, version, errorLevel);
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

  // Step 4: QR 매트릭스 생성 (미구현)
  const runQRGeneration = (_errorCorrection: ErrorCorrectionData | null) => {
    // TODO: 모듈 배치, 마스킹, 포맷 정보 구현
    return [] as number[][];
  };

  // 파이프라인 실행
  const dataAnalysis = runDataAnalysis(inputData);
  const dataEncoding = dataAnalysis ? runDataEncoding(inputData, dataAnalysis) : null;
  const errorCorrection = runErrorCorrection(dataEncoding);
  const qrGeneration = runQRGeneration(errorCorrection);

  return {
    dataAnalysis,
    dataEncoding,
    errorCorrection,
    qrGeneration,
  };
};