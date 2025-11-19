import type { Point } from '../../types';


/**
 * Edge Projection Analysis for QR Code Corner Refinement
 * Based on "Identification of QR Code Perspective Distortion Based on Edge Directions and Edge Projections Analysis"
 */

interface EdgeProjectionResult {
  horizontalProjection: Float32Array;
  verticalProjection: Float32Array;
  horizontalScore: number;
  verticalScore: number;
  edgeImages: {
    horizontal: Float32Array; // dx
    vertical: Float32Array;   // dy
    width: number;
    height: number;
  };
}

/**
 * Calculate edge projections and their standard deviations (scores)
 * for a region defined by 4 points (quadrilateral)
 * NOW USES HOMOGRAPHY WARPING for accurate projection analysis
 */
export const calculateEdgeProjections = (
  imageData: Uint8Array,
  width: number,
  height: number,
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): EdgeProjectionResult => {
  const cv = (window as any).cv;
  if (!cv) {
    console.error("OpenCV not loaded");
    return {
      horizontalProjection: new Float32Array(0),
      verticalProjection: new Float32Array(0),
      horizontalScore: 0,
      verticalScore: 0,
      edgeImages: {
        horizontal: new Float32Array(0),
        vertical: new Float32Array(0),
        width: 0,
        height: 0
      }
    };
  }

  // 1. Setup Homography
  // Warp to a fixed size square for consistent analysis
  const warpSize = 100; // 100x100 resolution for analysis
  
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    p1.x, p1.y,
    p2.x, p2.y,
    p4.x, p4.y, // BR
    p3.x, p3.y  // BL
  ]);

  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    warpSize, 0,
    warpSize, warpSize,
    0, warpSize
  ]);

  const H = cv.getPerspectiveTransform(srcPoints, dstPoints);
  
  // 2. Warp Image
  const srcMat = cv.matFromArray(height, width, cv.CV_8UC1, imageData);
  const warpedMat = new cv.Mat();
  const dsize = new cv.Size(warpSize, warpSize);
  
  cv.warpPerspective(srcMat, warpedMat, H, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0));

  // 3. Calculate Edges on Warped Image (OpenCV Native)
  // Horizontal edge (dx) - detects vertical lines
  // |I(x,y) - I(x-1,y)|
  const dx = new cv.Mat.zeros(warpSize, warpSize, cv.CV_8UC1);
  const dy = new cv.Mat.zeros(warpSize, warpSize, cv.CV_8UC1);

  // Use ROI to calculate diff without copying data to JS
  // dx: col(1..w) - col(0..w-1)
  const srcRectLeft = new cv.Rect(0, 0, warpSize - 1, warpSize);
  const srcRectRight = new cv.Rect(1, 0, warpSize - 1, warpSize);
  
  const roiLeft = warpedMat.roi(srcRectLeft);
  const roiRight = warpedMat.roi(srcRectRight);
  const dxRoi = dx.roi(srcRectRight); // Fill right part of dx
  
  cv.absdiff(roiRight, roiLeft, dxRoi);

  // dy: row(1..h) - row(0..h-1)
  const srcRectTop = new cv.Rect(0, 0, warpSize, warpSize - 1);
  const srcRectBottom = new cv.Rect(0, 1, warpSize, warpSize - 1);
  
  const roiTop = warpedMat.roi(srcRectTop);
  const roiBottom = warpedMat.roi(srcRectBottom);
  const dyRoi = dy.roi(srcRectBottom); // Fill bottom part of dy
  
  cv.absdiff(roiBottom, roiTop, dyRoi);

  // 4. Calculate Projections (OpenCV Native)
  const projXMat = new cv.Mat();
  const projYMat = new cv.Mat();

  // Projection X: Sum of columns of dx (vertical lines)
  // reduce(src, dst, dim, rtype, dtype)
  // dim 0: reduce to single row (sum down columns)
  cv.reduce(dx, projXMat, 0, cv.REDUCE_SUM, cv.CV_32F);

  // Projection Y: Sum of rows of dy (horizontal lines)
  // dim 1: reduce to single col (sum across rows)
  cv.reduce(dy, projYMat, 1, cv.REDUCE_SUM, cv.CV_32F);

  // 5. Calculate Scores (Standard Deviation)
  const meanX = new cv.Mat();
  const stdDevX = new cv.Mat();
  cv.meanStdDev(projXMat, meanX, stdDevX);
  const verticalScore = stdDevX.doubleAt(0, 0); // Score from vertical lines (dx)

  const meanY = new cv.Mat();
  const stdDevY = new cv.Mat();
  cv.meanStdDev(projYMat, meanY, stdDevY);
  const horizontalScore = stdDevY.doubleAt(0, 0); // Score from horizontal lines (dy)

  // Prepare return data
  // Convert Mats to Float32Arrays for return
  // Projections
  const projectionX = Float32Array.from(projXMat.data32F);
  const projectionY = Float32Array.from(projYMat.data32F);

  // Edge Images (convert to float for consistency with interface)
  const dx32F = new cv.Mat();
  const dy32F = new cv.Mat();
  dx.convertTo(dx32F, cv.CV_32F);
  dy.convertTo(dy32F, cv.CV_32F);
  
  const horizontalEdges = Float32Array.from(dx32F.data32F);
  const verticalEdges = Float32Array.from(dy32F.data32F);

  // Cleanup
  srcPoints.delete(); dstPoints.delete(); H.delete();
  srcMat.delete(); warpedMat.delete();
  dx.delete(); dy.delete();
  roiLeft.delete(); roiRight.delete(); dxRoi.delete();
  roiTop.delete(); roiBottom.delete(); dyRoi.delete();
  projXMat.delete(); projYMat.delete();
  meanX.delete(); stdDevX.delete();
  meanY.delete(); stdDevY.delete();
  dx32F.delete(); dy32F.delete();

  return {
    horizontalProjection: projectionX,
    verticalProjection: projectionY,
    horizontalScore: horizontalScore,
    verticalScore: verticalScore,
    edgeImages: {
      horizontal: horizontalEdges,
      vertical: verticalEdges,
      width: warpSize,
      height: warpSize
    }
  };
};

