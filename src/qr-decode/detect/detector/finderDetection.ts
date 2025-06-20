import { pipe } from '@mobily/ts-belt';
import type { BinarizationResult, FinderDetectionResult, Point, Pattern, RunLength } from '../../types';

// Constants for finder pattern detection
const RATIO_TOLERANCE = 0.5; // 50% tolerance for 1:1:3:1:1 ratio
const MIN_MODULE_SIZE = 2; // Minimum pixels per module
const MAX_MODULE_SIZE = 100; // Maximum pixels per module
const SCAN_SKIP = 3; // Skip every N rows for performance

/**
 * Detect QR finder patterns using the 1:1:3:1:1 ratio scanning method
 * Educational implementation following ISO/IEC 18004 standard
 */
export const detectFinderPatterns = (
  binarization: BinarizationResult
): FinderDetectionResult => {
  const { binary, width, height } = binarization;

  return pipe(
    binary,
    // Step 1: Horizontal scanning for 1:1:3:1:1 patterns
    (data) => scanForPatterns(data, width, height),
    // Step 2: Vertical verification of candidates
    (candidates) => verifyCandidates(candidates, binary, width, height),
    // Step 3: Select best triplet of patterns
    (verified) => selectFinderTriplet(verified),
    // Step 4: Return result
    (selected) => ({
      candidates: selected?.patterns || [],
      selected: selected?.points || null,
    })
  );
};

/**
 * Scan image rows for potential finder patterns with 1:1:3:1:1 ratio
 */
function scanForPatterns(
  binary: Uint8Array,
  width: number,
  height: number
): Point[] {
  const candidates: Point[] = [];

  // Scan every SCAN_SKIP rows for performance
  for (let y = 0; y < height; y += SCAN_SKIP) {
    const runs = getRunLengths(binary, y * width, width);
    
    // Need at least 5 runs for a potential pattern (B-W-B-W-B)
    if (runs.length < 5) continue;

    // Check each sequence of 5 consecutive runs
    for (let i = 0; i <= runs.length - 5; i++) {
      const pattern = runs.slice(i, i + 5);
      
      // First run should be black (0)
      if (pattern[0].value !== 0) continue;
      
      // Check alternating black/white pattern
      if (!isAlternatingPattern(pattern)) continue;
      
      // Check 1:1:3:1:1 ratio
      const center = checkRatio(pattern);
      if (center) {
        candidates.push({
          x: pattern[0].start + center,
          y: y,
        });
      }
    }
  }

  return candidates;
}

/**
 * Get run-length encoding of a row
 */
function getRunLengths(data: Uint8Array, start: number, width: number): RunLength[] {
  const runs: RunLength[] = [];
  let currentValue = data[start];
  let currentStart = 0;
  let currentLength = 1;

  for (let x = 1; x < width; x++) {
    const value = data[start + x];
    if (value === currentValue) {
      currentLength++;
    } else {
      runs.push({
        start: currentStart,
        length: currentLength,
        value: currentValue,
      });
      currentValue = value;
      currentStart = x;
      currentLength = 1;
    }
  }

  // Don't forget the last run
  runs.push({
    start: currentStart,
    length: currentLength,
    value: currentValue,
  });

  return runs;
}

/**
 * Check if runs form alternating black/white pattern
 */
function isAlternatingPattern(runs: RunLength[]): boolean {
  return runs.every((run, i) => run.value === (i % 2 === 0 ? 0 : 1));
}

/**
 * Check if runs match 1:1:3:1:1 ratio within tolerance
 * Returns the center position if match found, null otherwise
 */
function checkRatio(runs: RunLength[]): number | null {
  const lengths = runs.map(r => r.length);
  const moduleSize = (lengths[0] + lengths[1] + lengths[3] + lengths[4]) / 4;
  
  // Check module size bounds
  if (moduleSize < MIN_MODULE_SIZE || moduleSize > MAX_MODULE_SIZE) {
    return null;
  }

  // Expected lengths based on module size
  const expected = [moduleSize, moduleSize, moduleSize * 3, moduleSize, moduleSize];
  
  // Check each segment against expected ratio
  for (let i = 0; i < 5; i++) {
    const ratio = lengths[i] / expected[i];
    if (ratio < (1 - RATIO_TOLERANCE) || ratio > (1 + RATIO_TOLERANCE)) {
      return null;
    }
  }

  // Return center of the pattern (middle of the 3-module center)
  return Math.round(runs[0].length + runs[1].length + runs[2].length / 2);
}

/**
 * Verify candidates by checking vertical direction
 */
function verifyCandidates(
  candidates: Point[],
  binary: Uint8Array,
  width: number,
  height: number
): Pattern[] {
  const verified: Pattern[] = [];

  for (const candidate of candidates) {
    // Extract vertical run at candidate position
    const verticalRuns = getVerticalRuns(
      binary,
      candidate.x,
      candidate.y,
      width,
      height
    );

    if (verticalRuns.length >= 5) {
      // Find the run containing our y position
      let accumulatedLength = 0;
      for (let i = 0; i <= verticalRuns.length - 5; i++) {
        const pattern = verticalRuns.slice(i, i + 5);
        
        if (!isAlternatingPattern(pattern)) continue;
        
        const centerOffset = checkRatio(pattern);
        if (centerOffset !== null) {
          // Calculate refined center position
          const yStart = accumulatedLength + pattern[0].start;
          const refinedY = yStart + centerOffset;
          
          // Check if this pattern contains our original y
          if (Math.abs(refinedY - candidate.y) < pattern[2].length) {
            const moduleSize = (pattern[0].length + pattern[1].length + 
                               pattern[3].length + pattern[4].length) / 4;
            
            verified.push({
              x: candidate.x,
              y: refinedY,
              size: moduleSize,
            });
            break;
          }
        }
        
        accumulatedLength += pattern[0].length;
      }
    }
  }

  return verified;
}

