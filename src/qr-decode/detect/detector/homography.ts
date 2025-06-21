import type { FinderDetectionResult, HomographyResult } from '../../types';
import { countTimingPatternModules } from './timingPatternCounter';

// OpenCV.js를 전역 변수로 사용
declare global {
  interface Window {
    cv: any;
  }
}

/**
 * 두 직선의 교점 계산
 */
function calculateLineIntersection(
  line1: { p1: { x: number; y: number }; p2: { x: number; y: number } },
  line2: { p1: { x: number; y: number }; p2: { x: number; y: number } }
): { x: number; y: number } | null {
  const x1 = line1.p1.x, y1 = line1.p1.y;
  const x2 = line1.p2.x, y2 = line1.p2.y;
  const x3 = line2.p1.x, y3 = line2.p1.y;
  const x4 = line2.p2.x, y4 = line2.p2.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return null; // 평행선
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1)
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
  binarizedImage?: Uint8Array
): HomographyResult | null => {
  console.log('runHomography called with:', { imageWidth, imageHeight });
  const cv = window.cv;
  
  if (!finderDetection || finderDetection.patterns.length !== 3) {
    console.error('Homography requires exactly 3 finder patterns');
    return null;
  }

  try {
    // 3개의 Finder Pattern 추출
    const patterns = finderDetection.patterns;
    
    // Finder Pattern의 중심점들을 정렬 (top-left, top-right, bottom-left)
    const sortedPatterns = sortFinderPatterns(patterns);
    console.log('Sorted patterns:', sortedPatterns);
    
    // Finder Pattern 크기 추정 (평균)
    const avgFinderSize = (
      sortedPatterns.topLeft.size + 
      sortedPatterns.topRight.size + 
      sortedPatterns.bottomLeft.size
    ) / 3;
    
    // QR 코드 버전 추정 (패턴 간 거리 기반)
    let estimatedVersion = estimateQRVersion(sortedPatterns);
    
    // 펼쳐진 이미지인 경우 (정사각형)
    if (imageWidth === imageHeight && sortedPatterns.topLeft.corners && sortedPatterns.topRight.corners && binarizedImage) {
      // 타이밍 패턴을 사용한 정확한 모듈 수 계산
      const timingModules = countTimingPatternModules(
        binarizedImage,
        imageWidth,
        imageHeight,
        sortedPatterns.topLeft,
        sortedPatterns.topRight,
        sortedPatterns.bottomLeft,
        avgFinderSize / 7  // 모듈 크기 전달
      );
      
      if (timingModules) {
        const timingVersion = (timingModules - 17) / 4;
        console.log('Timing pattern based version:', {
          modules: timingModules,
          version: timingVersion
        });
        
        estimatedVersion = timingVersion;
      } else {
        // 타이밍 패턴 실패시 기존 방법 사용
        // TL의 가장 왼쪽과 TR의 가장 오른쪽 사이 거리 = 전체 QR 너비
        const tlLeftmost = Math.min(...sortedPatterns.topLeft.corners.map(c => c.x));
        const trRightmost = Math.max(...sortedPatterns.topRight.corners.map(c => c.x));
        const totalWidth = trRightmost - tlLeftmost;
        
        // 모듈 크기 = Finder Pattern 크기 / 7
        const moduleSize = avgFinderSize / 7;
        
        // 전체 모듈 수 = 전체 너비 / 모듈 크기
        const calculatedModules = Math.round(totalWidth / moduleSize);
        
        // 디버깅을 위한 다른 계산 방법들
        const method2Modules = Math.round(imageWidth / moduleSize);
        const method3Modules = Math.round(totalWidth / (avgFinderSize / 7));
        
        
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
        
        console.log(`Rectified image version estimation (fallback):`, {
          tlLeftmost,
          trRightmost,
          totalWidth,
          finderSize: avgFinderSize,
          moduleSize,
          calculatedModules,
          method2Modules,
          method3Modules,
          closestValidModules: closestModules,
          version: calculatedVersion
        });
        
        estimatedVersion = calculatedVersion;
      }
    }
    
    const moduleCount = 17 + estimatedVersion * 4; // 버전별 모듈 수
    
    console.log(`Estimated version: ${estimatedVersion}, Module count: ${moduleCount}`);
    
    // 네 번째 점 계산 (bottom-right) - 평행사변형 법칙 사용
    // bottomRight = topRight + (bottomLeft - topLeft)
    const bottomRightX = sortedPatterns.topRight.center.x + (sortedPatterns.bottomLeft.center.x - sortedPatterns.topLeft.center.x);
    const bottomRightY = sortedPatterns.topRight.center.y + (sortedPatterns.bottomLeft.center.y - sortedPatterns.topLeft.center.y);
    
    // QR 코드가 정사각형에 가까운지 확인
    const topEdgeLength = Math.sqrt(
      Math.pow(sortedPatterns.topRight.center.x - sortedPatterns.topLeft.center.x, 2) +
      Math.pow(sortedPatterns.topRight.center.y - sortedPatterns.topLeft.center.y, 2)
    );
    const leftEdgeLength = Math.sqrt(
      Math.pow(sortedPatterns.bottomLeft.center.x - sortedPatterns.topLeft.center.x, 2) +
      Math.pow(sortedPatterns.bottomLeft.center.y - sortedPatterns.topLeft.center.y, 2)
    );
    
    console.log('Edge lengths:', {
      top: topEdgeLength,
      left: leftEdgeLength,
      ratio: topEdgeLength / leftEdgeLength
    });
    
    console.log('Source points:', {
      topLeft: sortedPatterns.topLeft.center,
      topRight: sortedPatterns.topRight.center,
      bottomLeft: sortedPatterns.bottomLeft.center,
      bottomRight: { x: bottomRightX, y: bottomRightY }
    });
    
    // Finder Pattern corners를 직접 사용한 정확한 변환
    const calculateQRCornersWithCV = () => {
      const moduleSize = avgFinderSize / 7;
      const margin = 0; // margin 제거 - Finder Pattern 외곽선을 정확히 사용
      
      // 각 Finder Pattern에서 QR 코드 외곽 corner 선택
      const getOuterCorner = (pattern: typeof sortedPatterns.topLeft, position: 'topLeft' | 'topRight' | 'bottomLeft') => {
        if (!pattern.corners || pattern.corners.length !== 4) {
          // corners가 없으면 center 기반 계산
          const offset = moduleSize * 3.5; // Finder Pattern 중심에서 외곽까지는 3.5 모듈
          switch(position) {
            case 'topLeft':
              return { x: pattern.center.x - offset, y: pattern.center.y - offset };
            case 'topRight':
              return { x: pattern.center.x + offset, y: pattern.center.y - offset };
            case 'bottomLeft':
              return { x: pattern.center.x - offset, y: pattern.center.y + offset };
          }
        }
        
        // corners에서 가장 바깥쪽 점 선택
        const corners = pattern.corners;
        switch(position) {
          case 'topLeft':
            // 왼쪽 위 (x + y 최소)
            return corners.reduce((min, c) => 
              (c.x + c.y < min.x + min.y) ? c : min
            );
          case 'topRight':
            // 오른쪽 위 (x 최대, y 최소)
            return corners.reduce((best, c) => 
              (c.x - c.y > best.x - best.y) ? c : best
            );
          case 'bottomLeft':
            // 왼쪽 아래 (x 최소, y 최대)
            return corners.reduce((best, c) => 
              (c.y - c.x > best.y - best.x) ? c : best
            );
        }
      };
      
      // 3개 Finder Pattern의 외곽 corner 가져오기 (margin 추가)
      const tlCornerRaw = getOuterCorner(sortedPatterns.topLeft, 'topLeft');
      const trCornerRaw = getOuterCorner(sortedPatterns.topRight, 'topRight');
      const blCornerRaw = getOuterCorner(sortedPatterns.bottomLeft, 'bottomLeft');
      
      // margin 적용
      const tlCorner = { x: tlCornerRaw.x - margin, y: tlCornerRaw.y - margin };
      const trCorner = { x: trCornerRaw.x + margin, y: trCornerRaw.y - margin };
      const blCorner = { x: blCornerRaw.x - margin, y: blCornerRaw.y + margin };
      
      // Finder Pattern의 연장선을 사용한 BR 코너 검출
      let brCorner = { x: 0, y: 0 };
      
      if (sortedPatterns.topRight.corners && sortedPatterns.bottomLeft.corners &&
          sortedPatterns.topRight.corners.length === 4 && sortedPatterns.bottomLeft.corners.length === 4) {
        
        // Top-right Finder의 오른쪽 변 찾기
        const trCorners = sortedPatterns.topRight.corners;
        // 오른쪽 변을 구성하는 두 점 (x가 가장 큰 2개)
        const rightEdgePoints = [...trCorners]
          .sort((a, b) => b.x - a.x)
          .slice(0, 2)
          .sort((a, b) => a.y - b.y); // 위에서 아래 순서
        
        // Bottom-left Finder의 아래쪽 변 찾기
        const blCorners = sortedPatterns.bottomLeft.corners;
        // 아래쪽 변을 구성하는 두 점 (y가 가장 큰 2개)
        const bottomEdgePoints = [...blCorners]
          .sort((a, b) => b.y - a.y)
          .slice(0, 2)
          .sort((a, b) => a.x - b.x); // 왼쪽에서 오른쪽 순서
        
        console.log('Edge points for BR calculation:', {
          rightEdge: rightEdgePoints,
          bottomEdge: bottomEdgePoints
        });
        
        // 두 직선의 교점 계산
        const intersection = calculateLineIntersection(
          { p1: rightEdgePoints[0], p2: rightEdgePoints[1] },
          { p1: bottomEdgePoints[0], p2: bottomEdgePoints[1] }
        );
        
        if (intersection) {
          // 약간의 padding 추가 (BR 방향으로, 즉 오른쪽 아래로)
          const padding = moduleSize * 1.0;
          brCorner = {
            x: intersection.x + padding,
            y: intersection.y + padding
          };
          console.log('BR from Finder Pattern intersection:', brCorner);
        } else {
          // 교점 계산 실패시 기본값
          brCorner = {
            x: blCorner.x + (trCorner.x - tlCorner.x),
            y: trCorner.y + (blCorner.y - tlCorner.y)
          };
        }
      } else {
        // corners 정보가 없으면 기본값 사용
        brCorner = {
          x: blCorner.x + (trCorner.x - tlCorner.x),
          y: trCorner.y + (blCorner.y - tlCorner.y)
        };
      }
      
      return { tlCorner, trCorner, blCorner, brCorner };
    };
    
    // QR 코드의 네 모서리 계산
    const { tlCorner, trCorner, blCorner, brCorner } = calculateQRCornersWithCV();
    
    console.log('QR corners calculated:', {
      topLeft: tlCorner,
      topRight: trCorner,
      bottomLeft: blCorner,
      bottomRight: brCorner,
      moduleSize: avgFinderSize / 7
    });
    
    // 소스 포인트 (실제 이미지에서의 좌표) - 시계방향 순서
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      tlCorner.x, tlCorner.y,
      trCorner.x, trCorner.y,
      brCorner.x, brCorner.y,
      blCorner.x, blCorner.y
    ]);
    
    // 목적지 포인트 (정규화된 사각형)
    // 모듈당 픽셀 수를 계산하여 정확한 크기 설정
    const pixelsPerModule = 10; // 각 모듈당 10픽셀
    const squareSize = moduleCount * pixelsPerModule;
    
    // QR 코드는 전체가 정사각형이므로 간단하게 설정
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,                           // Top-left
      squareSize, 0,                  // Top-right
      squareSize, squareSize,         // Bottom-right
      0, squareSize                   // Bottom-left
    ]);
    
    console.log('Destination square:', {
      size: squareSize
    });
    
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
      { x: 0, y: squareSize }
    ];
    
    // 정리
    srcPoints.delete();
    dstPoints.delete();
    homographyMatrix.delete();
    
    return {
      transform,
      corners: corners as [any, any, any, any],
      version: estimatedVersion,
      qrSize: moduleCount
    };
  } catch (error) {
    console.error('Homography calculation error:', error);
    return null;
  }
};

