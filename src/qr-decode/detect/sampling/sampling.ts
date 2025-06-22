import type { HomographyResult, TriStateQR } from '../../types';

/**
 * Homography 변환된 이미지에서 모듈을 샘플링하여 tri-state 행렬 생성
 * 각 모듈을 black(0), white(1), unknown(-1)로 분류
 */
export const runSampling = (
  imageData: ImageData,
  homography: HomographyResult
): TriStateQR | null => {
  const cv = window.cv;

  if (!imageData || !homography) {
    return null;
  }
  
  if (!homography.qrSize || homography.qrSize <= 0) {
    return null;
  }

  try {
    const { qrSize } = homography; // 모듈 수 (예: 65)
    const moduleSize = imageData.width / qrSize; // 픽셀당 모듈 크기

    // 결과 행렬 초기화
    const matrix: (-1 | 0 | 1)[][] = Array(qrSize)
      .fill(null)
      .map(() => Array(qrSize).fill(-1));

    // 통계 초기화
    let blackCount = 0;
    let whiteCount = 0;
    let unknownCount = 0;

    // 이미지를 Mat으로 변환
    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 각 모듈 샘플링
    for (let row = 0; row < qrSize; row++) {
      for (let col = 0; col < qrSize; col++) {
        // 모듈 중심 좌표 계산
        const centerX = Math.floor((col + 0.5) * moduleSize);
        const centerY = Math.floor((row + 0.5) * moduleSize);

        // 샘플링 영역 (모듈의 중앙 60% 영역)
        const sampleSize = Math.max(1, Math.floor(moduleSize * 0.6));
        const halfSample = Math.floor(sampleSize / 2);

        const startX = Math.max(0, centerX - halfSample);
        const endX = Math.min(imageData.width - 1, centerX + halfSample);
        const startY = Math.max(0, centerY - halfSample);
        const endY = Math.min(imageData.height - 1, centerY + halfSample);

        // 샘플 영역의 평균값 계산
        let sum = 0;
        let count = 0;

        for (let y = startY; y <= endY; y++) {
          for (let x = startX; x <= endX; x++) {
            sum += gray.ucharAt(y, x);
            count++;
          }
        }

        if (count > 0) {
          const avgValue = sum / count;

          // 임계값 기반 분류
          // TODO: 더 정교한 임계값 계산 (Otsu, adaptive 등)
          const threshold = 128;

          if (avgValue < threshold - 20) {
            matrix[row][col] = 0; // Black
            blackCount++;
          } else if (avgValue > threshold + 20) {
            matrix[row][col] = 1; // White
            whiteCount++;
          } else {
            matrix[row][col] = -1; // Unknown
            unknownCount++;
          }
        }
      }
    }

    // Finder Pattern 위치 (디버깅용)
    const finderPositions: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [
      { x: 3, y: 3 }, // Top-left
      { x: qrSize - 4, y: 3 }, // Top-right
      { x: 3, y: qrSize - 4 }, // Bottom-left
    ];

    // 정리
    src.delete();
    gray.delete();

    return {
      size: qrSize,
      matrix,
      finder: finderPositions,
      statistics: {
        black: blackCount,
        white: whiteCount,
        unknown: unknownCount,
      },
    };
  } catch (error) {
    console.error('Sampling error:', error);
    return null;
  }
};
