export type QRMode =
  | 'numeric' // 숫자 모드 (0-9)
  | 'alphanumeric' // 영숫자 모드 (0-9, A-Z, 9개 특수문자)
  | 'byte' // 8비트 바이트 모드
  | 'kanji'; // 한자 모드

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type QRVersion =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40;

export interface QRConfig {
  version: QRVersion;
  errorLevel: ErrorCorrectionLevel;
  mode: QRMode;
}

export interface DataAnalysisResult {
  recommendedMode: QRMode;
  minimumVersion: QRVersion;
  characterCount: number;
  isValid: boolean;
  segments?: ModeSegment[];
}

export interface ModeSegment {
  mode: QRMode;
  data: string;
  start: number;
  end: number;
}

export interface ErrorCorrectionData {
  dataCodewords: number[];
  ecCodewords: number[];
  interleavedCodewords: number[];
  totalCodewords: number;
  dataBlocks: number[][];
  ecBlocks: number[][];
  remainderBits: number;
}

export interface ModulePlacementData {
  version: QRVersion;
  subSteps: Array<{
    matrix: (0 | 1 | null)[][];
    moduleTypes: string[][];
    stepName: string;
    description: string;
    addedModules: number;
  }>;
  finalMatrix: (0 | 1 | null)[][];
  finalModuleTypes: string[][];
  size: number;
  totalDataModules: number;
  usedDataModules: number;
}
