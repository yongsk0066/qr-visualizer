import { pipe } from '@mobily/ts-belt';
import type { BinarizationResult, Pattern, Point } from '../../types';

// Finder 패턴의 1:1:3:1:1 비율 검증
const RATIO_TOLERANCE = 0.5; // 50% 허용 오차

/**
 * 1:1:3:1:1 비율 체크
 * stateCount: [black, white, black(center 3x), white, black] 순서
 */
const checkRatio = (stateCount: number[]): boolean => {
  let totalWidth = 0;
  for (let i = 0; i < 5; i++) {
    const count = stateCount[i];
    if (count === 0) return false;
    totalWidth += count;
  }

  if (totalWidth < 7) return false;

  const moduleSize = totalWidth / 7.0;
  const tolerance = moduleSize * RATIO_TOLERANCE;

  return (
    Math.abs(moduleSize - stateCount[0]) <= tolerance &&
    Math.abs(moduleSize - stateCount[1]) <= tolerance &&
    Math.abs(moduleSize * 3 - stateCount[2]) <= tolerance &&
    Math.abs(moduleSize - stateCount[3]) <= tolerance &&
    Math.abs(moduleSize - stateCount[4]) <= tolerance
  );
};

/**
 * 수직 방향으로 1:1:3:1:1 패턴 확인
 */
const checkVertical = (
  binary: Uint8Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  maxCount: number
): Pattern | null => {
  const stateCount = [0, 0, 0, 0, 0];
  let y = centerY;

  // 중앙에서 위로 스캔 (중앙은 검은색)
  while (y >= 0 && binary[y * width + centerX] === 1) {
    stateCount[2]++;
    y--;
  }
  if (y < 0) return null;

  while (y >= 0 && binary[y * width + centerX] === 0 && stateCount[1] <= maxCount) {
    stateCount[1]++;
    y--;
  }
  if (y < 0 || stateCount[1] > maxCount) return null;

  while (y >= 0 && binary[y * width + centerX] === 1 && stateCount[0] <= maxCount) {
    stateCount[0]++;
    y--;
  }
  if (stateCount[0] > maxCount) return null;

  // 중앙에서 아래로 스캔
  y = centerY + 1;
  while (y < height && binary[y * width + centerX] === 1) {
    stateCount[2]++;
    y++;
  }
  if (y === height) return null;

  while (y < height && binary[y * width + centerX] === 0 && stateCount[3] <= maxCount) {
    stateCount[3]++;
    y++;
  }
  if (y === height || stateCount[3] > maxCount) return null;

  while (y < height && binary[y * width + centerX] === 1 && stateCount[4] <= maxCount) {
    stateCount[4]++;
    y++;
  }
  if (stateCount[4] > maxCount) return null;

  // 비율 체크
  if (!checkRatio(stateCount)) return null;

  const totalWidth = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  const centerYShift = (totalWidth - stateCount[2]) / 2 - stateCount[3] - stateCount[4];

  return {
    x: centerX,
    y: centerY + centerYShift,
    size: (totalWidth / 7.0) * 7, // 전체 패턴 크기
  };
};

/**
 * 수평 방향으로 1:1:3:1:1 패턴 확인
 */
const checkHorizontal = (
  binary: Uint8Array,
  width: number,
  _height: number,
  centerX: number,
  centerY: number,
  maxCount: number
): Pattern | null => {
  const stateCount = [0, 0, 0, 0, 0];
  let x = centerX;

  // 중앙에서 왼쪽으로 스캔
  while (x >= 0 && binary[centerY * width + x] === 1) {
    stateCount[2]++;
    x--;
  }
  if (x < 0) return null;

  while (x >= 0 && binary[centerY * width + x] === 0 && stateCount[1] <= maxCount) {
    stateCount[1]++;
    x--;
  }
  if (x < 0 || stateCount[1] > maxCount) return null;

  while (x >= 0 && binary[centerY * width + x] === 1 && stateCount[0] <= maxCount) {
    stateCount[0]++;
    x--;
  }
  if (stateCount[0] > maxCount) return null;

  // 중앙에서 오른쪽으로 스캔
  x = centerX + 1;
  while (x < width && binary[centerY * width + x] === 1) {
    stateCount[2]++;
    x++;
  }
  if (x === width) return null;

  while (x < width && binary[centerY * width + x] === 0 && stateCount[3] <= maxCount) {
    stateCount[3]++;
    x++;
  }
  if (x === width || stateCount[3] > maxCount) return null;

  while (x < width && binary[centerY * width + x] === 1 && stateCount[4] <= maxCount) {
    stateCount[4]++;
    x++;
  }
  if (stateCount[4] > maxCount) return null;

  // 비율 체크
  if (!checkRatio(stateCount)) return null;

  const totalWidth = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  const centerXShift = (totalWidth - stateCount[2]) / 2 - stateCount[3] - stateCount[4];

  return {
    x: centerX + centerXShift,
    y: centerY,
    size: (totalWidth / 7.0) * 7,
  };
};

