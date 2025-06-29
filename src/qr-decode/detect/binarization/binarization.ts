import type { BinarizationResult, GrayscaleResult } from '../../types';

// Sauvola 적응 임계값 이진화
export const sauvolaBinarization = (
  grayscale: Uint8Array,
  width: number,
  height: number,
  windowSize: number = 31, // 더 큰 윈도우 크기로 변경
  k: number = 0.2, // k 값 조정
  R: number = 128
): BinarizationResult => {
  const binary = new Uint8Array(width * height);
  const threshold = new Float32Array(width * height);
  const halfWindow = Math.floor(windowSize / 2);

  // 적분 이미지 계산 (빠른 로컬 평균/분산 계산용)
  const sum = new Uint32Array(width * height);
  const sqSum = new Float64Array(width * height);

  // 첫 번째 행
  for (let x = 0; x < width; x++) {
    const g = grayscale[x];
    sum[x] = (x > 0 ? sum[x - 1] : 0) + g;
    sqSum[x] = (x > 0 ? sqSum[x - 1] : 0) + g * g;
  }

  // 나머지 행
  for (let y = 1; y < height; y++) {
    let rowSum = 0;
    let rowSqSum = 0;

    for (let x = 0; x < width; x++) {
      const g = grayscale[y * width + x];
      rowSum += g;
      rowSqSum += g * g;

      const idx = y * width + x;
      sum[idx] = sum[(y - 1) * width + x] + rowSum;
      sqSum[idx] = sqSum[(y - 1) * width + x] + rowSqSum;
    }
  }

  // Sauvola 임계값 계산 및 이진화
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 윈도우 경계 계산
      const y1 = Math.max(0, y - halfWindow);
      const y2 = Math.min(height - 1, y + halfWindow);
      const x1 = Math.max(0, x - halfWindow);
      const x2 = Math.min(width - 1, x + halfWindow);

      // 적분 이미지를 사용한 빠른 합계 계산
      const area = (y2 - y1 + 1) * (x2 - x1 + 1);
      const s = getIntegralSum(sum, width, x1, y1, x2, y2);
      const sq = getIntegralSum(sqSum, width, x1, y1, x2, y2);

      const mean = s / area;
      const variance = sq / area - mean * mean;
      const std = Math.sqrt(Math.max(variance, 0));

      // Sauvola 공식: T = mean * (1 + k * (std/R - 1))
      const thr = mean * (1 + k * (std / R - 1));

      const idx = y * width + x;
      threshold[idx] = thr;

      // 임계값 적용 (어두운 부분=0, 밝은 부분=255)
      binary[idx] = grayscale[idx] > thr ? 255 : 0;
    }
  }

  return {
    binary,
    threshold,
    width,
    height,
    parameters: {
      windowSize,
      k,
    },
  };
};

// 적분 이미지에서 사각형 영역의 합 계산
const getIntegralSum = (
  integral: Uint32Array | Float64Array,
  width: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  let sum = integral[y2 * width + x2];

  if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
  if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];
  if (x1 > 0 && y1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];

  return sum;
};

// 이진화 파이프라인
export const runBinarization = ({
  grayscale,
  width,
  height,
}: GrayscaleResult): BinarizationResult => {
  return sauvolaBinarization(grayscale, width, height);
};
