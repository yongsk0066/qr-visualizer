// OpenCV 타입 인터페이스
export interface OpenCVMat {
  rows: number;
  cols: number;
  data: Uint8Array;
  data32S: Int32Array;
  delete(): void;
  doubleAt(row: number, col: number): number;
  ucharAt(row: number, col: number): number;
}

export interface OpenCVMatVector {
  size(): number;
  get(index: number): OpenCVMat;
  delete(): void;
}

export interface OpenCVSize {
  width: number;
  height: number;
}

export interface OpenCVPoint {
  x: number;
  y: number;
}

export interface OpenCVRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OpenCVScalar {
  0: number;
  1: number;
  2: number;
  3: number;
}

export interface OpenCVMoments {
  m00: number;
  m10: number;
  m01: number;
  m20: number;
  m11: number;
  m02: number;
  m30: number;
  m21: number;
  m12: number;
  m03: number;
}

// OpenCV.js 타입 정의
declare global {
  interface Window {
    cv: {
      Mat: {
        new (): OpenCVMat;
      };
      MatVector: {
        new (): OpenCVMatVector;
      };
      Size: {
        new (width: number, height: number): OpenCVSize;
      };
      Point: {
        new (x: number, y: number): OpenCVPoint;
      };
      Rect: {
        new (x: number, y: number, width: number, height: number): OpenCVRect;
      };
      Scalar: {
        new (r: number, g: number, b: number, a?: number): OpenCVScalar;
      };
      RETR_TREE: number;
      CHAIN_APPROX_SIMPLE: number;
      CV_8UC1: number;
      CV_32FC2: number;
      CV_64F: number;
      COLOR_RGBA2GRAY: number;
      COLOR_GRAY2RGBA: number;
      INTER_LINEAR: number;
      matFromArray: (rows: number, cols: number, type: number, array: number[]) => OpenCVMat;
      matFromImageData: (imageData: ImageData) => OpenCVMat;
      findContours: (image: OpenCVMat, contours: OpenCVMatVector, hierarchy: OpenCVMat, mode: number, method: number) => void;
      approxPolyDP: (curve: OpenCVMat, approxCurve: OpenCVMat, epsilon: number, closed: boolean) => void;
      arcLength: (curve: OpenCVMat, closed: boolean) => number;
      contourArea: (contour: OpenCVMat) => number;
      boundingRect: (contour: OpenCVMat) => OpenCVRect;
      moments: (contour: OpenCVMat) => OpenCVMoments;
      convexHull: (contour: OpenCVMat, hull: OpenCVMat) => void;
      cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
      getPerspectiveTransform: (src: OpenCVMat, dst: OpenCVMat) => OpenCVMat;
      warpPerspective: (src: OpenCVMat, dst: OpenCVMat, M: OpenCVMat, dsize: OpenCVSize, flags: number) => void;
      onRuntimeInitialized?: () => void;
    };
  }
}

