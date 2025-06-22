import { useEffect, useRef, useState } from 'react';
import { detectFindersDirectly } from '../../qr-decode/detect/finder-detection/directFinderDetection';
import { runFinderDetection } from '../../qr-decode/detect/finder-detection/finderDetection';
import { applyHomography, runHomography } from '../../qr-decode/detect/homography/homography';
import type {
  BinarizationResult,
  FinderDetectionResult,
  HomographyResult,
} from '../../qr-decode/types';

interface RefinedHomographyColumnProps {
  homography: HomographyResult | null;
  homographyImage: ImageData | null;
  onRefinedHomography?: (homography: HomographyResult, refinedImage: ImageData) => void;
}

export function RefinedHomographyColumn({
  homography,
  homographyImage,
  onRefinedHomography,
}: RefinedHomographyColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [refinedFinderDetection, setRefinedFinderDetection] =
    useState<FinderDetectionResult | null>(null);
  const [refinedHomography, setRefinedHomography] = useState<HomographyResult | null>(null);
  const [refinedImage, setRefinedImage] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const paddingRef = useRef(0);
  const lastProcessedImageRef = useRef<ImageData | null>(null);

  useEffect(() => {
    const refineHomography = async () => {
      if (!homographyImage || !homography) return;

      // 이미 처리 중이거나 같은 이미지를 처리했으면 스킵
      if (isProcessing) return;
      if (lastProcessedImageRef.current === homographyImage) return;

      lastProcessedImageRef.current = homographyImage;

      setIsProcessing(true);

      try {
        // Step 1: Add padding to the image
        const padding = 20; // 20픽셀 패딩
        paddingRef.current = padding;
        const paddedWidth = homographyImage.width + padding * 2;
        const paddedHeight = homographyImage.height + padding * 2;

        const refinedBinarization: BinarizationResult = {
          binary: new Uint8Array(paddedWidth * paddedHeight),
          threshold: new Float32Array(0),
          width: paddedWidth,
          height: paddedHeight,
          parameters: { windowSize: 31, k: 0.2 },
        };

        // 전체를 흰색으로 초기화
        refinedBinarization.binary.fill(255);

        // Convert ImageData to binary array with padding

        for (let y = 0; y < homographyImage.height; y++) {
          for (let x = 0; x < homographyImage.width; x++) {
            const srcIdx = (y * homographyImage.width + x) * 4;
            const dstIdx = (y + padding) * paddedWidth + (x + padding);
            refinedBinarization.binary[dstIdx] = homographyImage.data[srcIdx] > 128 ? 255 : 0;
          }
        }

        // 이진 이미지 확인

        // Step 2: Run finder detection on rectified image

        // 먼저 직접 검출 시도
        let finderResult = detectFindersDirectly(
          refinedBinarization.binary,
          refinedBinarization.width,
          refinedBinarization.height
        );

        // 직접 검출 실패시 OpenCV 사용
        if (!finderResult) {
          console.log('Direct detection failed, trying OpenCV...');
          finderResult = await runFinderDetection(refinedBinarization);
        }

        console.log('Finder detection result:', finderResult);

        // 실패하면 null로 설정
        if (!finderResult || finderResult.patterns.length !== 3) {
          console.log(
            'Finder detection failed, patterns found:',
            finderResult?.patterns.length || 0
          );
          setRefinedFinderDetection(null);
          setRefinedHomography(null);
          return;
        }

        // 패딩을 고려해서 좌표 조정
        const adjustedFinderResult = {
          ...finderResult,
          patterns: finderResult.patterns.map((pattern) => ({
            ...pattern,
            center: {
              x: pattern.center.x - padding,
              y: pattern.center.y - padding,
            },
            corners: pattern.corners.map((corner) => ({
              x: Math.max(0, corner.x - padding), // 음수 방지
              y: Math.max(0, corner.y - padding),
            })),
          })),
        };

        setRefinedFinderDetection(adjustedFinderResult);

        if (finderResult && finderResult.patterns.length === 3) {
          // Step 3: Calculate refined homography
          // 원본 이진 데이터 생성 (패딩 없는 버전)
          const originalBinary = new Uint8Array(homographyImage.width * homographyImage.height);
          for (let i = 0; i < homographyImage.data.length; i += 4) {
            originalBinary[i / 4] = homographyImage.data[i] > 128 ? 255 : 0;
          }

          const refined = runHomography(
            adjustedFinderResult,
            homographyImage.width,
            homographyImage.height,
            originalBinary,
            false // 패딩 없이
          );

          if (refined) {
            setRefinedHomography(refined);

            // Apply refined homography to create final image
            const finalImage = applyHomography(homographyImage, refined);
            setRefinedImage(finalImage);

            onRefinedHomography?.(refined, finalImage);
          }
        }
      } catch {
        // Error handling intentionally left empty
      } finally {
        setIsProcessing(false);
      }
    };

    refineHomography();
  }, [homographyImage, homography, onRefinedHomography, isProcessing]);

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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use refined image if available, otherwise use original homography image
    const imageToDisplay = refinedImage || homographyImage;
    if (!imageToDisplay) return;

    // Use requestAnimationFrame for smoother rendering
    const animationId = requestAnimationFrame(() => {
      // Set canvas size only if it changed
      if (canvas.width !== imageToDisplay.width || canvas.height !== imageToDisplay.height) {
        canvas.width = imageToDisplay.width;
        canvas.height = imageToDisplay.height;
      }

      // Draw the image
      ctx.putImageData(imageToDisplay, 0, 0);

      // Draw grid if enabled
      if (showGrid && refinedHomography) {
        drawGrid(ctx, refinedHomography.qrSize, canvas.width, canvas.height);
      }

      // Draw refined finder patterns if found - only on the original homography image
      if (refinedFinderDetection && !refinedImage) {
        refinedFinderDetection.patterns.forEach((pattern, index) => {
          const colors = ['#FF0000', '#00FF00', '#0000FF'];
          ctx.strokeStyle = colors[index % 3];
          ctx.lineWidth = 2;

          // Draw pattern box
          const halfSize = pattern.size / 2;
          ctx.strokeRect(
            pattern.center.x - halfSize,
            pattern.center.y - halfSize,
            pattern.size,
            pattern.size
          );

          // Draw center point
          ctx.fillStyle = colors[index % 3];
          ctx.beginPath();
          ctx.arc(pattern.center.x, pattern.center.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });

    return () => cancelAnimationFrame(animationId);
  }, [homographyImage, refinedImage, refinedFinderDetection, showGrid, refinedHomography]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">5단계: 원근 변환</h2>

      {isProcessing ? (
        <div className="text-gray-500 text-sm">Refining...</div>
      ) : homographyImage ? (
        <div className="space-y-3">
          {/* 변환 정보 */}
          <div className="info-section">
            <h4 className="info-title">Transform Info</h4>
            <div className="space-y-1 text-xs">
              <div className="info-item">
                <span className="info-label">Detected Version:</span>
                <span className="info-value">
                  Version {refinedHomography?.version || homography?.version}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Module Count:</span>
                <span className="info-value">
                  {refinedHomography?.qrSize || homography?.qrSize} ×{' '}
                  {refinedHomography?.qrSize || homography?.qrSize}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Output Size:</span>
                <span className="info-value">
                  {homographyImage.width} × {homographyImage.height}px
                </span>
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
          {refinedHomography && (
            <div className="info-section">
              <h4 className="info-title">Homography Matrix</h4>
              <div className="text-xs font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {[0, 1, 2].map((row) => (
                      <tr key={row}>
                        {[0, 1, 2].map((col) => (
                          <td key={col} className="px-2 py-1 text-center">
                            {refinedHomography.transform[row * 3 + col].toFixed(4)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 코너 좌표 */}
          {refinedHomography && (
            <div className="info-section">
              <h4 className="info-title">Corner Points</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Top-left', 'Top-right', 'Bottom-right', 'Bottom-left'].map((label, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">{label}:</div>
                    <div className="text-gray-600">
                      ({refinedHomography.corners[idx].x.toFixed(1)},{' '}
                      {refinedHomography.corners[idx].y.toFixed(1)})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">Waiting for homography result...</div>
      )}
    </div>
  );
}
