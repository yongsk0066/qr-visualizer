import { analyzeData } from './analysis/dataAnalysis';
import { runDataEncoding } from './encoding/dataEncoding';
import { runErrorCorrection } from './error-correction/errorCorrection';
import { constructMessage } from './message-construction/messageConstruction';
import type { ErrorCorrectionLevel, QRVersion, DataAnalysisResult, ErrorCorrectionData } from '../shared/types';
import type { EncodedData } from './encoding/dataEncoding';
import type { MessageConstructionResult } from './message-construction/messageConstruction';

export interface QRPipelineParams {
  inputData: string;
  qrVersion: string;
  errorLevel: ErrorCorrectionLevel;
}

export interface QRPipelineResult {
  dataAnalysis: DataAnalysisResult | null;
  dataEncoding: EncodedData | null;
  errorCorrection: ErrorCorrectionData | null;
  messageConstruction: MessageConstructionResult | null;
  qrGeneration: number[][];
}

export const runQRPipeline = (params: QRPipelineParams): QRPipelineResult => {
  const { inputData, qrVersion, errorLevel } = params;
  const version = parseInt(qrVersion, 10) as QRVersion;

  const dataAnalysis = inputData 
    ? analyzeData(inputData, errorLevel) 
    : null;

  const dataEncoding = dataAnalysis 
    ? runDataEncoding(inputData, dataAnalysis, version, errorLevel)
    : null;

  const errorCorrection = runErrorCorrection(dataEncoding, version, errorLevel);

  const messageConstruction = errorCorrection
    ? constructMessage(errorCorrection)
    : null;

  // TODO: Step 5-7 구현 (모듈 배치, 마스킹, 포맷 정보)
  const qrGeneration = [] as number[][];

  return {
    dataAnalysis,
    dataEncoding,
    errorCorrection,
    messageConstruction,
    qrGeneration,
  };
};