/**
 * 한 라인을 스캔하여 Finder 패턴 찾기
 */
const scanLine = (
  binary: Uint8Array,
  width: number,
  height: number,
  y: number,
  skipModules: number = 3
): Pattern[] => {
  const candidates: Pattern[] = [];
  const stateCount = [0, 0, 0, 0, 0];
  let currentState = 0;

  for (let x = 0; x < width; x++) {
    const pixel = binary[y * width + x];

    // 0,2,4 상태는 검은색(1), 1,3 상태는 흰색(0)
    const expectedColor = currentState & 1 ? 0 : 1;
    if (pixel === expectedColor) {
      // 같은 색상이면 카운트 증가
      stateCount[currentState]++;
    } else {
      // 색상이 바뀌면 상태 전환
      if (currentState === 4) {
        // 5개 상태를 모두 수집했으면 비율 체크
        if (checkRatio(stateCount)) {
          // 중심점 계산
          const centerX = x - stateCount[3] - stateCount[4] - Math.floor(stateCount[2] / 2);

          // 수직 방향으로도 패턴이 있는지 확인
          const pattern = checkVertical(binary, width, height, centerX, y, stateCount[2]);
          if (pattern) {
            // 수평 방향으로도 재확인
            const horizontal = checkHorizontal(
              binary,
              width,
              height,
              Math.round(pattern.x),
              Math.round(pattern.y),
              stateCount[2]
            );
            if (horizontal) {
              candidates.push({
                x: horizontal.x,
                y: horizontal.y,
                size: (pattern.size + horizontal.size) / 2,
              });

              // 성능을 위해 몇 픽셀 건너뛰기
              x += skipModules;
            }
          }
        }

        // 상태 시프트
        stateCount[0] = stateCount[2];
        stateCount[1] = stateCount[3];
        stateCount[2] = stateCount[4];
        stateCount[3] = 1;
        stateCount[4] = 0;
        currentState = 3;
      } else {
        currentState++;
        stateCount[currentState] = 1;
      }
    }
  }

  return candidates;
};

/**
 * 수직 라인 스캔
 */
const scanVerticalLine = (
  binary: Uint8Array,
  width: number,
  height: number,
  x: number,
  skipModules: number = 3
): Pattern[] => {
  const candidates: Pattern[] = [];
  const stateCount = [0, 0, 0, 0, 0];
  let currentState = 0;

  for (let y = 0; y < height; y++) {
    const pixel = binary[y * width + x];

    // 0,2,4 상태는 검은색(1), 1,3 상태는 흰색(0)
    const expectedColor = currentState & 1 ? 0 : 1;
    if (pixel === expectedColor) {
      stateCount[currentState]++;
    } else {
      if (currentState === 4) {
        if (checkRatio(stateCount)) {
          const centerY = y - stateCount[3] - stateCount[4] - Math.floor(stateCount[2] / 2);

          const pattern = checkHorizontal(binary, width, height, x, centerY, stateCount[2]);
          if (pattern) {
            const vertical = checkVertical(
              binary,
              width,
              height,
              Math.round(pattern.x),
              Math.round(pattern.y),
              stateCount[2]
            );
            if (vertical) {
              candidates.push({
                x: vertical.x,
                y: vertical.y,
                size: (pattern.size + vertical.size) / 2,
              });

              y += skipModules;
            }
          }
        }

        stateCount[0] = stateCount[2];
        stateCount[1] = stateCount[3];
        stateCount[2] = stateCount[4];
        stateCount[3] = 1;
        stateCount[4] = 0;
        currentState = 3;
      } else {
        currentState++;
        stateCount[currentState] = 1;
      }
    }
  }

  return candidates;
};

