import type { FormatInfoResult } from './format-extraction/types';
import type { ErrorCorrectionLevel } from '../../shared/types';

export interface DecodePipelineResult {
  formatInfo: FormatInfoResult | null;
  versionInfo: VersionInfoResult | null;
  unmaskedMatrix: (0 | 1)[][] | null;
  rawBitStream: string | null;
  codewords: CodewordBlocks | null;
  correctedData: CorrectedData | null;
  segments: DecodedSegment[] | null;
  decodedMessage: string | null;
  error?: DecodeError;
}

export interface VersionInfoResult {
  version: number;
  isValid: boolean;
  confidence: number;
}

export interface CodewordBlocks {
  dataBlocks: number[][];
  ecBlocks: number[][];
  totalCodewords: number;
}

export interface CorrectedData {
  correctedBlocks: number[][];
  errorsCorrected: number;
  isRecoverable: boolean;
}

export interface DecodedSegment {
  mode: 'numeric' | 'alphanumeric' | 'byte' | 'kanji';
  data: string;
  characterCount: number;
  bitLength: number;
}

export interface DecodeError {
  step: string;
  message: string;
  details?: any;
}