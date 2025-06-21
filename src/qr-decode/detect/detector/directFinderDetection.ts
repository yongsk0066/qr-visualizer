import type { FinderPattern, FinderDetectionResult } from '../../types';

/**
 * 정렬된 QR 이미지에서 직접 Finder Pattern 검출
 * OpenCV 윤곽선 검출 대신 직접 패턴 매칭 사용
 */
export const detectFindersDirectly = (
  binary: Uint8Array,
  width: number,
  height: number
): FinderDetectionResult | null => {
  
  // 예상되는 모듈 크기 계산 (여러 QR 버전에 대해)
  const possibleVersions = [10, 11, 12, 13, 14, 15]; // 가능한 버전들
  
  for (const version of possibleVersions) {
    const moduleCount = 17 + 4 * version;
    const moduleSize = width / moduleCount;
    
    // Finder Pattern 크기 (7x7 모듈)
    const finderSize = moduleSize * 7;
    
    // 예상되는 Finder Pattern 중심 위치
    const expectedPositions = [
      { x: moduleSize * 3.5, y: moduleSize * 3.5 }, // Top-left
      { x: width - moduleSize * 3.5, y: moduleSize * 3.5 }, // Top-right
      { x: moduleSize * 3.5, y: height - moduleSize * 3.5 } // Bottom-left
    ];
    
    // 각 위치에서 Finder Pattern 검증
    const patterns: FinderPattern[] = [];
    
    for (const pos of expectedPositions) {
      if (verifyFinderPattern(binary, width, pos.x, pos.y, moduleSize)) {
        patterns.push({
          center: pos,
          size: finderSize,
          corners: [
            { x: pos.x - finderSize/2, y: pos.y - finderSize/2 },
            { x: pos.x + finderSize/2, y: pos.y - finderSize/2 },
            { x: pos.x + finderSize/2, y: pos.y + finderSize/2 },
            { x: pos.x - finderSize/2, y: pos.y + finderSize/2 }
          ],
          score: 100
        });
      }
    }
    
    // 3개 모두 찾았으면 성공
    if (patterns.length === 3) {
      console.log(`Direct detection successful for version ${version}`);
      
      // 시각화를 위한 캔버스 생성
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      return {
        patterns,
        candidates: patterns,
        visualizationCanvas: canvas,
        confidence: 1.0
      };
    }
  }
  
  return null;
};

/**
 * 특정 위치에 Finder Pattern이 있는지 검증
 * 1:1:3:1:1 비율 확인
 */
function verifyFinderPattern(
  binary: Uint8Array,
  width: number,
  centerX: number,
  centerY: number,
  moduleSize: number
): boolean {
  
  // 중심에서 수평선 스캔
  const y = Math.floor(centerY);
  const startX = Math.floor(centerX - moduleSize * 3.5);
  const endX = Math.floor(centerX + moduleSize * 3.5);
  
  if (startX < 0 || endX >= width || y < 0 || y >= binary.length / width) {
    return false;
  }
  
  // 픽셀 값 읽기
  const scanLine: number[] = [];
  for (let x = startX; x <= endX; x++) {
    const idx = y * width + x;
    scanLine.push(binary[idx] > 128 ? 1 : 0);
  }
  
  // 연속된 같은 색상 구간 찾기
  const runs: { color: number; length: number }[] = [];
  let currentColor = scanLine[0];
  let currentLength = 1;
  
  for (let i = 1; i < scanLine.length; i++) {
    if (scanLine[i] === currentColor) {
      currentLength++;
    } else {
      runs.push({ color: currentColor, length: currentLength });
      currentColor = scanLine[i];
      currentLength = 1;
    }
  }
  runs.push({ color: currentColor, length: currentLength });
  
  // 5개 구간이 있어야 함 (흑-백-흑-백-흑)
  if (runs.length < 5) return false;
  
  // 가운데 5개 구간 선택
  const middleIndex = Math.floor(runs.length / 2);
  const patternRuns = runs.slice(middleIndex - 2, middleIndex + 3);
  
  if (patternRuns.length !== 5) return false;
  
  // 흑-백-흑-백-흑 패턴 확인
  if (patternRuns[0].color !== 0 || 
      patternRuns[1].color !== 1 || 
      patternRuns[2].color !== 0 || 
      patternRuns[3].color !== 1 || 
      patternRuns[4].color !== 0) {
    return false;
  }
  
  // 1:1:3:1:1 비율 확인 (약간의 오차 허용)
  const unit = moduleSize;
  const tolerance = 0.5;
  
  const expectedLengths = [unit, unit, unit * 3, unit, unit];
  
  for (let i = 0; i < 5; i++) {
    const ratio = patternRuns[i].length / expectedLengths[i];
    if (ratio < 1 - tolerance || ratio > 1 + tolerance) {
      return false;
    }
  }
  
  return true;
}