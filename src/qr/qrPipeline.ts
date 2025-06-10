import { pipe } from '@mobily/ts-belt';
import type {
  DataAnalysisResult,
  ErrorCorrectionData,
  ErrorCorrectionLevel,
  ModulePlacementData,
  QRVersion,
} from '../shared/types';
import { analyzeData } from './analysis/dataAnalysis';
import type { EncodedData } from './encoding/dataEncoding';
import { runDataEncoding } from './encoding/dataEncoding';
import { runErrorCorrection } from './error-correction/errorCorrection';
import { runFinalGeneration, type FinalQRResult } from './final-generation/finalGeneration';
import type { MessageConstructionResult } from './message-construction/messageConstruction';
import { constructMessage } from './message-construction/messageConstruction';
import { runModulePlacement } from './module-placement/modulePlacement';

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

export const runQRPipeline = ({ inputData, qrVersion, errorLevel }: QRPipelineParams) => {
  const version = parseInt(qrVersion, 10) as QRVersion;

  return pipe(
    { inputData, version, errorLevel },

    // Step 1: Data Analysis
    (state) => ({
      ...state,
      dataAnalysis: state.inputData ? analyzeData(state.inputData, state.errorLevel) : null,
    }),

    // Step 2: Data Encoding
    (state) => ({
      ...state,
      dataEncoding: state.dataAnalysis
        ? runDataEncoding(state.inputData, state.dataAnalysis, state.version, state.errorLevel)
        : null,
    }),

    // Step 3: Error Correction
    (state) => ({
      ...state,
      errorCorrection: runErrorCorrection(state.dataEncoding, state.version, state.errorLevel),
    }),

    // Step 4: Message Construction
    (state) => ({
      ...state,
      messageConstruction: state.errorCorrection ? constructMessage(state.errorCorrection) : null,
    }),

    // Step 5: Module Placement
    (state) => ({
      ...state,
      modulePlacement: state.messageConstruction
        ? runModulePlacement(state.version, state.messageConstruction.finalBitStream)
        : null,
    }),

    // Step 6-7: Final Generation
    (state) => ({
      ...state,
      finalGeneration: state.modulePlacement
        ? runFinalGeneration(state.modulePlacement, state.version, state.errorLevel)
        : null,
    })
  );
};
