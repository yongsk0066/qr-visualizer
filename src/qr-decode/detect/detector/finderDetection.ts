import type { BinarizationResult, FinderDetectionResult, FinderPattern } from '../../types';
import type { OpenCVMat, OpenCVMatVector } from '../../../types/opencv';
import { distance } from '../../../shared/utils/geometry';

// OpenCV.js 초기화 확인
let cvReady = false;

export const initOpenCV = async (): Promise<void> => {
  if (cvReady) return;

  // OpenCV.js가 로드될 때까지 대기
  await new Promise<void>((resolve) => {
    if (window.cv && window.cv.Mat) {
      cvReady = true;
      resolve();
      return;
    }

    // cv.onRuntimeInitialized 체크
    if (window.cv) {
      window.cv.onRuntimeInitialized = () => {
        cvReady = true;
        resolve();
      };
    } else {
      // cv 객체가 아직 없으면 주기적으로 확인
      const checkInterval = setInterval(() => {
        if (window.cv) {
          clearInterval(checkInterval);
          if (window.cv.Mat) {
            cvReady = true;
            resolve();
          } else {
            window.cv.onRuntimeInitialized = () => {
              cvReady = true;
              resolve();
            };
          }
        }
      }, 100);
    }
  });
};

/**
 * Finder Pattern 검출 함수
 * OpenCV.js를 사용하여 윤곽선 기반으로 QR 코드의 Finder Pattern 검출
 */
export const runFinderDetection = async (
  binarization: BinarizationResult
): Promise<FinderDetectionResult> => {
  await initOpenCV();

  const { binary: data, width, height } = binarization;
  const cv = window.cv;

  // 이진화된 이미지를 OpenCV Mat으로 변환
  // 입력 데이터 확인 및 정규화
  const normalizedData = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // 0/1 형식을 0/255 형식으로 변환 (필요한 경우)
    if (data[i] === 0 || data[i] === 1) {
      normalizedData[i] = data[i] * 255;
    } else {
      normalizedData[i] = data[i];
    }
  }

  const mat = cv.matFromArray(height, width, cv.CV_8UC1, Array.from(normalizedData));

  // 윤곽선 검출을 위한 변수들
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    // 윤곽선 검출 (RETR_TREE: 전체 계층 구조 검출)
    // OpenCV는 흰색(255) 객체를 찾으므로, 현재 이미지가 맞는지 확인
    cv.findContours(mat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    const finderPatterns: FinderPattern[] = [];

    // 계층 구조를 이용한 Finder Pattern 검출
    // Finder Pattern은 3개의 중첩된 사각형 구조 (흑-백-흑)
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);

      // 윤곽선을 다각형으로 근사화
      let approx = new cv.Mat();
      const perimeter = cv.arcLength(contour, true);

      // 여러 epsilon 값으로 시도 (0.02부터 0.1까지)
      const epsilonValues = [0.02, 0.03, 0.04, 0.05, 0.07, 0.1];
      let isSquare = false;

      for (const epsilon of epsilonValues) {
        cv.approxPolyDP(contour, approx, epsilon * perimeter, true);
        if (approx.rows === 4) {
          isSquare = true;
          break;
        }
        // 4개가 아니면 다음 epsilon으로 재시도
        if (epsilon < epsilonValues[epsilonValues.length - 1]) {
          approx.delete();
          approx = new cv.Mat();
        }
      }

      // 사각형이 아니면 스킵
      if (!isSquare) {
        approx.delete();
        contour.delete();
        continue;
      }

      // 면적 계산 (이미지 크기에 상대적으로)
      const area = cv.contourArea(contour);
      const imageArea = width * height;
      const minAreaRatio = 0.00001; // 이미지 크기의 0.001%

      if (area < imageArea * minAreaRatio || area < 50) {
        // 너무 작은 윤곽선 제외
        approx.delete();
        contour.delete();
        continue;
      }

      // 너무 큰 윤곽선도 제외 (이미지의 50% 이상)
      if (area > imageArea * 0.5) {
        approx.delete();
        contour.delete();
        continue;
      }

      // 중심점 계산
      const moments = cv.moments(contour);
      const centerX = moments.m10 / moments.m00;
      const centerY = moments.m01 / moments.m00;

      // Finder Pattern 후보인지 확인 (3단계 중첩 구조)
      if (isFinderPatternCandidate(i, hierarchy, contours)) {
        // 경계 박스 계산 (boundingRect 사용)
        const rect = cv.boundingRect(contour);

        // approx에서 실제 코너 추출
        const corners = [];
        for (let j = 0; j < approx.rows; j++) {
          corners.push({
            x: approx.data32S[j * 2],
            y: approx.data32S[j * 2 + 1],
          });
        }

        // 4개의 코너가 있으면 시계방향으로 정렬
        if (corners.length === 4) {
          // 중심점 계산
          const cx = corners.reduce((sum, p) => sum + p.x, 0) / 4;
          const cy = corners.reduce((sum, p) => sum + p.y, 0) / 4;

          // 각도로 정렬
          corners.sort((a, b) => {
            const angleA = Math.atan2(a.y - cy, a.x - cx);
            const angleB = Math.atan2(b.y - cy, b.x - cx);
            return angleA - angleB;
          });
        }

        // 실제 패턴 크기 계산
        const adjustedSize = Math.max(rect.width, rect.height);

        finderPatterns.push({
          center: { x: centerX, y: centerY },
          size: adjustedSize,
          corners: corners,
          score: calculatePatternScore(contour),
        });
      }

      approx.delete();
      contour.delete();
    }

    // 상위 3개의 Finder Pattern 선택 (점수 기준)
    const selectedPatterns = selectBestThreePatterns(finderPatterns);

    // 검출 시각화를 위한 이미지 생성
    const visualizationCanvas = createVisualizationCanvas(
      binarization,
      finderPatterns,
      selectedPatterns
    );

    return {
      patterns: selectedPatterns,
      candidates: finderPatterns,
      visualizationCanvas,
      confidence: calculateDetectionConfidence(selectedPatterns),
    };
  } finally {
    // 정리
    mat.delete();
    contours.delete();
    hierarchy.delete();
  }
};

