import type { FinderDetectionResult, CornerRefinementResult } from '../types';
import { calculateEdgeProjections, findFourthCorner } from './homography/edgeProjection';

/**
 * Step 5: Corner Refinement & P4 Detection
 * Refines P1, P2, P3 and finds P4 using Edge Projection Analysis
 */
export const runCornerRefinement = async (
  finderDetection: FinderDetectionResult,
  binarization: Uint8Array,
  width: number,
  height: number
): Promise<CornerRefinementResult | null> => {
  if (!finderDetection || finderDetection.patterns.length !== 3) return null;

  // 1. Sort patterns (TL, TR, BL)
  // 1. Sort patterns (TL, TR, BL)
  const patterns = finderDetection.patterns;
  const sorted = sortFinderPatterns(patterns);
  
  // Use OUTER corners of the finder patterns if available
  // If corners are not available, estimate from center and size (3.5 modules offset)
  // TL: Top-Left corner of Top-Left pattern
  // TR: Top-Right corner of Top-Right pattern
  // BL: Bottom-Left corner of Bottom-Left pattern
  
  const getOuterCorner = (pattern: typeof sorted.topLeft, type: 'TL' | 'TR' | 'BL') => {
    if (pattern.corners && pattern.corners.length === 4) {
      // Sort corners to find the extreme one
      const corners = [...pattern.corners];
      if (type === 'TL') {
        // Min X, Min Y
        return corners.reduce((min, c) => (c.x + c.y < min.x + min.y ? c : min), corners[0]);
      } else if (type === 'TR') {
        // Max X, Min Y (approx) - actually Max (X - Y) or similar?
        // Let's use simple sorting: Sort by X desc, then Y asc?
        // Or just find the one with max X and min Y? 
        // Robust way: Sort by distance from center? No.
        // For TR pattern, we want the Top-Right corner.
        // Let's sort by (x - y) descending? No.
        // Let's just pick the one with largest X+Y? No, that's Bottom-Right.
        // Top-Right: Large X, Small Y. So Max (X - Y).
        return corners.reduce((max, c) => (c.x - c.y > max.x - max.y ? c : max), corners[0]);
      } else if (type === 'BL') {
        // Bottom-Left: Small X, Large Y. So Min (X - Y).
        return corners.reduce((min, c) => (c.x - c.y < min.x - min.y ? c : min), corners[0]);
      }
    }
    
    // Fallback: Estimate from center
    const offset = (pattern.size / 2); // Half size (approx 3.5 modules)
    if (type === 'TL') return { x: pattern.center.x - offset, y: pattern.center.y - offset };
    if (type === 'TR') return { x: pattern.center.x + offset, y: pattern.center.y - offset };
    if (type === 'BL') return { x: pattern.center.x - offset, y: pattern.center.y + offset };
    
    return pattern.center;
  };

  const p1 = getOuterCorner(sorted.topLeft, 'TL');
  const p2 = getOuterCorner(sorted.topRight, 'TR');
  const p3 = getOuterCorner(sorted.bottomLeft, 'BL');

  // 2. Estimate module size
  const avgSize = (sorted.topLeft.size + sorted.topRight.size + sorted.bottomLeft.size) / 3;
  const moduleSize = avgSize / 7;

  // 3. Convert binary to 0-255 for edge projection
  const edgeImage = new Uint8Array(binarization.length);
  for (let i = 0; i < binarization.length; i++) {
    edgeImage[i] = binarization[i] * 255;
  }

  // 4. Refine P1, P2, P3 (Optional but recommended by paper)
  // For now, we'll use the finder OUTER corners as initial refined points
  const refinedP1 = p1; 
  const refinedP2 = p2;
  const refinedP3 = p3;

  // 5. Initial P4 Estimate (Parallelogram)
  // P4 is the Bottom-Right corner of the QR code
  const v12 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const initialP4 = {
    x: p3.x + v12.x,
    y: p3.y + v12.y
  };

  // 6. Find P4 using Edge Projection
  const { bestP4: refinedP4, history } = await findFourthCorner(
    edgeImage,
    width,
    height,
    refinedP1,
    refinedP2,
    refinedP3,
    initialP4,
    moduleSize
  );

  // 7. Calculate projections for visualization (of the final P4 region)
  const projections = calculateEdgeProjections(
    edgeImage,
    width,
    height,
    refinedP1,
    refinedP2,
    refinedP3,
    refinedP4
  );

  return {
    refinedPatterns: [sorted.topLeft, sorted.topRight, sorted.bottomLeft],
    p4: refinedP4,
    edgeProjections: {
      horizontal: projections.horizontalProjection,
      vertical: projections.verticalProjection
    },
    edgeImages: projections.edgeImages,
    visualizationData: {
      p1: refinedP1,
      p2: refinedP2,
      p3: refinedP3,
      initialP4,
      refinedP4,
      searchHistory: history
    }
  };
};

// Helper: Sort patterns (duplicated from homography.ts for independence)
function sortFinderPatterns(patterns: FinderDetectionResult['patterns']) {
  const points = patterns.map((p) => ({
    pattern: p,
    x: p.center.x,
    y: p.center.y,
  }));

  points.sort((a, b) => a.y - b.y);
  const topTwo = points.slice(0, 2);
  const bottomOne = points[2];
  topTwo.sort((a, b) => a.x - b.x);

  return {
    topLeft: topTwo[0].pattern,
    topRight: topTwo[1].pattern,
    bottomLeft: bottomOne.pattern,
  };
}
