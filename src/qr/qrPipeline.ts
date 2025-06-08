import { analyzeData } from './analysis/dataAnalysis';
import { runDataEncoding } from './encoding/dataEncoding';
import { runErrorCorrection } from './error-correction/errorCorrection';
import type { ErrorCorrectionLevel, QRVersion, DataAnalysisResult, ErrorCorrectionData } from '../shared/types';
import type { EncodedData } from './encoding/dataEncoding';

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
  const executeDataEncoding = (data: string, analysis: DataAnalysisResult) => {
    const version = parseInt(qrVersion, 10) as QRVersion;
    return runDataEncoding(data, analysis, version, errorLevel);
  };

  // Step 3: 에러 정정
  const executeErrorCorrection = (encodedData: EncodedData | null): ErrorCorrectionData | null => {
    const version = parseInt(qrVersion, 10) as QRVersion;
    return runErrorCorrection(encodedData, version, errorLevel);
  };

  // Step 4: QR 매트릭스 생성 (미구현)
  const runQRGeneration = (_errorCorrection: ErrorCorrectionData | null) => {
    // TODO: 모듈 배치, 마스킹, 포맷 정보 구현
    return [] as number[][];
  };

  // 파이프라인 실행
  const dataAnalysis = runDataAnalysis(inputData);
  const dataEncoding = dataAnalysis ? executeDataEncoding(inputData, dataAnalysis) : null;
  const errorCorrection = executeErrorCorrection(dataEncoding);
  const qrGeneration = runQRGeneration(errorCorrection);

  return {
    dataAnalysis,
    dataEncoding,
    errorCorrection,
    qrGeneration,
  };
};