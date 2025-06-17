import { pipe } from '@mobily/ts-belt';
import type { DetectPipelineResult } from '../types';
import { processImage, createGrayscaleResult } from './detector/imageProcessor';
import { runBinarization } from './detector/binarization';
import { detectFinders } from './detector/finderDetection';

export interface DetectPipelineParams {
  imageUrl: string;
}

export const runDetectPipeline = async ({ imageUrl }: DetectPipelineParams): Promise<DetectPipelineResult> => {
  try {
    // Step 1: 이미지 처리
    const imageProcessing = await processImage(imageUrl);
    
    return pipe(
      { imageProcessing },
      
      // Step 2: 그레이스케일 변환
      (state) => ({
        ...state,
        grayscale: createGrayscaleResult(state.imageProcessing)
      }),
      
      // Step 3: 이진화
      (state) => ({
        ...state,
        binarization: state.grayscale ? runBinarization(state.grayscale) : null
      }),
      
      // Step 4: Finder 패턴 검출
      (state) => ({
        ...state,
        finderDetection: state.binarization ? detectFinders(state.binarization) : null
      }),
      
      // Step 5-7: TODO
      (state) => ({
        ...state,
        triStateMatrix: null // 추후 구현
      })
    );
  } catch (error) {
    console.error('Detect pipeline error:', error);
    return {
      imageProcessing: null,
      grayscale: null,
      binarization: null,
      finderDetection: null,
      triStateMatrix: null
    };
  }
};