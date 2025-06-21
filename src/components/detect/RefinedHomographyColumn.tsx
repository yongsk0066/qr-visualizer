import { useEffect, useRef, useState } from 'react';
import type { HomographyResult, FinderDetectionResult, BinarizationResult } from '../../qr-decode/types';
import { runFinderDetection } from '../../qr-decode/detect/detector/finderDetection';
import { runHomography } from '../../qr-decode/detect/detector/homography';
import { detectFindersDirectly } from '../../qr-decode/detect/detector/directFinderDetection';

interface RefinedHomographyColumnProps {
  homography: HomographyResult | null;
  homographyImage: ImageData | null;
  onRefinedHomography?: (homography: HomographyResult) => void;
}

export function RefinedHomographyColumn({ 
  homography, 
  homographyImage,
  onRefinedHomography 
}: RefinedHomographyColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [refinedFinderDetection, setRefinedFinderDetection] = useState<FinderDetectionResult | null>(null);
  const [refinedHomography, setRefinedHomography] = useState<HomographyResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const paddingRef = useRef(0);

  useEffect(() => {
    const refineHomography = async () => {
      console.log('RefinedHomographyColumn - inputs:', { homographyImage, homography });
      if (!homographyImage || !homography) return;
      
      setIsProcessing(true);
      console.log('Starting refinement process...');
      
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
          parameters: { windowSize: 31, k: 0.2 }
        };
        
        // 전체를 흰색으로 초기화
        refinedBinarization.binary.fill(255);
        
        // Convert ImageData to binary array with padding
        console.log('Converting ImageData to binary with padding...');
        
        for (let y = 0; y < homographyImage.height; y++) {
          for (let x = 0; x < homographyImage.width; x++) {
            const srcIdx = (y * homographyImage.width + x) * 4;
            const dstIdx = (y + padding) * paddedWidth + (x + padding);
            refinedBinarization.binary[dstIdx] = homographyImage.data[srcIdx] > 128 ? 255 : 0;
          }
        }
        
        // 이진 이미지 확인
        console.log('Binary image stats:', {
          width: refinedBinarization.width,
          height: refinedBinarization.height,
          totalPixels: refinedBinarization.binary.length,
          blackPixels: refinedBinarization.binary.filter(v => v === 0).length,
          whitePixels: refinedBinarization.binary.filter(v => v === 255).length
        });
        
        // Step 2: Run finder detection on rectified image
        console.log('Running finder detection on rectified image...');
        
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
          console.log('Finder detection failed, patterns found:', finderResult?.patterns.length || 0);
          setRefinedFinderDetection(null);
          setRefinedHomography(null);
          return;
        }
        
        // 패딩을 고려해서 좌표 조정
        const adjustedFinderResult = {
          ...finderResult,
          patterns: finderResult.patterns.map(pattern => ({
            ...pattern,
            center: {
              x: pattern.center.x - padding,
              y: pattern.center.y - padding
            },
            corners: pattern.corners.map(corner => ({
              x: Math.max(0, corner.x - padding), // 음수 방지
              y: Math.max(0, corner.y - padding)
            }))
          }))
        };
        
        setRefinedFinderDetection(adjustedFinderResult);
        
        console.log('Adjusted finder patterns:', adjustedFinderResult.patterns.map(p => ({
          center: p.center,
          size: p.size
        })));
        
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
            originalBinary
          );
          
          if (refined) {
            setRefinedHomography(refined);
            onRefinedHomography?.(refined);
          }
        }
      } catch (error) {
        console.error('Refinement error:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    refineHomography();
  }, [homographyImage, homography, onRefinedHomography]);

  useEffect(() => {
    if (!canvasRef.current || !homographyImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = homographyImage.width;
    canvas.height = homographyImage.height;
    
    // Draw the homography image
    ctx.putImageData(homographyImage, 0, 0);
    
    // Draw refined finder patterns if found
    if (refinedFinderDetection) {
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
  }, [homographyImage, refinedFinderDetection]);

  return (
    <div className="step-column">
      <h3 className="step-title">Step 5.1: Refined Homography</h3>
      
      {isProcessing ? (
        <div className="text-gray-500 text-sm">Refining...</div>
      ) : homographyImage ? (
        <div className="space-y-3">
          <div className="info-section">
            <h4 className="info-title">Refinement Results</h4>
            <div className="space-y-1 text-xs">
              <div className="info-item">
                <span className="info-label">Original Version:</span>
                <span className="info-value">{homography?.version}</span>
              </div>
              {refinedHomography ? (
                <>
                  <div className="info-item">
                    <span className="info-label">Refined Version:</span>
                    <span className="info-value font-bold text-green-600">{refinedHomography.version}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Module Count:</span>
                    <span className="info-value">{refinedHomography.qrSize} × {refinedHomography.qrSize}</span>
                  </div>
                </>
              ) : (
                <div className="info-item text-red-600">
                  <span className="info-label">Status:</span>
                  <span className="info-value">Finder detection failed</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Patterns Found:</span>
                <span className="info-value">{refinedFinderDetection?.patterns.length || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="visualization-section">
            <h4 className="info-title mb-2">Refined Finder Detection</h4>
            <div className="bg-gray-50 p-2 rounded">
              <canvas 
                ref={canvasRef} 
                className="w-full h-auto border border-gray-300"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          Waiting for homography result...
        </div>
      )}
    </div>
  );
}