/**
 * Finder 패턴 후보 찾기 - 라인 스캐닝 알고리즘
 */
export const findFinderCandidates = (
  binary: Uint8Array,
  width: number,
  height: number
): Pattern[] => {
  const candidates: Pattern[] = [];
  const skipLines = 3; // 성능을 위해 몇 라인씩 건너뛰기

  // 수평 스캔
  for (let y = 0; y < height; y += skipLines) {
    const lineCandidates = scanLine(binary, width, height, y);
    candidates.push(...lineCandidates);
  }

  // 수직 스캔 (회전된 QR 코드를 위해)
  for (let x = 0; x < width; x += skipLines) {
    const lineCandidates = scanVerticalLine(binary, width, height, x);
    candidates.push(...lineCandidates);
  }

  return candidates;
};

/**
 * 근처 후보들을 클러스터링
 */

const clusterCandidates = (candidates: Pattern[]): Pattern[] => {
  if (candidates.length === 0) return [];

  const clusters: Pattern[] = [];
  const threshold = 10; // 클러스터링 임계값

  for (const candidate of candidates) {
    let merged = false;

    for (const cluster of clusters) {
      const dist = Math.sqrt(
        Math.pow(candidate.x - cluster.x, 2) + Math.pow(candidate.y - cluster.y, 2)
      );

      if (dist < threshold) {
        // 평균으로 업데이트
        const clusterWithCount = cluster as Pattern & { count?: number };
        const count = clusterWithCount.count || 1;
        cluster.x = (cluster.x * count + candidate.x) / (count + 1);
        cluster.y = (cluster.y * count + candidate.y) / (count + 1);
        cluster.size = (cluster.size * count + candidate.size) / (count + 1);
        clusterWithCount.count = count + 1;
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({ ...candidate });
    }
  }

  return clusters;
};

/**
 * 3개의 Finder 패턴 선택 - 개선된 버전
 */
export const selectThreeFinders = (candidates: Pattern[]): [Point, Point, Point] | null => {
  if (candidates.length < 3) return null;

  let bestTriplet: [Pattern, Pattern, Pattern] | null = null;
  let bestScore = Infinity;

  // 모든 3개 조합 검사
  for (let i = 0; i < candidates.length - 2; i++) {
    for (let j = i + 1; j < candidates.length - 1; j++) {
      for (let k = j + 1; k < candidates.length; k++) {
        const [a, b, c] = [candidates[i], candidates[j], candidates[k]];

        // 크기가 비슷한지 확인
        const sizes = [a.size, b.size, c.size];
        const avgSize = (a.size + b.size + c.size) / 3;
        const maxSizeDiff = Math.max(...sizes.map(s => Math.abs(s - avgSize))) / avgSize;
        
        if (maxSizeDiff > 0.3) continue;

        // 거리 계산
        const distAB = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        const distBC = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2));
        const distCA = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));

        // 최소 거리 확인
        if (Math.min(distAB, distBC, distCA) < 50) continue;

        // QR 코드는 직각 이등변 삼각형 형태
        // 두 변의 길이가 비슷하고, 한 변(대각선)이 √2배
        const distances = [distAB, distBC, distCA].sort((x, y) => x - y);
        const [short1, short2, long] = distances;
        
        // 두 짧은 변의 비율 (1에 가까워야 함)
        const shortRatio = short2 / short1;
        // 긴 변과 짧은 변의 비율 (√2 ≈ 1.414에 가까워야 함)
        const longRatio = long / short1;
        
        // 직각 삼각형 검증 (피타고라스 정리)
        const rightAngleError = Math.abs(short1 * short1 + short2 * short2 - long * long) / (long * long);
        
        // 점수 계산 (낮을수록 좋음)
        const score = Math.abs(shortRatio - 1) + Math.abs(longRatio - 1.414) + rightAngleError * 10 + maxSizeDiff;
        
        if (score < bestScore) {
          bestScore = score;
          bestTriplet = [a, b, c];
        }
      }
    }
  }

  if (!bestTriplet || bestScore > 1.0) {
    return null;
  }

  // 위치 결정
  const [a, b, c] = bestTriplet;
  
  // 각 변의 거리
  const distAB = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  const distBC = Math.sqrt(Math.pow(b.x - c.x, 2) + Math.pow(b.y - c.y, 2));
  const distCA = Math.sqrt(Math.pow(c.x - a.x, 2) + Math.pow(c.y - a.y, 2));
  
  let topLeft: Pattern, topRight: Pattern, bottomLeft: Pattern;
  
  // 가장 긴 변의 반대편 점이 직각 꼭지점
  if (distAB >= distBC && distAB >= distCA) {
    // C가 직각 꼭지점
    if (c.y < (a.y + b.y) / 2) {
      // C가 위쪽
      if (c.x < (a.x + b.x) / 2) {
        topLeft = c;
        topRight = a.x > b.x ? a : b;
        bottomLeft = a.x > b.x ? b : a;
      } else {
        topRight = c;
        topLeft = a.x < b.x ? a : b;
        bottomLeft = a.x < b.x ? b : a;
      }
    } else {
      // C가 아래쪽
      bottomLeft = c;
      topLeft = a.y < b.y ? a : b;
      topRight = a.y < b.y ? b : a;
    }
  } else if (distBC >= distAB && distBC >= distCA) {
    // A가 직각 꼭지점
    if (a.y < (b.y + c.y) / 2) {
      // A가 위쪽
      if (a.x < (b.x + c.x) / 2) {
        topLeft = a;
        topRight = b.x > c.x ? b : c;
        bottomLeft = b.x > c.x ? c : b;
      } else {
        topRight = a;
        topLeft = b.x < c.x ? b : c;
        bottomLeft = b.x < c.x ? c : b;
      }
    } else {
      // A가 아래쪽
      bottomLeft = a;
      topLeft = b.y < c.y ? b : c;
      topRight = b.y < c.y ? c : b;
    }
  } else {
    // B가 직각 꼭지점
    if (b.y < (a.y + c.y) / 2) {
      // B가 위쪽
      if (b.x < (a.x + c.x) / 2) {
        topLeft = b;
        topRight = a.x > c.x ? a : c;
        bottomLeft = a.x > c.x ? c : a;
      } else {
        topRight = b;
        topLeft = a.x < c.x ? a : c;
        bottomLeft = a.x < c.x ? c : a;
      }
    } else {
      // B가 아래쪽
      bottomLeft = b;
      topLeft = a.y < c.y ? a : c;
      topRight = a.y < c.y ? c : a;
    }
  }
  
  
  return [
    { x: topLeft.x, y: topLeft.y },
    { x: topRight.x, y: topRight.y },
    { x: bottomLeft.x, y: bottomLeft.y },
  ];
};

