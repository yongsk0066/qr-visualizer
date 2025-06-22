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
        <div className="text-gray-500 text-sm">변환 중...</div>
      ) : homographyImage ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            검출된 파인더 패턴을 기준으로 원근 변환을 적용해 정사각 QR 코드를 생성합니다
          </p>
          {/* 변환된 이미지 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-medium">정사각형으로 변환된 QR 코드</div>
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
              <div className="mt-2 text-[11px] text-gray-600">
                <div>• 녹색 그리드: 모듈 경계선</div>
                <div>• 빨간색 테두리: 파인더 패턴 영역</div>
              </div>
            )}
          </div>

          {/* 변환 정보 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">변환 정보</div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <div className="text-gray-600">검출된 버전</div>
                <div className="font-mono font-semibold">
                  v{refinedHomography?.version || homography?.version}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">모듈 수</div>
                <div className="font-mono font-semibold">
                  {refinedHomography?.qrSize || homography?.qrSize}×{refinedHomography?.qrSize || homography?.qrSize}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">출력 크기</div>
                <div className="font-mono font-semibold">
                  {homographyImage.width}×{homographyImage.height}px
                </div>
              </div>
            </div>
          </div>

          {/* 코너 좌표 */}
          {refinedHomography && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium mb-2">코너 지점</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['왼쪽 상단', '오른쪽 상단', '오른쪽 하단', '왼쪽 하단'].map((label, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border border-gray-200">
                    <div className="text-gray-600 text-[11px]">{label}:</div>
                    <div className="font-mono">
                      ({refinedHomography.corners[idx].x.toFixed(0)}, {refinedHomography.corners[idx].y.toFixed(0)})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 변환 행렬 */}
          {refinedHomography && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium mb-2">원근 변환 행렬 (3×3)</div>
              <div className="text-xs font-mono bg-white p-2 rounded border border-gray-200 overflow-x-auto">
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

          {/* 설명 */}
          <div className="p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium mb-1">원근 변환 프로세스</div>
            <div className="space-y-0.5 text-gray-700">
              <div>• 3개 파인더 패턴을 기준점으로 사용</div>
              <div>• 4번째 모서리는 선 교차로 계산</div>
              <div>• 타이밍 패턴 분석으로 정확한 버전 검출</div>
              <div>• 정사각형 이미지로 정규화 (512×512px)</div>
              <div>• 재검출로 정밀도 향상</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">대기 중...</div>
      )}
    </div>
  );
}
