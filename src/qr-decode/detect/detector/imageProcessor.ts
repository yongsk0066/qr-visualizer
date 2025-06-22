import { pipe } from '@mobily/ts-belt';
import type { ImageProcessingResult, GrayscaleResult } from '../../types';
import { loadImageToCanvas as loadImageUtil, calculateStatistics as calculateStatsUtil } from '../../../shared/utils/image';

// Canvas에서 이미지 데이터 추출 (기존 코드와의 호환성 유지)
export const loadImageToCanvas = async (imageUrl: string): Promise<ImageData> => {
  const result = await loadImageUtil(imageUrl);
  return result.ctx.getImageData(0, 0, result.width, result.height);
};

// 이미지를 그레이스케일로 변환
export const convertToGrayscale = (imageData: ImageData): Uint8Array => {
  const { data, width, height } = imageData;
  const grayscale = new Uint8Array(width * height);
  
  for (let i = 0; i < grayscale.length; i++) {
    const offset = i * 4;
    // ITU-R BT.709 luma coefficients
    grayscale[i] = Math.round(
      0.2126 * data[offset] +     // R
      0.7152 * data[offset + 1] + // G
      0.0722 * data[offset + 2]   // B
    );
  }
  
  return grayscale;
};

// 그레이스케일 통계 계산 (기존 코드와의 호환성 유지)
export const calculateStatistics = (grayscale: Uint8Array) => {
  return calculateStatsUtil(Array.from(grayscale));
};

// 이미지 처리 파이프라인
export const processImage = async (imageUrl: string): Promise<ImageProcessingResult> => {
  const imageData = await loadImageToCanvas(imageUrl);
  const grayscale = convertToGrayscale(imageData);
  
  return {
    original: imageData,
    grayscale,
    width: imageData.width,
    height: imageData.height
  };
};

// 그레이스케일 결과 생성
export const createGrayscaleResult = (processing: ImageProcessingResult): GrayscaleResult => {
  return pipe(
    processing,
    (p) => ({
      grayscale: p.grayscale,
      width: p.width,
      height: p.height,
      statistics: calculateStatistics(p.grayscale)
    })
  );
};