import type { ImageProcessingResult, GrayscaleResult } from '../../types';
import { loadImageToCanvas, calculateStatistics } from '../../../shared/utils/image';

// ITU-R BT.709 luma coefficients
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;


// 이미지를 그레이스케일로 변환
export const convertToGrayscale = (imageData: ImageData): Uint8Array => {
  const { data, width, height } = imageData;
  const grayscale = new Uint8Array(width * height);
  
  for (let i = 0; i < grayscale.length; i++) {
    const offset = i * 4;
    grayscale[i] = Math.round(
      LUMA_R * data[offset] +     // R
      LUMA_G * data[offset + 1] + // G
      LUMA_B * data[offset + 2]   // B
    );
  }
  
  return grayscale;
};


// 이미지 처리 파이프라인
export const processImage = async (imageUrl: string): Promise<ImageProcessingResult> => {
  const result = await loadImageToCanvas(imageUrl);
  const imageData = result.ctx.getImageData(0, 0, result.width, result.height);
  const grayscale = convertToGrayscale(imageData);
  
  return {
    original: imageData,
    grayscale,
    width: imageData.width,
    height: imageData.height
  };
};

// 그레이스케일 결과 생성
export const createGrayscaleResult = ({ grayscale, width, height }: ImageProcessingResult): GrayscaleResult => {
  return {
    grayscale,
    width,
    height,
    statistics: calculateStatistics(Array.from(grayscale))
  };
};