/**
 * Finder Pattern 후보인지 확인
 * 3단계 중첩 구조 (흑-백-흑)를 가지는지 검증
 */
function isFinderPatternCandidate(
  index: number,
  hierarchy: OpenCVMat,
  contours: OpenCVMatVector
): boolean {
  const hierarchyData = hierarchy.data32S;

  // 현재 윤곽선의 계층 정보
  const firstChild = hierarchyData[index * 4 + 2];
  if (firstChild === -1) return false; // 자식이 없으면 후보가 아님

  // 첫 번째 자식의 자식 확인 (3단계 구조)
  const secondChild = hierarchyData[firstChild * 4 + 2];
  if (secondChild === -1) return false;

  // 면적 비율 검증 (1:1:3:1:1 비율에 근사한지)
  const cv = window.cv;
  const outerContour = contours.get(index);
  const middleContour = contours.get(firstChild);
  const innerContour = contours.get(secondChild);

  const outerArea = cv.contourArea(outerContour);
  const middleArea = cv.contourArea(middleContour);
  const innerArea = cv.contourArea(innerContour);

  const ratio1 = middleArea / outerArea;
  const ratio2 = innerArea / middleArea;

  // 이론적 비율: middle/outer ≈ 9/25 = 0.36, inner/middle ≈ 1/9 = 0.11
  // 하지만 실제로는 면적 비율이 다를 수 있음 (픽셀 근사화, 회전, 변형 등)
  // 더 관대한 범위 설정
  let isValid = ratio1 > 0.15 && ratio1 < 0.8 && ratio2 > 0.05 && ratio2 < 0.6;

  // 추가 검증: 중심점이 거의 일치해야 함
  if (isValid) {
    const outerMoments = cv.moments(outerContour);
    const middleMoments = cv.moments(middleContour);
    const innerMoments = cv.moments(innerContour);

    const outerCenterX = outerMoments.m10 / outerMoments.m00;
    const outerCenterY = outerMoments.m01 / outerMoments.m00;
    const middleCenterX = middleMoments.m10 / middleMoments.m00;
    const middleCenterY = middleMoments.m01 / middleMoments.m00;
    const innerCenterX = innerMoments.m10 / innerMoments.m00;
    const innerCenterY = innerMoments.m01 / innerMoments.m00;

    // 중심점 간 거리 계산
    const dist1 = Math.sqrt(
      Math.pow(outerCenterX - middleCenterX, 2) + Math.pow(outerCenterY - middleCenterY, 2)
    );
    const dist2 = Math.sqrt(
      Math.pow(middleCenterX - innerCenterX, 2) + Math.pow(middleCenterY - innerCenterY, 2)
    );

    // 중심점이 너무 떨어져 있으면 패턴이 아님
    const maxDist = Math.sqrt(outerArea / Math.PI) * 0.2; // 외부 반경의 20%
    isValid = dist1 < maxDist && dist2 < maxDist;
  }

  outerContour.delete();
  middleContour.delete();
  innerContour.delete();

  return isValid;
}

/**
 * Finder Pattern의 품질 점수 계산
 */
