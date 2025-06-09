import type { QRVersion } from '../../shared/types';

export type QRModule = 0 | 1 | null; // 0=white, 1=black, null=unset/reserved
export type QRMatrix = QRModule[][];

export type ModuleType = 
  | 'finder'
  | 'separator' 
  | 'timing'
  | 'alignment'
  | 'format'
  | 'version'
  | 'data'
  | 'empty'
  | 'zigzag'
  | `byte-${number}`;

export type ModuleTypeMatrix = ModuleType[][];

export interface PatternPosition {
  row: number;
  col: number;
}

export interface SubStepResult {
  matrix: QRMatrix;
  moduleTypes: ModuleTypeMatrix;
  stepName: string;
  description: string;
  addedModules: number;
  byteBlocks?: number[][]; // 8비트 블록 정보 (선택적)
  zigzagOrder?: number[][]; // 지그재그 순서 정보 (선택적)
}

export interface ModulePlacementResult {
  version: QRVersion;
  subSteps: SubStepResult[];
  finalMatrix: QRMatrix;
  finalModuleTypes: ModuleTypeMatrix;
  size: number;
  totalDataModules: number;
  usedDataModules: number;
}