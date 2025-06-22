/**
 * 타이밍 패턴을 분석하여 정확한 모듈 수를 계산
 */
export function countTimingPatternModules(
  binary: Uint8Array,
  width: number,
  height: number,
  topLeftPattern: { center: { x: number; y: number }; size: number },
  topRightPattern: { center: { x: number; y: number }; size: number },
  bottomLeftPattern: { center: { x: number; y: number }; size: number }
): number | null {
  // Finder Pattern은 7x7 모듈이므로 중심에서 3.5 모듈 떨어진 곳이 가장자리
  const moduleSize = topLeftPattern.size / 7;

  // 타이밍 패턴의 행/열 위치 (6번째 행/열, 0-indexed)
  // Top-left finder pattern의 중심에서 2.5 모듈 더하면 6번째 행/열
  const timingRow = Math.round(topLeftPattern.center.y + 2.5 * moduleSize);
  const timingCol = Math.round(topLeftPattern.center.x + 2.5 * moduleSize);

  // 수평 타이밍 패턴 분석 (TL에서 TR까지)
  const horizontalStart = Math.round(
    topLeftPattern.center.x + topLeftPattern.size / 2 + moduleSize
  );
  const horizontalEnd = Math.round(
    topRightPattern.center.x - topRightPattern.size / 2 - moduleSize
  );

  // 수직 타이밍 패턴 분석 (TL에서 BL까지)
  const verticalStart = Math.round(topLeftPattern.center.y + topLeftPattern.size / 2 + moduleSize);
  const verticalEnd = Math.round(
    bottomLeftPattern.center.y - bottomLeftPattern.size / 2 - moduleSize
  );

  // 수평 타이밍 패턴 스캔
  const horizontalModules = scanTimingPattern(
    binary,
    width,
    horizontalStart,
    timingRow,
    horizontalEnd - horizontalStart,
    true // horizontal
  );

  const verticalModules = scanTimingPattern(
    binary,
    width,
    timingCol,
    verticalStart,
    verticalEnd - verticalStart,
    false // vertical
  );

  // 타이밍 패턴 모듈 수 + Finder Pattern (7) + Separator (1)
  // 전체 모듈 수 = 타이밍 패턴 모듈 수 + 14 (양쪽 Finder 7x2) + 2 (양쪽 Separator)
  const totalModulesH = horizontalModules > 0 ? horizontalModules + 16 : 0;
  const totalModulesV = verticalModules > 0 ? verticalModules + 16 : 0;

  // 두 값이 비슷하면 평균, 아니면 더 큰 값 사용
  let totalModules = 0;
  if (totalModulesH > 0 && totalModulesV > 0) {
    if (Math.abs(totalModulesH - totalModulesV) <= 2) {
      totalModules = Math.round((totalModulesH + totalModulesV) / 2);
    } else {
      totalModules = Math.max(totalModulesH, totalModulesV);
    }
  } else {
    totalModules = totalModulesH || totalModulesV;
  }

  // 가장 가까운 유효한 QR 크기 찾기
  const validSizes = [];
  for (let v = 1; v <= 40; v++) {
    validSizes.push(17 + 4 * v);
  }

  let closestSize = validSizes[0];
  let minDiff = Math.abs(totalModules - closestSize);

  for (const size of validSizes) {
    const diff = Math.abs(totalModules - size);
    if (diff < minDiff) {
      minDiff = diff;
      closestSize = size;
    }
  }

  return closestSize;
}

/**
 * 타이밍 패턴을 스캔하여 모듈 수 계산
 */
function scanTimingPattern(
  binary: Uint8Array,
  width: number,
  startX: number,
  startY: number,
  length: number,
  horizontal: boolean
): number {
  const samples = [];

  // 픽셀 단위로 샘플링 (각 픽셀마다)
  for (let i = 0; i < length; i++) {
    const x = horizontal ? startX + i : startX;
    const y = horizontal ? startY : startY + i;

    if (x >= 0 && x < width && y >= 0 && y < width) {
      const idx = Math.round(y) * width + Math.round(x);
      samples.push(binary[idx] > 128 ? 1 : 0);
    }
  }

  if (samples.length === 0) return 0;

  // 연속된 같은 색상 구간 찾기
  const runs: { color: number; length: number }[] = [];
  let currentColor = samples[0];
  let currentLength = 1;

  for (let i = 1; i < samples.length; i++) {
    if (samples[i] === currentColor) {
      currentLength++;
    } else {
      runs.push({ color: currentColor, length: currentLength });
      currentColor = samples[i];
      currentLength = 1;
    }
  }
  runs.push({ color: currentColor, length: currentLength });

  // 평균 런 길이로 모듈 크기 추정
  const avgRunLength = runs.reduce((sum, run) => sum + run.length, 0) / runs.length;

  // 타이밍 패턴은 모듈마다 색이 바뀌므로, 런의 개수 = 모듈 수
  // 하지만 각 런이 여러 픽셀로 구성되어 있으므로, 전체 길이를 평균 런 길이로 나누어 계산
  const moduleCount = Math.round(length / avgRunLength);

  return moduleCount;
}
