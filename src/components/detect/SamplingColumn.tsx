import { useEffect, useRef, useState } from 'react';
import { runSampling } from '../../qr-decode/detect/sampling/sampling';
import type { HomographyResult, TriStateQR } from '../../qr-decode/types';
import { t } from '../../lang';

interface SamplingColumnProps {
  sampling: TriStateQR | null;
  homography: HomographyResult | null;
  homographyImage?: ImageData | null;
  onSamplingComplete?: (sampling: TriStateQR) => void;
}

export function SamplingColumn({
  sampling: propSampling,
  homography,
  homographyImage,
  onSamplingComplete,
}: SamplingColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGrid, setShowGrid] = useState(true);
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
    
    // 콜백 호출
    if (newSampling && onSamplingComplete) {
      onSamplingComplete(newSampling);
    }
  }, [homography, homographyImage, onSamplingComplete]);

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
          case 1: // Black = 1
            ctx.fillStyle = '#000000';
            break;
          case 0: // White = 0
            ctx.fillStyle = '#FFFFFF';
            break;
          case -1: // Unknown
            ctx.fillStyle = '#FF0000'; // 빨간색으로 표시
            break;
        }

        ctx.fillRect(x, y, modulePixelSize, modulePixelSize);
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
  }, [sampling, showGrid]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('6단계: 모듈 샘플링', 'Step 6: Module Sampling')}</h2>

      {sampling ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            정사각형 QR 코드에서 각 모듈의 중심을 샘플링하여 tri-state 행렬로 변환합니다
          </p>
          {/* 샘플링 결과 시각화 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-medium">샘플링된 행렬</div>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showGrid ? '▼ 그리드 숨기기' : '▶ 그리드 보기'}
              </button>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-auto border border-gray-200"
              style={{ maxWidth: '100%', imageRendering: 'pixelated' }}
            />
            {showGrid && (
              <div className="mt-2 space-y-0.5 text-[11px] text-gray-600">
                <div>• 파란색 테두리: 파인더 패턴 영역</div>
                <div>• 녹색 선: 타이밍 패턴 행/열</div>
                <div>• 빨간색 모듈: 불확실한 분류</div>
              </div>
            )}
          </div>

          {/* 샘플링 통계 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">샘플링 통계</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] text-gray-600 mb-1">모듈 크기</div>
                <div className="text-xs font-mono font-semibold">
                  {sampling.size} × {sampling.size}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-600 mb-1">전체 모듈 수</div>
                <div className="text-xs font-mono font-semibold">
                  {(sampling.size * sampling.size).toLocaleString()}개
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">검은 모듈 (1):</span>
                <span className="font-mono">
                  {sampling.statistics.black.toLocaleString()} ({((sampling.statistics.black / (sampling.size * sampling.size)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">흰 모듈 (0):</span>
                <span className="font-mono">
                  {sampling.statistics.white.toLocaleString()} ({((sampling.statistics.white / (sampling.size * sampling.size)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">미확인 모듈 (-1):</span>
                <span className="font-mono text-red-600">
                  {sampling.statistics.unknown.toLocaleString()} ({((sampling.statistics.unknown / (sampling.size * sampling.size)) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* 범례 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">모듈 색상 범례</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-black border border-gray-300"></div>
                <span>검은색 (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300"></div>
                <span>흰색 (0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 border border-gray-300"></div>
                <span>미확인 (-1)</span>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium mb-1">모듈 샘플링 프로세스</div>
            <div className="space-y-0.5 text-gray-700">
              <div>• 각 모듈의 중심 지점에서 픽셀 값 샘플링</div>
              <div>• 적응형 임계값으로 흑백 모듈 분류</div>
              <div>• QR 표준: 검은 모듈 = 1, 흰 모듈 = 0</div>
              <div>• 불확실한 경우 -1로 표시 (디코딩 시 처리)</div>
              <div>• tri-state 행렬로 디코딩 준비 완료</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            변환된 QR 코드에서 각 모듈의 값을 읽어 tri-state 행렬을 생성합니다
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">⚡</div>
            <div className="text-gray-500 text-sm">원근 변환이 완료되면 모듈 샘플링이 표시됩니다</div>
          </div>
        </div>
      )}
    </div>
  );
}
