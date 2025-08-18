import { useEffect, useRef } from 'react';
import { t } from '@/config/language';
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
    canvas.height = 30;
    
    // 배경
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 256, 30);
    
    // 히스토그램 그리기
    ctx.fillStyle = '#666';
    histogram.forEach((count, value) => {
      const height = (count / maxCount) * 27;
      ctx.fillRect(value, 30 - height, 1, height);
    });
  }, [grayscale]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('2단계: 그레이스케일 변환', 'Step 2: Grayscale Conversion')}</h2>
      
      {grayscale ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('컬러 이미지를 흑백으로 변환하여 QR 코드 처리를 준비합니다', 'Convert color image to grayscale to prepare for QR code processing')}
          </p>

          {/* 변환된 이미지 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('변환 결과', 'Conversion Result')}</div>
            <canvas 
              ref={canvasRef} 
              className="w-full h-auto border border-gray-200"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              {t('크기', 'Size')}: {grayscale.width} × {grayscale.height}px
            </div>
          </div>
          
          {/* 히스토그램 분석 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('밝기 분포 히스토그램', 'Brightness Distribution Histogram')}</div>
            <canvas 
              ref={histogramRef}
              className="w-full border border-gray-200 rounded bg-white"
            />
            <div className="text-xs text-gray-500 mt-2">
              {t('0 (검정) ~ 255 (흰색) 범위의 픽셀 분포', 'Pixel distribution in range 0 (black) ~ 255 (white)')}
            </div>
          </div>
          
          {/* 통계 정보 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('픽셀 통계', 'Pixel Statistics')}</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-600">{t('최소값', 'Min')}</div>
                <div className="font-mono font-semibold">{grayscale.statistics.min}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">{t('평균값', 'Mean')}</div>
                <div className="font-mono font-semibold">{grayscale.statistics.mean.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">{t('최대값', 'Max')}</div>
                <div className="font-mono font-semibold">{grayscale.statistics.max}</div>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium mb-1">{t('그레이스케일 변환', 'Grayscale Conversion')}</div>
            <div className="space-y-0.5 text-gray-700">
              <div>• {t('ITU-R BT.709 표준 가중치 사용', 'Uses ITU-R BT.709 standard coefficients')}</div>
              <div>• Y = 0.299R + 0.587G + 0.114B</div>
              <div>• {t('인간의 시각 특성을 반영한 변환', 'Conversion reflecting human visual characteristics')}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('컬러 이미지를 흑백으로 변환하여 QR 코드 처리를 준비합니다', 'Convert color image to grayscale to prepare for QR code processing')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🎨</div>
            <div className="text-gray-500 text-sm">{t('이미지를 선택하면 그레이스케일 변환이 표시됩니다', 'Grayscale conversion will be displayed when image is selected')}</div>
          </div>
        </div>
      )}
    </div>
  );
}