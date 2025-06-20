import { pipe } from '@mobily/ts-belt';
import type { DetectPipelineResult } from '../types';
import { runBinarization } from './detector/binarization';
import { runBinarizationOpenCV } from './detector/binarizationOpenCV';
import { runFinderDetection } from './detector/finderDetection';
import { createGrayscaleResult, processImage } from './detector/imageProcessor';

export interface DetectPipelineParams {
  imageUrl: string;
}

export const runDetectPipeline = async ({
  imageUrl,
}: DetectPipelineParams): Promise<DetectPipelineResult> => {
  try {
    // Step 1: 이미지 처리
    const imageProcessing = await processImage(imageUrl);

    const syncResult = pipe(
      { imageProcessing },

      // Step 2: 그레이스케일 변환
      (state) => ({
        ...state,
        grayscale: createGrayscaleResult(state.imageProcessing),
      })
    );

    // Step 3: 이진화 (일단 원래 Sauvola 사용)
    const binarization = syncResult.grayscale
      ? runBinarization(syncResult.grayscale)
      : null;

    // Step 4: Finder Pattern 검출 (async)
    const finderDetection = binarization 
      ? await runFinderDetection(binarization).catch(err => {
          console.error('Finder detection error:', err);
          return null;
        })
      : null;

    return {
      ...syncResult,
      binarization,
      finderDetection,
    };
  } catch (error) {
    console.error('Detect pipeline error:', error);
    return {
      imageProcessing: null,
      grayscale: null,
      binarization: null,
      finderDetection: null,
    };
  }
};
