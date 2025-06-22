/**
 * Array manipulation utility functions
 */

export interface RunLengthSegment {
  value: number;
  length: number;
}

/**
 * Encode array into run-length segments
 */
export function runLengthEncode(data: number[]): RunLengthSegment[] {
  if (data.length === 0) return [];

  const segments: RunLengthSegment[] = [];
  let currentValue = data[0];
  let currentLength = 1;

  for (let i = 1; i < data.length; i++) {
    if (data[i] === currentValue) {
      currentLength++;
    } else {
      segments.push({ value: currentValue, length: currentLength });
      currentValue = data[i];
      currentLength = 1;
    }
  }

  // Add the last segment
  segments.push({ value: currentValue, length: currentLength });

  return segments;
}

/**
 * Find the middle N segments from run-length encoded data
 */
export function getMiddleSegments(segments: RunLengthSegment[], count: number): RunLengthSegment[] {
  if (segments.length <= count) return segments;
  
  const startIndex = Math.floor((segments.length - count) / 2);
  return segments.slice(startIndex, startIndex + count);
}

/**
 * Check if segments match a pattern with tolerance
 */
export function matchesPattern(
  segments: RunLengthSegment[],
  expectedPattern: number[],
  tolerance: number = 0.5
): boolean {
  if (segments.length !== expectedPattern.length) return false;

  for (let i = 0; i < segments.length; i++) {
    const ratio = segments[i].length / expectedPattern[i];
    if (ratio < 1 - tolerance || ratio > 1 + tolerance) {
      return false;
    }
  }

  return true;
}