function calculatePatternScore(contour: OpenCVMat): number {
  const cv = window.cv;
  let score = 100;

  // 경계 사각형을 사용하여 aspect ratio 계산
  const rect = cv.boundingRect(contour);
  const aspectRatio = Math.min(rect.width, rect.height) / Math.max(rect.width, rect.height);
  score += aspectRatio * 50; // 정사각형에 가까울수록(1에 가까울수록) 높은 점수

  // 면적이 클수록 높은 점수 (더 명확한 패턴)
  const area = cv.contourArea(contour);
  score += Math.log(area) * 5;

  // 컨투어의 컨벡스성 확인 (볼록할수록 좋음)
  const hull = new cv.Mat();
  cv.convexHull(contour, hull);
  const hullArea = cv.contourArea(hull);
  const convexity = area / hullArea;
  score += convexity * 20; // 볼록할수록 높은 점수
  hull.delete();

  // 둘레 대비 면적 비율 (원형도 체크)
  const perimeter = cv.arcLength(contour, true);
  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
  score += circularity * 30; // 원에 가까울수록 높은 점수 (정사각형은 ~0.785)

  return Math.max(0, score);
}

/**
 * 상위 3개의 Finder Pattern 선택
 */
function selectBestThreePatterns(patterns: FinderPattern[]): FinderPattern[] {
  if (patterns.length <= 3) return patterns;

  // 점수 기준 정렬
  const sorted = [...patterns].sort((a, b) => b.score - a.score);

  // 상위 3개 선택하되, 삼각형 구성 가능 여부 확인
  const selected: FinderPattern[] = [];

  for (const pattern of sorted) {
    if (selected.length === 0) {
      selected.push(pattern);
    } else if (selected.length === 1) {
      // 두 번째 패턴은 첫 번째와 너무 가깝지 않아야 함
      const dist = distance(selected[0].center, pattern.center);
      if (dist > pattern.size * 2) {
        selected.push(pattern);
      }
    } else if (selected.length === 2) {
      // 세 번째 패턴은 삼각형을 형성해야 함
      if (formsValidTriangle(selected[0], selected[1], pattern)) {
        selected.push(pattern);
        break;
      }
    }
  }

  return selected;
}


/**
 * 세 패턴이 유효한 삼각형을 형성하는지 확인
 */
function formsValidTriangle(p1: FinderPattern, p2: FinderPattern, p3: FinderPattern): boolean {
  const d1 = distance(p1.center, p2.center);
  const d2 = distance(p2.center, p3.center);
  const d3 = distance(p3.center, p1.center);

  // 삼각형 부등식
  if (d1 + d2 <= d3 || d2 + d3 <= d1 || d3 + d1 <= d2) {
    return false;
  }

  // 너무 찌그러진 삼각형 제외
  const maxDist = Math.max(d1, d2, d3);
  const minDist = Math.min(d1, d2, d3);

  return maxDist / minDist < 3; // 비율이 3배 이내
}

/**
 * 검출 신뢰도 계산
 */
function calculateDetectionConfidence(patterns: FinderPattern[]): number {
  if (patterns.length !== 3) return 0;

  // 평균 점수를 신뢰도로 사용
  const avgScore = patterns.reduce((sum, p) => sum + p.score, 0) / patterns.length;

  // 0-1 범위로 정규화
  return Math.min(1, avgScore / 100);
}

/**
 * 시각화 캔버스 생성
 */
function createVisualizationCanvas(
  binarization: BinarizationResult,
  allPatterns: FinderPattern[],
  selectedPatterns: FinderPattern[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = binarization.width;
  canvas.height = binarization.height;

  const ctx = canvas.getContext('2d')!;

  // 이진화 이미지를 배경으로
  const imageData = ctx.createImageData(binarization.width, binarization.height);
  const data = binarization.binary;
  for (let i = 0; i < data.length; i++) {
    // 원본 이진화 이미지 표시 (0=검은색, 255=흰색)
    const value = data[i];
    imageData.data[i * 4] = value;
    imageData.data[i * 4 + 1] = value;
    imageData.data[i * 4 + 2] = value;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  // 모든 후보 패턴 표시 (회색)
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  for (const pattern of allPatterns) {
    if (!selectedPatterns.includes(pattern)) {
      drawPattern(ctx, pattern, false);
    }
  }

  // 선택된 패턴 강조 표시 (빨간색)
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  for (const pattern of selectedPatterns) {
    drawPattern(ctx, pattern, true);
  }

  return canvas;
}

/**
 * 패턴 그리기
 */
function drawPattern(ctx: CanvasRenderingContext2D, pattern: FinderPattern, highlight: boolean) {
  // 중심점 표시
  ctx.beginPath();
  ctx.arc(pattern.center.x, pattern.center.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = highlight ? '#ff0000' : '#999999';
  ctx.fill();

  // 경계 박스 표시
  if (pattern.corners.length === 4) {
    ctx.beginPath();
    ctx.moveTo(pattern.corners[0].x, pattern.corners[0].y);
    for (let i = 1; i < pattern.corners.length; i++) {
      ctx.lineTo(pattern.corners[i].x, pattern.corners[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 점수 표시 (highlight인 경우만)
  if (highlight) {
    ctx.fillStyle = '#ff0000';
    ctx.font = '12px Arial';
    ctx.fillText(pattern.score.toFixed(1), pattern.center.x + 10, pattern.center.y - 10);
  }
}
