import { useEffect, useRef, useState } from 'react';
import type { TriStateQR, HomographyResult } from '../../qr-decode/types';
import { runSampling } from '../../qr-decode/detect/detector/sampling';
import { applyHomography } from '../../qr-decode/detect/detector/homography';

interface SamplingColumnProps {
  sampling: TriStateQR | null;
  homography: HomographyResult | null;
  homographyImage?: ImageData | null;
}

export function SamplingColumn({ sampling: propSampling, homography, homographyImage }: SamplingColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showModuleValues, setShowModuleValues] = useState(false);
  const [localSampling, setLocalSampling] = useState<TriStateQR | null>(null);

  // homography가 변경되면 sampling 다시 실행
  useEffect(() => {
    if (!homography || !homographyImage) {
      setLocalSampling(null);
      return;
    }
    
    console.log('Re-running sampling with homography version:', homography.version);
    const newSampling = runSampling(homographyImage, homography);
    setLocalSampling(newSampling);
  }, [homography, homographyImage]);

  // 실제 사용할 sampling (local이 있으면 local, 없으면 prop)
  const sampling = localSampling || propSampling;

  useEffect(() => {
    if (!sampling || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    const modulePixelSize = 10; // 각 모듈당 픽셀 크기
    canvas.width = sampling.size * modulePixelSize;
    canvas.height = sampling.size * modulePixelSize;

    // 배경
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 모듈 그리기
    for (let row = 0; row < sampling.size; row++) {
      for (let col = 0; col < sampling.size; col++) {
        const value = sampling.matrix[row][col];
        const x = col * modulePixelSize;
        const y = row * modulePixelSize;

        // 모듈 색상
        switch (value) {
          case 0: // Black
            ctx.fillStyle = '#000000';
            break;
          case 1: // White
            ctx.fillStyle = '#FFFFFF';
            break;
          case -1: // Unknown
            ctx.fillStyle = '#FF0000'; // 빨간색으로 표시
            break;
        }

        ctx.fillRect(x, y, modulePixelSize, modulePixelSize);

        // 모듈 값 표시 (옵션)
        if (showModuleValues && modulePixelSize > 15) {
          ctx.fillStyle = value === 1 ? '#000' : '#FFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            value === -1 ? '?' : value.toString(),
            x + modulePixelSize / 2,
            y + modulePixelSize / 2
          );
        }
      }
    }

    // 그리드 그리기
    if (showGrid) {
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
      ctx.lineWidth = 0.5;

      // 수직선
      for (let i = 0; i <= sampling.size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * modulePixelSize, 0);
        ctx.lineTo(i * modulePixelSize, canvas.height);
        ctx.stroke();
      }

      // 수평선
      for (let i = 0; i <= sampling.size; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * modulePixelSize);
        ctx.lineTo(canvas.width, i * modulePixelSize);
        ctx.stroke();
      }

      // Finder Pattern 영역 강조
      ctx.strokeStyle = 'rgba(0, 128, 255, 0.5)';
      ctx.lineWidth = 2;

      // 7x7 Finder Pattern 영역
      const finderSize = 7 * modulePixelSize;
      
      // Top-left
      ctx.strokeRect(0, 0, finderSize, finderSize);
      // Top-right
      ctx.strokeRect(canvas.width - finderSize, 0, finderSize, finderSize);
      // Bottom-left
      ctx.strokeRect(0, canvas.height - finderSize, finderSize, finderSize);

      // 타이밍 패턴 라인 강조
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 1;
      
      // 수평 타이밍 패턴 (6번째 행)
      ctx.strokeRect(0, 6 * modulePixelSize, canvas.width, modulePixelSize);
      // 수직 타이밍 패턴 (6번째 열)
      ctx.strokeRect(6 * modulePixelSize, 0, modulePixelSize, canvas.height);
    }
  }, [sampling, showGrid, showModuleValues]);

  return (
    <div className="step-column">
      <h3 className="step-title">Step 6: Module Sampling</h3>
      
      {sampling ? (
        <div className="space-y-3">
          {/* 샘플링 통계 */}
          <div className="info-section">
            <h4 className="info-title">Sampling Statistics</h4>
            <div className="space-y-1 text-xs">
              <div className="info-item">
                <span className="info-label">Module Count:</span>
                <span className="info-value">{sampling.size} × {sampling.size}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Black Modules:</span>
                <span className="info-value">
                  {sampling.statistics.black} ({((sampling.statistics.black / (sampling.size * sampling.size)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">White Modules:</span>
                <span className="info-value">
                  {sampling.statistics.white} ({((sampling.statistics.white / (sampling.size * sampling.size)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Unknown Modules:</span>
                <span className="info-value text-red-600">
                  {sampling.statistics.unknown} ({((sampling.statistics.unknown / (sampling.size * sampling.size)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* 샘플링 결과 시각화 */}
          <div className="visualization-section">
            <div className="flex justify-between items-center mb-2">
              <h4 className="info-title">Sampled Matrix</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showGrid ? '그리드 숨기기' : '그리드 보기'}
                </button>
                <button
                  onClick={() => setShowModuleValues(!showModuleValues)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showModuleValues ? '값 숨기기' : '값 보기'}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <canvas 
                ref={canvasRef}
                className="w-full h-auto border border-gray-300"
                style={{ maxWidth: '100%', imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          {/* 범례 */}
          <div className="info-section">
            <h4 className="info-title">Legend</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black border"></div>
                <span>Black (0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border"></div>
                <span>White (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 border"></div>
                <span>Unknown (-1)</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>• Blue boxes: Finder Pattern areas</p>
              <p>• Green lines: Timing pattern rows/columns</p>
              <p>• Red modules: Uncertain classification</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          {homography ? '샘플링 중...' : 'Homography 변환이 필요합니다'}
        </div>
      )}
    </div>
  );
}