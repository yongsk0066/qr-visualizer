import { useEffect, useRef } from 'react';
import type { GrayscaleResult } from '../../qr-decode/types';
import { t } from '../../i18n';

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
      <h2 className="font-medium mb-3">{t('steps.detect.grayscale')}</h2>
      
      {grayscale ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('grayscale.description')}
          </p>

          {/* 변환된 이미지 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('grayscale.conversionResult')}</div>
            <canvas 
              ref={canvasRef} 
              className="w-full h-auto border border-gray-200"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              {t('common.size')}: {grayscale.width} × {grayscale.height}px
            </div>
          </div>
          
          {/* 히스토그램 분석 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('grayscale.brightnessHistogram')}</div>
            <canvas 
              ref={histogramRef}
              className="w-full border border-gray-200 rounded bg-white"
            />
            <div className="text-xs text-gray-500 mt-2">
              {t('grayscale.pixelDistribution')}
            </div>
          </div>
          
          {/* 통계 정보 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('grayscale.pixelStatistics')}</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-600">{t('grayscale.minValue')}</div>
                <div className="font-mono font-semibold">{grayscale.statistics.min}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">{t('grayscale.meanValue')}</div>
                <div className="font-mono font-semibold">{grayscale.statistics.mean.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">{t('grayscale.maxValue')}</div>
                <div className="font-mono font-semibold">{grayscale.statistics.max}</div>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium mb-1">{t('grayscale.conversionTitle')}</div>
            <div className="space-y-0.5 text-gray-700">
              <div>• {t('grayscale.conversionStep1')}</div>
              <div>• {t('grayscale.conversionStep2')}</div>
              <div>• {t('grayscale.conversionStep3')}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('grayscale.description')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🎨</div>
            <div className="text-gray-500 text-sm">{t('grayscale.noImageDescription')}</div>
          </div>
        </div>
      )}
    </div>
  );
}