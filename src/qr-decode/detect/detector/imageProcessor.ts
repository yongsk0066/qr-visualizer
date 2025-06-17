import { pipe } from '@mobily/ts-belt';
import type { ImageProcessingResult, GrayscaleResult } from '../../types';

// Canvas에서 이미지 데이터 추출
export const loadImageToCanvas = async (imageUrl: string): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // CORS 이슈 해결
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      resolve(imageData);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
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

// 그레이스케일 통계 계산
export const calculateStatistics = (grayscale: Uint8Array) => {
  const histogram = new Array(256).fill(0);
  let min = 255;
  let max = 0;
  let sum = 0;
  
  for (const value of grayscale) {
    histogram[value]++;
    min = Math.min(min, value);
    max = Math.max(max, value);
    sum += value;
  }
  
  return {
    min,
    max,
    mean: sum / grayscale.length,
    histogram
  };
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