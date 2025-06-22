/**
 * QR Detection 테스트를 위한 픽스처
 */

/**
 * 간단한 Finder Pattern 생성 (7x7)
 */
export function createFinderPattern(): number[][] {
  return [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
}

/**
 * 테스트용 QR 코드 패턴 생성 (Version 1: 21x21)
 */
export function createTestQRPattern(): Uint8Array {
  const size = 21;
  const pattern = new Uint8Array(size * size).fill(255); // 흰색 배경
  
  const finderPattern = createFinderPattern();
  
  // Top-left finder pattern
  placePattern(pattern, size, finderPattern, 0, 0);
  
  // Top-right finder pattern
  placePattern(pattern, size, finderPattern, 14, 0);
  
  // Bottom-left finder pattern
  placePattern(pattern, size, finderPattern, 0, 14);
  
  // Timing patterns (수평/수직)
  for (let i = 8; i < 13; i++) {
    pattern[6 * size + i] = i % 2 === 0 ? 0 : 255; // 수평
    pattern[i * size + 6] = i % 2 === 0 ? 0 : 255; // 수직
  }
  
  return pattern;
}

/**
 * 패턴을 특정 위치에 배치
 */
function placePattern(
  target: Uint8Array,
  targetWidth: number,
  pattern: number[][],
  offsetX: number,
  offsetY: number
): void {
  for (let y = 0; y < pattern.length; y++) {
    for (let x = 0; x < pattern[y].length; x++) {
      const idx = (offsetY + y) * targetWidth + (offsetX + x);
      target[idx] = pattern[y][x] === 1 ? 0 : 255; // 1 = 검은색 (0), 0 = 흰색 (255)
    }
  }
}

/**
 * 테스트용 이진화된 이미지 생성
 */
export function createBinaryTestImage(width: number, height: number, pattern: 'checkerboard' | 'gradient' | 'solid' = 'solid'): Uint8Array {
  const data = new Uint8Array(width * height);
  
  switch (pattern) {
    case 'checkerboard':
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          data[y * width + x] = ((x + y) % 2 === 0) ? 0 : 255;
        }
      }
      break;
      
    case 'gradient':
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          data[y * width + x] = Math.floor((x / width) * 255);
        }
      }
      break;
      
    case 'solid':
    default:
      data.fill(128); // 중간 회색
      break;
  }
  
  return data;
}

/**
 * ImageData 객체 생성
 */
export function createTestImageData(width: number, height: number, fillColor: [number, number, number] = [128, 128, 128]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fillColor[0];     // R
    data[i * 4 + 1] = fillColor[1]; // G
    data[i * 4 + 2] = fillColor[2]; // B
    data[i * 4 + 3] = 255;          // A
  }
  
  return { data, width, height } as ImageData;
}

/**
 * 알려진 QR 코드 테스트 케이스
 */
export const KNOWN_QR_CASES = {
  // "HELLO WORLD" Version 1, Error Correction L
  helloWorld: {
    version: 1,
    errorLevel: 'L' as const,
    data: 'HELLO WORLD',
    moduleCount: 21,
  },
  
  // 숫자만 있는 경우
  numeric: {
    version: 1,
    errorLevel: 'M' as const,
    data: '12345678901234567',
    moduleCount: 21,
  },
  
  // URL
  url: {
    version: 3,
    errorLevel: 'M' as const,
    data: 'https://example.com',
    moduleCount: 29,
  }
};