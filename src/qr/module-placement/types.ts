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
  | 'empty';

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
}

export interface ModulePlacementResult {
  subSteps: SubStepResult[];
  finalMatrix: QRMatrix;
  finalModuleTypes: ModuleTypeMatrix;
  size: number;
  totalDataModules: number;
  usedDataModules: number;
}