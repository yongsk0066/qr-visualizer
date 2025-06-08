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
  const version = parseInt(qrVersion, 10) as QRVersion;

  // Step 1: 데이터 분석
  const dataAnalysis = inputData 
    ? analyzeData(inputData, errorLevel) 
    : null;

  // Step 2: 데이터 인코딩
  const dataEncoding = dataAnalysis 
    ? runDataEncoding(inputData, dataAnalysis, version, errorLevel)
    : null;

  // Step 3: 에러 정정
  const errorCorrection = runErrorCorrection(dataEncoding, version, errorLevel);

  // Step 4: QR 매트릭스 생성 (미구현)
  const qrGeneration = (() => {
    // TODO: 모듈 배치, 마스킹, 포맷 정보 구현
    return [] as number[][];
  })();

  return {
    dataAnalysis,
    dataEncoding,
    errorCorrection,
    qrGeneration,
  };
};