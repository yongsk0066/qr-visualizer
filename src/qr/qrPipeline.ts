import { analyzeData } from './analysis/dataAnalysis';
import { runDataEncoding } from './encoding/dataEncoding';
import { runErrorCorrection } from './error-correction/errorCorrection';
import { constructMessage } from './message-construction/messageConstruction';
import { runModulePlacement } from './module-placement/modulePlacement';
import { generateAllEncodingMaskMatrices, evaluateAllMaskPatterns } from './masking/maskPatterns';
import { generateFinalQR, type FinalQRResult } from './final-generation/finalGeneration';
import type { ErrorCorrectionLevel, QRVersion, DataAnalysisResult, ErrorCorrectionData, ModulePlacementData } from '../shared/types';
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
  modulePlacement: ModulePlacementData | null;
  finalGeneration: FinalQRResult | null;
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

  const modulePlacement = messageConstruction
    ? runModulePlacement(version, messageConstruction.finalBitStream)
    : null;

  // Step 7: Final QR Generation
  const finalGeneration = modulePlacement ? (() => {
    const { matrix, moduleTypes } = modulePlacement.subSteps[modulePlacement.subSteps.length - 1];
    
    // 마스킹 평가 및 최적 패턴 선택
    const encodingMaskMatrices = generateAllEncodingMaskMatrices(version, moduleTypes);
    const evaluationResults = evaluateAllMaskPatterns(matrix, encodingMaskMatrices);
    const selectedEvaluation = evaluationResults.find(e => e.isSelected);
    
    if (!selectedEvaluation) {
      return null;
    }
    
    const selectedMaskMatrix = encodingMaskMatrices[selectedEvaluation.pattern];
    
    // 최종 QR 코드 생성
    return generateFinalQR(
      matrix,
      selectedMaskMatrix,
      selectedEvaluation.pattern,
      version,
      errorLevel
    );
  })() : null;

  return {
    dataAnalysis,
    dataEncoding,
    errorCorrection,
    messageConstruction,
    modulePlacement,
    finalGeneration,
  };
};