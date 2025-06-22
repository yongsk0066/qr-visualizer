import type { FinderDetectionResult, HomographyResult } from '../../types';
import { countTimingPatternModules } from './timingPatternCounter';

/**
 * 두 직선의 교점 계산
 */
function calculateLineIntersection(
  line1: { p1: { x: number; y: number }; p2: { x: number; y: number } },
  line2: { p1: { x: number; y: number }; p2: { x: number; y: number } }
): { x: number; y: number } | null {
  const x1 = line1.p1.x,
    y1 = line1.p1.y;
  const x2 = line1.p2.x,
    y2 = line1.p2.y;
  const x3 = line2.p1.x,
    y3 = line2.p1.y;
  const x4 = line2.p2.x,
    y4 = line2.p2.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return null; // 평행선

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

/**
 * Homography 변환을 계산하여 QR 코드를 정면에서 본 것처럼 변환
 * 3개의 Finder Pattern을 기준으로 원근 변환 행렬 계산
 */
export const runHomography = (
  finderDetection: FinderDetectionResult,
  imageWidth: number,
  imageHeight: number,
  binarizedImage?: Uint8Array,
  usePadding: boolean = true
): HomographyResult | null => {
  const cv = window.cv;

  if (!finderDetection || finderDetection.patterns.length !== 3) {
    return null;
  }

  try {
    // 3개의 Finder Pattern 추출
    const patterns = finderDetection.patterns;

    // Finder Pattern의 중심점들을 정렬 (top-left, top-right, bottom-left)
    const sortedPatterns = sortFinderPatterns(patterns);

    // Finder Pattern 크기 추정 (평균)
    const avgFinderSize =
      (sortedPatterns.topLeft.size +
        sortedPatterns.topRight.size +
        sortedPatterns.bottomLeft.size) /
      3;

    // QR 코드 버전 추정 (패턴 간 거리 기반)
    let estimatedVersion = estimateQRVersion(sortedPatterns);

    // 펼쳐진 이미지인 경우 (정사각형)
    if (
      imageWidth === imageHeight &&
      sortedPatterns.topLeft.corners &&
      sortedPatterns.topRight.corners &&
      binarizedImage
    ) {
      // 타이밍 패턴을 사용한 정확한 모듈 수 계산
      const timingModules = countTimingPatternModules(
        binarizedImage,
        imageWidth,
        imageHeight,
        sortedPatterns.topLeft,
        sortedPatterns.topRight,
        sortedPatterns.bottomLeft
      );

      if (timingModules) {
        const timingVersion = (timingModules - 17) / 4;

        estimatedVersion = timingVersion;
      } else {
        // 타이밍 패턴 실패시 기존 방법 사용
        // TL의 가장 왼쪽과 TR의 가장 오른쪽 사이 거리 = 전체 QR 너비
        const tlLeftmost = Math.min(...sortedPatterns.topLeft.corners.map((c) => c.x));
        const trRightmost = Math.max(...sortedPatterns.topRight.corners.map((c) => c.x));
        const totalWidth = trRightmost - tlLeftmost;

        // 모듈 크기 = Finder Pattern 크기 / 7
        const moduleSize = avgFinderSize / 7;

        // 전체 모듈 수 = 전체 너비 / 모듈 크기
        const calculatedModules = Math.round(totalWidth / moduleSize);

        // 가장 가까운 유효한 QR 크기 찾기
        const validModuleCounts = [];
        for (let v = 1; v <= 40; v++) {
          validModuleCounts.push(17 + 4 * v);
        }

        let closestModules = validModuleCounts[0];
        let minDiff = Math.abs(calculatedModules - closestModules);

        for (const modules of validModuleCounts) {
          const diff = Math.abs(calculatedModules - modules);
          if (diff < minDiff) {
            minDiff = diff;
            closestModules = modules;
          }
        }

        const calculatedVersion = (closestModules - 17) / 4;

        estimatedVersion = calculatedVersion;
      }
    }

    const moduleCount = 17 + estimatedVersion * 4; // 버전별 모듈 수

    // Finder Pattern corners를 직접 사용한 정확한 변환
    const calculateQRCornersWithCV = () => {
      const moduleSize = avgFinderSize / 7;

      // 모든 4개 모서리를 교점으로 계산
      let tlCorner = { x: 0, y: 0 };
      let trCorner = { x: 0, y: 0 };
      let blCorner = { x: 0, y: 0 };
      let brCorner = { x: 0, y: 0 };

      if (
        sortedPatterns.topLeft.corners &&
        sortedPatterns.topRight.corners &&
        sortedPatterns.bottomLeft.corners &&
        sortedPatterns.topLeft.corners.length === 4 &&
        sortedPatterns.topRight.corners.length === 4 &&
        sortedPatterns.bottomLeft.corners.length === 4
      ) {
        // TL Corner: Top-left의 왼쪽 변과 위쪽 변의 교점
        const tlLeftEdge = [...sortedPatterns.topLeft.corners]
          .sort((a, b) => a.x - b.x)
          .slice(0, 2)
          .sort((a, b) => a.y - b.y);
        const tlTopEdge = [...sortedPatterns.topLeft.corners]
          .sort((a, b) => a.y - b.y)
          .slice(0, 2)
          .sort((a, b) => a.x - b.x);

        const tlIntersection = calculateLineIntersection(
          { p1: tlLeftEdge[0], p2: tlLeftEdge[1] },
          { p1: tlTopEdge[0], p2: tlTopEdge[1] }
        );
        if (tlIntersection) tlCorner = tlIntersection;

        // TR Corner: Top-right의 오른쪽 변과 위쪽 변의 교점
        const trRightEdge = [...sortedPatterns.topRight.corners]
          .sort((a, b) => b.x - a.x)
          .slice(0, 2)
          .sort((a, b) => a.y - b.y);
        const trTopEdge = [...sortedPatterns.topRight.corners]
          .sort((a, b) => a.y - b.y)
          .slice(0, 2)
          .sort((a, b) => a.x - b.x);

        const trIntersection = calculateLineIntersection(
          { p1: trRightEdge[0], p2: trRightEdge[1] },
          { p1: trTopEdge[0], p2: trTopEdge[1] }
        );
        if (trIntersection) trCorner = trIntersection;

        // BL Corner: Bottom-left의 왼쪽 변과 아래쪽 변의 교점
        const blLeftEdge = [...sortedPatterns.bottomLeft.corners]
          .sort((a, b) => a.x - b.x)
          .slice(0, 2)
          .sort((a, b) => a.y - b.y);
        const blBottomEdge = [...sortedPatterns.bottomLeft.corners]
          .sort((a, b) => b.y - a.y)
          .slice(0, 2)
          .sort((a, b) => a.x - b.x);

        const blIntersection = calculateLineIntersection(
          { p1: blLeftEdge[0], p2: blLeftEdge[1] },
          { p1: blBottomEdge[0], p2: blBottomEdge[1] }
        );
        if (blIntersection) blCorner = blIntersection;

        // BR Corner: Top-right의 오른쪽 변과 Bottom-left의 아래쪽 변의 연장선 교점
        const brIntersection = calculateLineIntersection(
          { p1: trRightEdge[0], p2: trRightEdge[1] },
          { p1: blBottomEdge[0], p2: blBottomEdge[1] }
        );
        if (brIntersection) brCorner = brIntersection;
      } else {
        // corners 정보가 없으면 기본값 사용
        const offset = moduleSize * 3.5; // Finder Pattern 중심에서 외곽까지는 3.5 모듈
        tlCorner = {
          x: sortedPatterns.topLeft.center.x - offset,
          y: sortedPatterns.topLeft.center.y - offset,
        };
        trCorner = {
          x: sortedPatterns.topRight.center.x + offset,
          y: sortedPatterns.topRight.center.y - offset,
        };
        blCorner = {
          x: sortedPatterns.bottomLeft.center.x - offset,
          y: sortedPatterns.bottomLeft.center.y + offset,
        };
        brCorner = {
          x: blCorner.x + (trCorner.x - tlCorner.x),
          y: trCorner.y + (blCorner.y - tlCorner.y),
        };
      }

      // 대각선의 교점(중심점) 계산
      const center = calculateLineIntersection(
        { p1: tlCorner, p2: brCorner }, // TL-BR 대각선
        { p1: trCorner, p2: blCorner } // TR-BL 대각선
      ) || {
        x: (tlCorner.x + trCorner.x + blCorner.x + brCorner.x) / 4,
        y: (tlCorner.y + trCorner.y + blCorner.y + brCorner.y) / 4,
      };

      // 패딩 적용 여부에 따른 처리
      if (usePadding) {
        // 중심점 기준으로 패딩 적용 (10% 확대) - 첫 번째 homography에서만 사용
        const paddingScale = 1.1;
        const paddedTL = {
          x: center.x + (tlCorner.x - center.x) * paddingScale,
          y: center.y + (tlCorner.y - center.y) * paddingScale,
        };
        const paddedTR = {
          x: center.x + (trCorner.x - center.x) * paddingScale,
          y: center.y + (trCorner.y - center.y) * paddingScale,
        };
        const paddedBL = {
          x: center.x + (blCorner.x - center.x) * paddingScale,
          y: center.y + (blCorner.y - center.y) * paddingScale,
        };
        const paddedBR = {
          x: center.x + (brCorner.x - center.x) * paddingScale,
          y: center.y + (brCorner.y - center.y) * paddingScale,
        };

        return {
          tlCorner: paddedTL,
          trCorner: paddedTR,
          blCorner: paddedBL,
          brCorner: paddedBR,
        };
      } else {
        // 패딩 없이 정확한 교점 사용
        return {
          tlCorner,
          trCorner,
          blCorner,
          brCorner,
        };
      }
    };

    // QR 코드의 네 모서리 계산
    const { tlCorner, trCorner, blCorner, brCorner } = calculateQRCornersWithCV();

    // 소스 포인트 (실제 이미지에서의 좌표) - 시계방향 순서
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tlCorner.x,
      tlCorner.y,
      trCorner.x,
      trCorner.y,
      brCorner.x,
      brCorner.y,
      blCorner.x,
      blCorner.y,
    ]);

    // 목적지 포인트 (정규화된 사각형)
    // 모듈당 픽셀 수를 계산하여 정확한 크기 설정
    const pixelsPerModule = 10; // 각 모듈당 10픽셀
    const squareSize = moduleCount * pixelsPerModule;

    // QR 코드는 전체가 정사각형이므로 간단하게 설정
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0, // Top-left
      squareSize,
      0, // Top-right
      squareSize,
      squareSize, // Bottom-right
      0,
      squareSize, // Bottom-left
    ]);

    // Homography 행렬 계산
    // 4개의 점으로 정확한 homography 계산
    const homographyMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);

    // 행렬을 Float64Array로 변환
    const transform = new Float64Array(9);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        transform[i * 3 + j] = homographyMatrix.doubleAt(i, j);
      }
    }

    // 코너 좌표 계산
    const corners = [
      { x: 0, y: 0 },
      { x: squareSize, y: 0 },
      { x: squareSize, y: squareSize },
      { x: 0, y: squareSize },
    ];

    // 정리
    srcPoints.delete();
    dstPoints.delete();
    homographyMatrix.delete();

    return {
      transform,
      corners: corners as [
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number },
        { x: number; y: number }
      ],
      version: estimatedVersion,
      qrSize: moduleCount,
    };
  } catch {
    return null;
  }
};

