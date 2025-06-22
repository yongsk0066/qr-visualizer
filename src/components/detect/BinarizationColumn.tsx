import { useEffect, useRef, useState } from 'react';
import type { BinarizationResult } from '../../qr-decode/types';

interface BinarizationColumnProps {
  binarization: BinarizationResult | null;
}

export function BinarizationColumn({ binarization }: BinarizationColumnProps) {
  const binaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const thresholdCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showThreshold, setShowThreshold] = useState(false);

  useEffect(() => {
    if (!binarization || !binaryCanvasRef.current) return;

    const canvas = binaryCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, binary } = binarization;
    canvas.width = width;
    canvas.height = height;

    // 이진 이미지 그리기
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < binary.length; i++) {
      // Sauvola: 0=흰색, 255=검정 (또는 0/1)
      const value = binary[i] === 0 ? 255 : 0;
      const offset = i * 4;
      imageData.data[offset] = value;     // R
      imageData.data[offset + 1] = value; // G
      imageData.data[offset + 2] = value; // B
      imageData.data[offset + 3] = 255;   // A
    }
    ctx.putImageData(imageData, 0, 0);
  }, [binarization]);

  useEffect(() => {
    if (!binarization || !thresholdCanvasRef.current || !showThreshold) return;

    const canvas = thresholdCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, threshold } = binarization;
    canvas.width = width;
    canvas.height = height;

    // 임계값 맵 시각화
    const imageData = ctx.createImageData(width, height);
    const min = Math.min(...threshold);
    const max = Math.max(...threshold);
    const range = max - min;

    for (let i = 0; i < threshold.length; i++) {
      const normalized = ((threshold[i] - min) / range) * 255;
      const value = Math.round(normalized);
      const offset = i * 4;
      imageData.data[offset] = value;     // R
      imageData.data[offset + 1] = value; // G
      imageData.data[offset + 2] = value; // B
      imageData.data[offset + 3] = 255;   // A
    }
    ctx.putImageData(imageData, 0, 0);
  }, [binarization, showThreshold]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">3단계: 이진화</h2>
      
      {binarization ? (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <canvas 
              ref={binaryCanvasRef} 
              className="w-full h-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          <div>
            <button
              onClick={() => setShowThreshold(!showThreshold)}
              className="text-xs text-blue-600 hover:text-blue-700 mb-2"
            >
              {showThreshold ? '임계값 맵 숨기기' : '임계값 맵 보기'}
            </button>
            
            {showThreshold && (
              <div className="bg-gray-50 p-3 rounded">
                <canvas 
                  ref={thresholdCanvasRef}
                  className="w-full h-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            )}
          </div>
          
          <div className="text-xs space-y-1">
            <p>Sauvola 파라미터:</p>
            <p className="pl-2">• 윈도우 크기: {binarization.parameters.windowSize}px</p>
            <p className="pl-2">• k 값: {binarization.parameters.k}</p>
            <p>검은 픽셀: {binarization.binary.filter(v => v === 255).length.toLocaleString()}</p>
            <p>흰 픽셀: {binarization.binary.filter(v => v === 0).length.toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">대기 중...</p>
      )}
    </div>
  );
}