import { pipe } from '@mobily/ts-belt';
import type { DetectPipelineResult } from '../types';
import { runBinarization } from './binarization/binarization';
import { runFinderDetection } from './finder-detection/finderDetection';
import { runCornerRefinement } from './cornerRefinement';
import { runHomography, applyHomography } from './homography/homography';
import { createGrayscaleResult, processImage } from './image-processing/imageProcessor';
import { runSampling } from './sampling/sampling';

export interface DetectPipelineParams {
  imageUrl: string;
}

export const runDetectPipeline = async ({
  imageUrl,
}: DetectPipelineParams): Promise<DetectPipelineResult> => {
  try {
    // 타임스탬프가 있는 경우 제거
    const cleanImageUrl = imageUrl.split('#')[0];
    
    // Step 1: 이미지 처리
    const imageProcessing = await processImage(cleanImageUrl);

    const syncResult = pipe(
      { imageProcessing },

      // Step 2: 그레이스케일 변환
      (state) => ({
        ...state,
        grayscale: createGrayscaleResult(state.imageProcessing),
      })
    );

    // Step 3: 이진화 (일단 원래 Sauvola 사용)
    const binarization = syncResult.grayscale ? runBinarization(syncResult.grayscale) : null;

    // Step 4: Finder Pattern 검출 (async)
    const finderDetection = binarization
      ? await runFinderDetection(binarization).catch((err) => {
          console.error('Finder detection error:', err);
          return null;
        })
      : null;

    // Step 5: Corner Refinement (New Step)
    const cornerRefinement = finderDetection && binarization
      ? runCornerRefinement(
          finderDetection,
          binarization.binary,
          binarization.width,
          binarization.height
        )
      : null;

    // Step 6: Homography 변환
    // cornerRefinement가 있으면 그것을 사용하고, 없으면 기존 finderDetection 사용
    // Step 6: Homography (Perspective Transform)
    // Use refined patterns if available, otherwise use original finder patterns
    // IMPORTANT: We now pass the refined corners (P1, P2, P3, P4) explicitly to runHomography
    const homography = finderDetection && syncResult.imageProcessing && binarization
      ? runHomography(
          {
            patterns: cornerRefinement ? cornerRefinement.refinedPatterns : finderDetection.patterns,
            candidates: finderDetection.candidates || [],
            visualizationCanvas: finderDetection.visualizationCanvas,
            confidence: finderDetection.confidence || 0,
            executionTime: finderDetection.executionTime || 0
          },
          syncResult.imageProcessing.width,
          syncResult.imageProcessing.height,
          binarization.binary,
          true,
          cornerRefinement ? {
            p1: cornerRefinement.visualizationData.p1,
            p2: cornerRefinement.visualizationData.p2,
            p3: cornerRefinement.visualizationData.p3,
            p4: cornerRefinement.visualizationData.refinedP4
          } : undefined
        )
      : null;
        
    // Override homography corners with refined P4 if available
    if (homography && cornerRefinement) {
      // P4 (Bottom-Right) is the 3rd corner in the array (index 2) or 4th?
      // Homography result corners are [TL, TR, BR, BL] usually?
      // Let's check homography.ts: corners = [TL, TR, BR, BL]
      // Wait, homography.ts returns corners: [TL, TR, BR, BL]
      // But wait, runHomography calculates corners based on its own logic.
      // We should probably pass the refined corners TO runHomography or update the result.
      // Since we reverted runHomography, it calculates P4 using simple math.
      // So we should update the homography result with our refined P4.
      
      // But wait, the homography MATRIX needs to be recalculated with the refined P4!
      // The reverted runHomography doesn't accept P4 input.
      // So we need to modify runHomography to accept optional corners OR recalculate matrix here.
      // Or we can create a new function `calculateHomographyFromCorners`.
      
      // For now, let's just update the result corners and RE-CALCULATE the matrix using OpenCV here if possible,
      // OR modify runHomography to accept "forced" corners.
      
      // Let's modify runHomography to accept optional 'knownCorners'
    }

    // Step 6: Sampling (homography 적용된 이미지에서 모듈 샘플링)
    let sampling = null;
    let homographyImage = null;
    
    if (homography && binarization) {
      // Homography 변환 적용
      const binaryImageData = new ImageData(
        new Uint8ClampedArray(binarization.binary.length * 4),
        binarization.width,
        binarization.height
      );
      
      // 이진 이미지를 RGBA로 변환
      for (let i = 0; i < binarization.binary.length; i++) {
        const value = binarization.binary[i];
        const idx = i * 4;
        binaryImageData.data[idx] = value;
        binaryImageData.data[idx + 1] = value;
        binaryImageData.data[idx + 2] = value;
        binaryImageData.data[idx + 3] = 255;
      }
      
      homographyImage = applyHomography(binaryImageData, homography);
      sampling = runSampling(homographyImage, homography);
    }

    return {
      ...syncResult,
      binarization,
      finderDetection,
      cornerRefinement,
      homography,
      sampling,
      homographyImage,
    };
  } catch (error) {
    console.error('Detect pipeline error:', error);
    return {
      imageProcessing: null,
      grayscale: null,
      binarization: null,
      finderDetection: null,
      cornerRefinement: null,
      homography: null,
      sampling: null,
      homographyImage: null,
    };
  }
};