/**
 * Finder Pattern을 위치에 따라 정렬
 * Top-left, Top-right, Bottom-left 순서로 정렬
 */
function sortFinderPatterns(patterns: FinderDetectionResult['patterns']) {
  // 패턴들의 중심점 복사
  const points = patterns.map((p) => ({
    pattern: p,
    x: p.center.x,
    y: p.center.y,
  }));

  // Y 좌표로 정렬하여 상단 2개와 하단 1개 구분
  points.sort((a, b) => a.y - b.y);

  // 상단 2개 (y값이 작은 2개)
  const topTwo = points.slice(0, 2);
  // 하단 1개 (y값이 가장 큰 1개)
  const bottomOne = points[2];

  // 상단 2개를 x 좌표로 정렬
  topTwo.sort((a, b) => a.x - b.x);

  const topLeft = topTwo[0];
  const topRight = topTwo[1];
  const bottomLeft = bottomOne;

  return {
    topLeft: topLeft.pattern,
    topRight: topRight.pattern,
    bottomLeft: bottomLeft.pattern,
  };
}

/**
 * Finder Pattern 간 거리를 기반으로 QR 코드 버전 추정
 */
function estimateQRVersion(sortedPatterns: ReturnType<typeof sortFinderPatterns>): number {
  // Finder Pattern 크기 평균
  const avgFinderSize =
    (sortedPatterns.topLeft.size + sortedPatterns.topRight.size + sortedPatterns.bottomLeft.size) /
    3;

  // 모듈 크기 = Finder Pattern 크기 / 7
  // perspective distortion 보정 (약 8%)
  const perspectiveCorrection = 1.08;
  const moduleSize = (avgFinderSize / 7) * perspectiveCorrection;

  // Finder Pattern 중심 간 거리
  const centerDistH = sortedPatterns.topRight.center.x - sortedPatterns.topLeft.center.x;
  const centerDistV = sortedPatterns.bottomLeft.center.y - sortedPatterns.topLeft.center.y;
  const avgCenterDist = (centerDistH + centerDistV) / 2;

  // 중심 간 거리를 모듈 수로 변환
  const modulesBetweenCenters = avgCenterDist / moduleSize;

  // QR 코드 전체 모듈 수 = 중심 간 모듈 수 + 7
  // (Finder Pattern 중심은 외곽에서 3.5 모듈 떨어져 있음)
  // 하지만 실제로는 약간의 오차가 있을 수 있음
  const baseEstimate = modulesBetweenCenters + 7;

  // 다양한 추정 방법의 평균 사용
  const estimates = [];

  // 방법 1: 기본 추정
  estimates.push(baseEstimate);

  // 방법 2: 가로/세로 비율 고려
  const horizontalModules = centerDistH / moduleSize + 7;
  const verticalModules = centerDistV / moduleSize + 7;
  estimates.push((horizontalModules + verticalModules) / 2);

  // 방법 3: 대각선 거리 사용
  const diagonalDist = Math.sqrt(centerDistH * centerDistH + centerDistV * centerDistV);
  const diagonalModules = diagonalDist / moduleSize / Math.sqrt(2) + 7;
  estimates.push(diagonalModules);

  // 가중 평균 계산 - 수직 거리가 더 신뢰할 수 있음
  const weightedEstimate =
    (baseEstimate * 1.0 + horizontalModules * 0.8 + verticalModules * 1.2 + diagonalModules * 1.0) /
    4.0;

  const estimatedModules = weightedEstimate;

  // 가능한 QR 버전들과 그 모듈 수
  const versions = [];
  for (let v = 1; v <= 40; v++) {
    const modules = 17 + 4 * v;
    versions.push({ version: v, modules });
  }

  // 추정값과 가장 가까운 버전 찾기
  let bestVersion = 1;
  let minDiff = Math.abs(estimatedModules - 21);

  for (const { version, modules } of versions) {
    const diff = Math.abs(estimatedModules - modules);
    if (diff < minDiff) {
      minDiff = diff;
      bestVersion = version;
    }
  }

  return bestVersion;
}