// Run-length 스캔 관련 타입과 함수는 유지
export interface RunLength {
  start: number;
  length: number;
  value: number;
}

export const scanRunLengths = (
  binary: Uint8Array,
  width: number,
  height: number,
  direction: 'horizontal' | 'vertical'
): RunLength[] => {
  const runs: RunLength[] = [];

  if (direction === 'horizontal') {
    for (let y = 0; y < height; y++) {
      let currentValue = binary[y * width];
      let runStart = 0;
      let runLength = 1;

      for (let x = 1; x < width; x++) {
        const value = binary[y * width + x];
        if (value === currentValue) {
          runLength++;
        } else {
          runs.push({ start: runStart, length: runLength, value: currentValue });
          currentValue = value;
          runStart = x;
          runLength = 1;
        }
      }
      runs.push({ start: runStart, length: runLength, value: currentValue });
    }
  } else {
    for (let x = 0; x < width; x++) {
      let currentValue = binary[x];
      let runStart = 0;
      let runLength = 1;

      for (let y = 1; y < height; y++) {
        const value = binary[y * width + x];
        if (value === currentValue) {
          runLength++;
        } else {
          runs.push({ start: runStart, length: runLength, value: currentValue });
          currentValue = value;
          runStart = y;
          runLength = 1;
        }
      }
      runs.push({ start: runStart, length: runLength, value: currentValue });
    }
  }

  return runs;
};

/**
 * Finder 검출 파이프라인
 */
export const detectFinders = (binarization: BinarizationResult) => {
  return pipe(
    binarization,
    (b) => {
      const candidates = findFinderCandidates(b.binary, b.width, b.height);
      return candidates;
    },
    (candidates) => {
      const clustered = clusterCandidates(candidates);
      return clustered;
    },
    (candidates) => {
      const selected = selectThreeFinders(candidates);
      return {
        candidates,
        selected,
      };
    }
  );
};
