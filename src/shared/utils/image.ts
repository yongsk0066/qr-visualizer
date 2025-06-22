/**
 * Image processing utility functions
 */

/**
 * Calculate statistics for numeric array
 */
export function calculateStatistics(data: number[]): {
  min: number;
  max: number;
  mean: number;
  histogram: number[];
} {
  if (data.length === 0) {
    return { min: 0, max: 0, mean: 0, histogram: new Array(256).fill(0) };
  }

  let min = data[0];
  let max = data[0];
  let sum = 0;
  const histogram = new Array(256).fill(0);

  for (const value of data) {
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
    histogram[Math.floor(value)]++;
  }

  return {
    min,
    max,
    mean: sum / data.length,
    histogram,
  };
}

/**
 * Load image from URL to canvas
 */
export async function loadImageToCanvas(imageUrl: string): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
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
      
      resolve({
        canvas,
        ctx,
        width: img.width,
        height: img.height,
      });
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Create a Gaussian kernel for image blurring
 */
export function createGaussianKernel(size: number, sigma: number): number[] {
  const kernel: number[] = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel.push(value);
      sum += value;
    }
  }

  // Normalize kernel
  return kernel.map(v => v / sum);
}

/**
 * Calculate sum over a rectangular region using integral image
 */
export function getIntegralSum(
  integralImage: Float32Array,
  width: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  // Clamp coordinates
  x1 = Math.max(0, x1);
  y1 = Math.max(0, y1);
  x2 = Math.min(width - 1, x2);
  y2 = Math.min((integralImage.length / width) - 1, y2);

  const A = y1 > 0 && x1 > 0 ? integralImage[y1 * width + x1 - width - 1] : 0;
  const B = y1 > 0 ? integralImage[y1 * width + x2 - width] : 0;
  const C = x1 > 0 ? integralImage[y2 * width + x1 - 1] : 0;
  const D = integralImage[y2 * width + x2];

  return D - B - C + A;
}