/**
 * Homography 변환을 적용하여 이미지 워프
 */
export const applyHomography = (imageData: ImageData, homography: HomographyResult): ImageData => {
  const cv = window.cv;

  // 입력 이미지를 Mat으로 변환
  const src = cv.matFromImageData(imageData);

  // RGBA to grayscale 변환 (이진 이미지일 경우)
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  const dst = new cv.Mat();

  // Homography 행렬 생성
  const H = cv.matFromArray(3, 3, cv.CV_64F, Array.from(homography.transform));

  // 출력 크기 계산 - 모듈 수에 맞게 조정
  const pixelsPerModule = 10;
  const outputSize = new cv.Size(
    homography.qrSize * pixelsPerModule,
    homography.qrSize * pixelsPerModule
  );

  // 워프 적용
  cv.warpPerspective(gray, dst, H, outputSize, cv.INTER_LINEAR);

  // 다시 RGBA로 변환
  const rgba = new cv.Mat();
  cv.cvtColor(dst, rgba, cv.COLOR_GRAY2RGBA);

  // ImageData로 변환
  const imgData = new ImageData(new Uint8ClampedArray(rgba.data), rgba.cols, rgba.rows);

  // 정리
  src.delete();
  gray.delete();
  dst.delete();
  rgba.delete();
  H.delete();

  return imgData;
};