/**
 * Get vertical run-length encoding around a point
 */
function getVerticalRuns(
  data: Uint8Array,
  x: number,
  centerY: number,
  width: number,
  height: number
): RunLength[] {
  const runs: RunLength[] = [];
  
  // Scan from top to center
  let y = Math.max(0, centerY - 50); // Look 50 pixels up
  let currentValue = data[y * width + x];
  let currentStart = y;
  let currentLength = 1;

  for (y = currentStart + 1; y < Math.min(height, centerY + 50); y++) {
    const value = data[y * width + x];
    if (value === currentValue) {
      currentLength++;
    } else {
      runs.push({
        start: currentStart,
        length: currentLength,
        value: currentValue,
      });
      currentValue = value;
      currentStart = y;
      currentLength = 1;
    }
  }

  runs.push({
    start: currentStart,
    length: currentLength,
    value: currentValue,
  });

  return runs;
}

/**
 * Select the best triplet of finder patterns
 * Validates that they form a proper triangle with right angles
 */
function selectFinderTriplet(
  patterns: Pattern[]
): { patterns: Pattern[], points: [Point, Point, Point] } | null {
  if (patterns.length < 3) return null;

  // Sort patterns by size to group similar ones
  const sorted = [...patterns].sort((a, b) => a.size - b.size);
  
  // Try to find 3 patterns with similar sizes
  for (let i = 0; i < sorted.length - 2; i++) {
    for (let j = i + 1; j < sorted.length - 1; j++) {
      for (let k = j + 1; k < sorted.length; k++) {
        const p1 = sorted[i];
        const p2 = sorted[j];
        const p3 = sorted[k];
        
        // Check if sizes are similar (within 50% tolerance)
        const avgSize = (p1.size + p2.size + p3.size) / 3;
        const sizeValid = [p1, p2, p3].every(
          p => Math.abs(p.size - avgSize) / avgSize < 0.5
        );
        
        if (!sizeValid) continue;
        
        // Check if they form a right-angled triangle
        if (isValidFinderTriangle(p1, p2, p3)) {
          // Order points: top-left, top-right, bottom-left
          const ordered = orderFinderPatterns(p1, p2, p3);
          return {
            patterns: [p1, p2, p3],
            points: ordered,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Check if three patterns form a valid QR finder triangle
 */
function isValidFinderTriangle(p1: Pattern, p2: Pattern, p3: Pattern): boolean {
  // Calculate distances between patterns
  const d12 = distance(p1, p2);
  const d13 = distance(p1, p3);
  const d23 = distance(p2, p3);
  
  // Sort distances
  const distances = [d12, d13, d23].sort((a, b) => a - b);
  
  // Check if it forms a right triangle (with some tolerance)
  // a² + b² ≈ c²
  const [a, b, c] = distances;
  const rightAngle = Math.abs(a * a + b * b - c * c) / (c * c) < 0.1;
  
  // Check if two sides are approximately equal (isosceles right triangle)
  const isosceles = Math.abs(a - b) / a < 0.1;
  
  return rightAngle && isosceles;
}

/**
 * Calculate distance between two patterns
 */
function distance(p1: Pattern, p2: Pattern): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Order finder patterns as: top-left, top-right, bottom-left
 */
function orderFinderPatterns(
  p1: Pattern,
  p2: Pattern,
  p3: Pattern
): [Point, Point, Point] {
  const patterns = [p1, p2, p3];
  
  // Find the pattern that is alone on one side (bottom-left)
  let bottomLeft: Pattern | null = null;
  let others: Pattern[] = [];
  
  for (let i = 0; i < 3; i++) {
    const current = patterns[i];
    const rest = patterns.filter((_, idx) => idx !== i);
    
    // Check if this pattern is on a different horizontal line than the others
    const yDiff1 = Math.abs(current.y - rest[0].y);
    const yDiff2 = Math.abs(current.y - rest[1].y);
    const yDiffOthers = Math.abs(rest[0].y - rest[1].y);
    
    if (yDiff1 > yDiffOthers * 2 && yDiff2 > yDiffOthers * 2) {
      bottomLeft = current;
      others = rest;
      break;
    }
  }
  
  if (!bottomLeft) {
    // Fallback: use the bottom-most pattern
    patterns.sort((a, b) => b.y - a.y);
    bottomLeft = patterns[0];
    others = [patterns[1], patterns[2]];
  }
  
  // Order the other two as top-left and top-right
  const [topLeft, topRight] = others[0].x < others[1].x ? others : [others[1], others[0]];
  
  return [
    { x: topLeft.x, y: topLeft.y },
    { x: topRight.x, y: topRight.y },
    { x: bottomLeft.x, y: bottomLeft.y },
  ];
}