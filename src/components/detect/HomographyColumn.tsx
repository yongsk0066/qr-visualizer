import { useEffect, useRef, useState } from 'react';
import type { HomographyResult, BinarizationResult, FinderDetectionResult } from '../../qr-decode/types';
import { applyHomography } from '../../qr-decode/detect/detector/homography';
import { initOpenCV } from '../../qr-decode/detect/detector/finderDetection';

interface HomographyColumnProps {
  homography: HomographyResult | null;
  binarization: BinarizationResult | null;
  finderDetection: FinderDetectionResult | null;
}

export function HomographyColumn({ homography, binarization, finderDetection }: HomographyColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [imageData, setImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    if (!homography || !binarization || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 바이너리 이미지를 ImageData로 변환
    const { binary, width, height } = binarization;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      const imageData = tempCtx.createImageData(width, height);
      for (let i = 0; i < binary.length; i++) {
        const value = binary[i];
        const idx = i * 4;
        imageData.data[idx] = value;
        imageData.data[idx + 1] = value;
        imageData.data[idx + 2] = value;
        imageData.data[idx + 3] = 255;
      }
      tempCtx.putImageData(imageData, 0, 0);
      
      // Homography 변환 적용
      const srcImageData = tempCtx.getImageData(0, 0, width, height);
      const warpedImage = applyHomography(srcImageData, homography);
      setImageData(warpedImage);
      
      // 캔버스에 그리기
      canvas.width = warpedImage.width;
      canvas.height = warpedImage.height;
      ctx.putImageData(warpedImage, 0, 0);
      
      // 그리드 오버레이
      if (showGrid) {
        drawGrid(ctx, homography.qrSize, canvas.width, canvas.height);
      }
    }
  }, [homography, binarization, showGrid]);

  const drawGrid = (
    ctx: CanvasRenderingContext2D, 
    moduleCount: number, 
    width: number, 
    height: number
  ) => {
    const moduleSize = width / moduleCount;
    
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 0.5;
    
    // 수직선
    for (let i = 0; i <= moduleCount; i++) {
      const x = i * moduleSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 수평선
    for (let i = 0; i <= moduleCount; i++) {
      const y = i * moduleSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Finder Pattern 영역 강조
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    
    // Top-left
    ctx.strokeRect(0, 0, 7 * moduleSize, 7 * moduleSize);
    // Top-right
    ctx.strokeRect(width - 7 * moduleSize, 0, 7 * moduleSize, 7 * moduleSize);
    // Bottom-left
    ctx.strokeRect(0, height - 7 * moduleSize, 7 * moduleSize, 7 * moduleSize);
  };

  return (
    <div className="step-column">
      <h3 className="step-title">Step 5: Homography Transform</h3>
      
      {homography ? (
        <div className="space-y-3">
          {/* 변환 정보 */}
          <div className="info-section">
            <h4 className="info-title">Transform Info</h4>
            <div className="space-y-1 text-xs">
              <div className="info-item">
                <span className="info-label">Detected Version:</span>
                <span className="info-value">Version {homography.version}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Module Count:</span>
                <span className="info-value">{homography.qrSize} × {homography.qrSize}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Output Size:</span>
                <span className="info-value">{imageData ? `${imageData.width} × ${imageData.height}px` : `${homography.qrSize * 10} × ${homography.qrSize * 10}px`}</span>
              </div>
            </div>
          </div>

          {/* 변환된 이미지 */}
          <div className="visualization-section">
            <div className="flex justify-between items-center mb-2">
              <h4 className="info-title">Rectified QR Code</h4>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showGrid ? '그리드 숨기기' : '그리드 보기'}
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <canvas 
                ref={canvasRef}
                className="w-full h-auto border border-gray-300"
                style={{ maxWidth: '100%', imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          {/* 변환 행렬 */}
          <div className="info-section">
            <h4 className="info-title">Homography Matrix</h4>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {[0, 1, 2].map(row => (
                    <tr key={row}>
                      {[0, 1, 2].map(col => (
                        <td key={col} className="px-2 py-1 text-center">
                          {homography.transform[row * 3 + col].toFixed(4)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 코너 좌표 */}
          <div className="info-section">
            <h4 className="info-title">Corner Points</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['Top-left', 'Top-right', 'Bottom-right', 'Bottom-left'].map((label, idx) => (
                <div key={idx} className="bg-gray-50 p-2 rounded">
                  <div className="font-medium">{label}:</div>
                  <div className="text-gray-600">
                    ({homography.corners[idx].x.toFixed(1)}, {homography.corners[idx].y.toFixed(1)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          {finderDetection?.patterns.length !== 3 
            ? 'Finder Pattern 3개가 필요합니다'
            : '대기 중...'}
        </div>
      )}
    </div>
  );
}