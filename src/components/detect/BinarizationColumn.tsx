import { useEffect, useRef, useState } from 'react';
import type { BinarizationResult } from '../../qr-decode/types';
import { t } from '../../i18n';

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
    
    // 큰 배열에서 min/max 찾기 (spread operator 대신 reduce 사용)
    let min = threshold[0];
    let max = threshold[0];
    for (let i = 1; i < threshold.length; i++) {
      if (threshold[i] < min) min = threshold[i];
      if (threshold[i] > max) max = threshold[i];
    }
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
      <h2 className="font-medium mb-3">{t('steps.detect.binarization')}</h2>
      
      {binarization ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            그레이스케일 이미지를 흑백으로 변환하여 모듈을 명확히 구분합니다
          </p>

          {/* 이진화 결과 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">이진화 결과</div>
            <canvas 
              ref={binaryCanvasRef} 
              className="w-full h-auto border border-gray-200"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              Sauvola 적응형 임계값 이진화 적용
            </div>
          </div>
          
          {/* 임계값 맵 시각화 */}
          <div>
            <button
              onClick={() => setShowThreshold(!showThreshold)}
              className="text-xs text-blue-600 hover:text-blue-700 mb-2"
            >
              {showThreshold ? '▼ 임계값 맵 숨기기' : '▶ 임계값 맵 보기'}
            </button>
            
            {showThreshold && (
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs font-medium mb-2">적응형 임계값 맵</div>
                <canvas 
                  ref={thresholdCanvasRef}
                  className="w-full h-auto border border-gray-200"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="text-xs text-gray-500 mt-2">
                  각 픽셀별 로컬 임계값 시각화 (밝을수록 높은 임계값)
                </div>
              </div>
            )}
          </div>
          
          {/* 파라미터 및 통계 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">이진화 정보</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-gray-600 mb-1">Sauvola 파라미터</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">윈도우 크기:</span>
                    <span className="font-mono">{binarization.parameters.windowSize}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">k 값:</span>
                    <span className="font-mono">{binarization.parameters.k}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-600 mb-1">픽셀 통계</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">검은 픽셀:</span>
                    <span className="font-mono">{binarization.binary.filter(v => v === 255).length.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">흰 픽셀:</span>
                    <span className="font-mono">{binarization.binary.filter(v => v === 0).length.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium mb-1">Sauvola 적응형 이진화</div>
            <div className="space-y-0.5 text-gray-700">
              <div>• 로컬 윈도우 기반 동적 임계값 결정</div>
              <div>• 조명 변화에 강건한 이진화 방법</div>
              <div>• T = μ × (1 + k × (σ/R - 1)) 공식 사용</div>
              <div>• 적분 이미지로 O(1) 시간에 통계 계산</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            그레이스케일 이미지를 흑백으로 변환하여 모듈을 명확히 구분합니다
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">⚫</div>
            <div className="text-gray-500 text-sm">그레이스케일 변환이 완료되면 이진화가 표시됩니다</div>
          </div>
        </div>
      )}
    </div>
  );
}