/**
 * Finder Pattern을 위치에 따라 정렬
 * Top-left, Top-right, Bottom-left 순서로 정렬
 */
function sortFinderPatterns(patterns: typeof FinderDetectionResult.prototype.patterns) {
  // 패턴들의 중심점 복사
  const points = patterns.map(p => ({
    pattern: p,
    x: p.center.x,
    y: p.center.y
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
  
  console.log('Pattern positions:', {
    topLeft: { x: topLeft.x, y: topLeft.y },
    topRight: { x: topRight.x, y: topRight.y },
    bottomLeft: { x: bottomLeft.x, y: bottomLeft.y }
  });
  
  return {
    topLeft: topLeft.pattern,
    topRight: topRight.pattern,
    bottomLeft: bottomLeft.pattern
  };
}

/**
 * Finder Pattern 간 거리를 기반으로 QR 코드 버전 추정
 */
function estimateQRVersion(sortedPatterns: ReturnType<typeof sortFinderPatterns>): number {
  // Finder Pattern 크기 평균
  const avgFinderSize = (
    sortedPatterns.topLeft.size + 
    sortedPatterns.topRight.size + 
    sortedPatterns.bottomLeft.size
  ) / 3;
  
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
  const weightedEstimate = (
    baseEstimate * 1.0 +
    horizontalModules * 0.8 +
    verticalModules * 1.2 +
    diagonalModules * 1.0
  ) / 4.0;
  
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
  
  // 디버깅: 근처 버전들의 차이 확인
  const nearbyVersions = versions
    .filter(v => Math.abs(v.version - bestVersion) <= 2)
    .map(v => ({
      version: v.version,
      modules: v.modules,
      diff: Math.abs(estimatedModules - v.modules)
    }));
  
  console.log('Version estimation:', {
    finderSize: avgFinderSize,
    moduleSize,
    centerDistances: { horizontal: centerDistH, vertical: centerDistV, average: avgCenterDist },
    modulesBetweenCenters,
    estimates: {
      base: baseEstimate,
      horizontal: horizontalModules,
      vertical: verticalModules,
      diagonal: diagonalModules,
      average: estimatedModules
    },
    bestVersion,
    expectedModules: 17 + 4 * bestVersion,
    nearbyVersions
  });
  
  return bestVersion;
}

/**
 * Homography 변환을 적용하여 이미지 워프
 */
export const applyHomography = (
  imageData: ImageData,
  homography: HomographyResult
): ImageData => {
  const cv = window.cv;
  
  console.log('Applying homography with transform:', homography.transform);
  
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
  
  console.log('Output size:', outputSize.width, 'x', outputSize.height);
  
  // 워프 적용
  cv.warpPerspective(gray, dst, H, outputSize, cv.INTER_LINEAR);
  
  // 다시 RGBA로 변환
  const rgba = new cv.Mat();
  cv.cvtColor(dst, rgba, cv.COLOR_GRAY2RGBA);
  
  // ImageData로 변환
  const imgData = new ImageData(
    new Uint8ClampedArray(rgba.data),
    rgba.cols,
    rgba.rows
  );
  
  // 정리
  src.delete();
  gray.delete();
  dst.delete();
  rgba.delete();
  H.delete();
  
  return imgData;
};