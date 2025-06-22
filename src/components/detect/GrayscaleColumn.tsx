import { useEffect, useRef } from 'react';
import type { GrayscaleResult } from '../../qr-decode/types';

interface GrayscaleColumnProps {
  grayscale: GrayscaleResult | null;
}

export function GrayscaleColumn({ grayscale }: GrayscaleColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const histogramRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!grayscale || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, grayscale: data } = grayscale;
    canvas.width = width;
    canvas.height = height;

    // 그레이스케일 이미지 그리기
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      const offset = i * 4;
      imageData.data[offset] = value;     // R
      imageData.data[offset + 1] = value; // G
      imageData.data[offset + 2] = value; // B
      imageData.data[offset + 3] = 255;   // A
    }
    ctx.putImageData(imageData, 0, 0);
  }, [grayscale]);

  useEffect(() => {
    if (!grayscale || !histogramRef.current) return;

    const canvas = histogramRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { histogram } = grayscale.statistics;
    const maxCount = Math.max(...histogram);
    
    canvas.width = 256;
    canvas.height = 100;
    
    // 배경
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 256, 100);
    
    // 히스토그램 그리기
    ctx.fillStyle = '#666';
    histogram.forEach((count, value) => {
      const height = (count / maxCount) * 90;
      ctx.fillRect(value, 100 - height, 1, height);
    });
  }, [grayscale]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">2단계: 그레이스케일 변환</h2>
      
      {grayscale ? (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <canvas 
              ref={canvasRef} 
              className="w-full h-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          <div>
            <h4 className="text-xs font-medium mb-1">히스토그램</h4>
            <canvas 
              ref={histogramRef}
              className="w-full border border-gray-200 rounded"
            />
          </div>
          
          <div className="text-xs space-y-1">
            <p>최소값: {grayscale.statistics.min}</p>
            <p>최대값: {grayscale.statistics.max}</p>
            <p>평균값: {grayscale.statistics.mean.toFixed(2)}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">대기 중...</p>
      )}
    </div>
  );
}