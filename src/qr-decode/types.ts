// Common types for QR decode processes

export interface Point {
  x: number;
  y: number;
}

export interface Pattern {
  x: number;
  y: number;
  size: number;
}

export interface RunLength {
  start: number;
  length: number;
  value: number;
}

// DetectProcess types
export interface ImageProcessingResult {
  original: ImageData;
  grayscale: Uint8Array;
  width: number;
  height: number;
}

export interface GrayscaleResult {
  grayscale: Uint8Array;
  width: number;
  height: number;
  statistics: {
    min: number;
    max: number;
    mean: number;
    histogram: number[];
  };
}

export interface BinarizationResult {
  binary: Uint8Array; // 0/1 이진 이미지
  threshold: Float32Array; // Sauvola 임계값 맵
  width: number;
  height: number;
  parameters: {
    windowSize: number; // 15px
    k: number; // 0.34
  };
}

export interface TriStateQR {
  size: number; // 모듈 수 (21~177)
  matrix: (-1 | 0 | 1)[][]; // tri-state 행렬
  finder: [Point, Point, Point]; // 디버깅용
  statistics: {
    black: number; // 1의 개수
    white: number; // 0의 개수
    unknown: number; // -1의 개수
  };
}

// Homography types
export interface HomographyResult {
  transform: Float64Array; // 3x3 변환 행렬
  corners: [Point, Point, Point, Point];
  version: number; // 추정된 QR 버전
  qrSize: number; // QR 코드 크기 (모듈 수)
}

// Finder Detection types
export interface FinderPattern {
  center: { x: number; y: number };
  size: number;
  corners: Array<{ x: number; y: number }>;
  score: number;
}

export interface FinderDetectionResult {
  patterns: FinderPattern[]; // 선택된 3개의 패턴
  candidates: FinderPattern[]; // 모든 후보 패턴
  visualizationCanvas: HTMLCanvasElement;
  confidence: number; // 0-1 범위의 검출 신뢰도
  isRefinement?: boolean; // 정제 단계 여부
}

// Pipeline result types
export interface DetectPipelineResult {
  imageProcessing: ImageProcessingResult | null;
  grayscale: GrayscaleResult | null;
  binarization: BinarizationResult | null;
  finderDetection: FinderDetectionResult | null;
  homography: HomographyResult | null;
  sampling: TriStateQR | null;
  homographyImage: ImageData | null;
}
