import { pipe } from '@mobily/ts-belt';
import type { DetectPipelineResult } from '../types';
import { runBinarization } from './detector/binarization';
import { runFinderDetection } from './detector/finderDetection';
import { runHomography, applyHomography } from './detector/homography';
import { createGrayscaleResult, processImage } from './detector/imageProcessor';
import { runSampling } from './detector/sampling';

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

    // Step 5: Homography 변환
    const homography = finderDetection && syncResult.imageProcessing && binarization
      ? runHomography(
          finderDetection, 
          syncResult.imageProcessing.width, 
          syncResult.imageProcessing.height,
          binarization.binary
        )
      : null;

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
      homography: null,
      sampling: null,
      homographyImage: null,
    };
  }
};