/**
 * Find the optimal 4th corner (P4) by maximizing edge projection standard deviation
 */
/**
 * Helper to yield control to the main thread
 * Uses scheduler.yield() if available (Chrome/Edge), falls back to setTimeout
 */
const yieldToMain = async () => {
  if ('scheduler' in window && 'yield' in (window as any).scheduler) {
    await (window as any).scheduler.yield();
  } else {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};

/**
 * Find the optimal 4th corner (P4) by maximizing edge projection standard deviation
 * Async version to prevent UI freezing
 */
export const findFourthCorner = async (
  imageData: Uint8Array,
  width: number,
  height: number,
  p1: Point, // Top-Left
  p2: Point, // Top-Right
  p3: Point, // Bottom-Left
  initialP4: Point, // Initial estimate
  moduleSize: number
): Promise<{ bestP4: Point; history: { p4: Point; score: number }[] }> => {
  let bestP4 = { ...initialP4 };
  let bestScore = -1;
  const history: { p4: Point; score: number }[] = [];
  
  // Search range (in pixels)
  // Increased range to handle larger distortions
  const searchRange = moduleSize * 10;

  const search = async (step: number, range: number) => {
    let improved = false;
    let iterations = 0;
    
    for (let dy = -range; dy <= range; dy += step) {
      for (let dx = -range; dx <= range; dx += step) {
        // Yield every 200 iterations to keep UI responsive (optimized)
        if (++iterations % 200 === 0) {
          await yieldToMain();
        }

        const testP4 = {
          x: initialP4.x + dx,
          y: initialP4.y + dy
        };

        // Ensure P4 is within bounds
        if (testP4.x < 0 || testP4.x >= width || testP4.y < 0 || testP4.y >= height) continue;

        // Calculate score using warping
        const result = calculateEdgeProjections(
          imageData, width, height,
          p1, p2, p3, testP4
        );

        const totalScore = result.horizontalScore + result.verticalScore;
        
        history.push({ p4: testP4, score: totalScore });

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestP4 = testP4;
          improved = true;
        }
      }
    }
    return improved;
  };

  // Coarse search
  await search(Math.max(4, Math.floor(moduleSize)), searchRange);
  
  // Fine search around best P4
  initialP4 = bestP4; // Update center
  await search(1, moduleSize * 2); // Smaller range for fine search

  return { bestP4, history };
};

/**
 * Refine a corner point position locally
 */
export const refineCornerPoint = (
  imageData: Uint8Array,
  width: number,
  height: number,
  corner: Point,
  others: [Point, Point, Point], // The other 3 corners
  range: number = 5
): Point => {
  let bestPoint = { ...corner };
  let bestScore = -1;

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const testPoint = { x: corner.x + dx, y: corner.y + dy };
      
      if (testPoint.x < 0 || testPoint.x >= width || testPoint.y < 0 || testPoint.y >= height) continue;

      const result = calculateEdgeProjections(
        imageData, width, height,
        testPoint, others[0], others[1], others[2]
      );

      const score = result.horizontalScore + result.verticalScore;
      if (score > bestScore) {
        bestScore = score;
        bestPoint = testPoint;
      }
    }
  }

  return bestPoint;
};
