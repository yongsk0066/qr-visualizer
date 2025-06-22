import { useEffect, useRef } from 'react';
import type { FinderDetectionResult } from '../../qr-decode/types';
import { calculateLineIntersection, calculateCenter, scaleFromCenter } from '../../shared/utils/geometry';

interface FinderDetectionColumnProps {
  finderDetection: FinderDetectionResult | null;
}

export function FinderDetectionColumn({ finderDetection }: FinderDetectionColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!finderDetection || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 시각화 캔버스 내용을 복사
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = finderDetection.visualizationCanvas.width;
    canvas.height = finderDetection.visualizationCanvas.height;
    ctx.drawImage(finderDetection.visualizationCanvas, 0, 0);
    
    // QR 코드 전체 범위 표시
    if (finderDetection.patterns.length === 3) {
      // 패턴들을 위치별로 정렬
      const patterns = [...finderDetection.patterns];
      const sortedByY = patterns.sort((a, b) => a.center.y - b.center.y);
      const topTwo = sortedByY.slice(0, 2).sort((a, b) => a.center.x - b.center.x);
      const topLeft = topTwo[0];
      const topRight = topTwo[1];
      const bottomLeft = sortedByY[2];
      
      // 평균 Finder Pattern 크기
      const avgFinderSize = (topLeft.size + topRight.size + bottomLeft.size) / 3;
      const moduleSize = avgFinderSize / 7;
      const halfFinder = moduleSize * 3.5;
      
      // 실제 corners 데이터 사용하여 극점 찾기
      const getExtremePoint = (pattern: typeof topLeft, type: 'min' | 'max', axis: 'x' | 'y') => {
        if (pattern.corners && pattern.corners.length === 4) {
          return type === 'min' 
            ? Math.min(...pattern.corners.map(c => c[axis]))
            : Math.max(...pattern.corners.map(c => c[axis]));
        }
        return pattern.center[axis] + (type === 'min' ? -halfFinder : halfFinder);
      };
      
      
      // QR 코드 모서리 계산 - 모든 모서리를 교점으로 계산
      let tlCorner = { x: 0, y: 0 };
      let trCorner = { x: 0, y: 0 };
      let blCorner = { x: 0, y: 0 };
      let brCorner = { x: 0, y: 0 };
      
      if (topLeft.corners && topRight.corners && bottomLeft.corners &&
          topLeft.corners.length === 4 && topRight.corners.length === 4 && bottomLeft.corners.length === 4) {
        
        // TL Corner: Top-left의 왼쪽 변과 위쪽 변의 교점
        const tlLeftEdge = [...topLeft.corners].sort((a, b) => a.x - b.x).slice(0, 2).sort((a, b) => a.y - b.y);
        const tlTopEdge = [...topLeft.corners].sort((a, b) => a.y - b.y).slice(0, 2).sort((a, b) => a.x - b.x);
        
        const tlIntersection = calculateLineIntersection(
          { p1: tlLeftEdge[0], p2: tlLeftEdge[1] },
          { p1: tlTopEdge[0], p2: tlTopEdge[1] }
        );
        if (tlIntersection) tlCorner = tlIntersection;
        
        // TR Corner: Top-right의 오른쪽 변과 위쪽 변의 교점
        const trRightEdge = [...topRight.corners].sort((a, b) => b.x - a.x).slice(0, 2).sort((a, b) => a.y - b.y);
        const trTopEdge = [...topRight.corners].sort((a, b) => a.y - b.y).slice(0, 2).sort((a, b) => a.x - b.x);
        
        const trIntersection = calculateLineIntersection(
          { p1: trRightEdge[0], p2: trRightEdge[1] },
          { p1: trTopEdge[0], p2: trTopEdge[1] }
        );
        if (trIntersection) trCorner = trIntersection;
        
        // BL Corner: Bottom-left의 왼쪽 변과 아래쪽 변의 교점
        const blLeftEdge = [...bottomLeft.corners].sort((a, b) => a.x - b.x).slice(0, 2).sort((a, b) => a.y - b.y);
        const blBottomEdge = [...bottomLeft.corners].sort((a, b) => b.y - a.y).slice(0, 2).sort((a, b) => a.x - b.x);
        
        const blIntersection = calculateLineIntersection(
          { p1: blLeftEdge[0], p2: blLeftEdge[1] },
          { p1: blBottomEdge[0], p2: blBottomEdge[1] }
        );
        if (blIntersection) blCorner = blIntersection;
        
        // BR Corner: Top-right의 오른쪽 변과 Bottom-left의 아래쪽 변의 연장선 교점
        const brIntersection = calculateLineIntersection(
          { p1: trRightEdge[0], p2: trRightEdge[1] },
          { p1: blBottomEdge[0], p2: blBottomEdge[1] }
        );
        if (brIntersection) brCorner = brIntersection;
      } else {
        // corners 정보가 없으면 기본값 사용
        const tlMinX = getExtremePoint(topLeft, 'min', 'x');
        const tlMinY = getExtremePoint(topLeft, 'min', 'y');
        const trMaxX = getExtremePoint(topRight, 'max', 'x');
        const trMinY = getExtremePoint(topRight, 'min', 'y');
        const blMinX = getExtremePoint(bottomLeft, 'min', 'x');
        const blMaxY = getExtremePoint(bottomLeft, 'max', 'y');
        
        tlCorner = { x: tlMinX, y: tlMinY };
        trCorner = { x: trMaxX, y: trMinY };
        blCorner = { x: blMinX, y: blMaxY };
        brCorner = {
          x: blCorner.x + (trCorner.x - tlCorner.x),
          y: trCorner.y + (blCorner.y - tlCorner.y)
        };
      }
      
      // 대각선의 교점(중심점) 계산
      const center = calculateLineIntersection(
        { p1: tlCorner, p2: brCorner },  // TL-BR 대각선
        { p1: trCorner, p2: blCorner }   // TR-BL 대각선
      ) || calculateCenter([tlCorner, trCorner, blCorner, brCorner]);
      
      // 중심점 기준으로 패딩 적용 (5% 확대)
      const paddingScale = 1.05;
      const corners = [tlCorner, trCorner, blCorner, brCorner];
      const paddedCorners = scaleFromCenter(corners, center, paddingScale);
      const [paddedTL, paddedTR, paddedBL, paddedBR] = paddedCorners;
      
      // QR 코드 전체 범위 그리기 (패딩 적용된 좌표 사용)
      ctx.strokeStyle = '#00FF00'; // 녹색
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]); // 점선
      
      ctx.beginPath();
      ctx.moveTo(paddedTL.x, paddedTL.y);
      ctx.lineTo(paddedTR.x, paddedTR.y);
      ctx.lineTo(paddedBR.x, paddedBR.y);
      ctx.lineTo(paddedBL.x, paddedBL.y);
      ctx.closePath();
      ctx.stroke();
      
      ctx.setLineDash([]); // 점선 해제
      
      // 모서리 점 표시
      ctx.fillStyle = '#00FF00';
      const drawCornerDot = (corner: {x: number, y: number}, label: string) => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.fillText(label, corner.x + 10, corner.y - 5);
        ctx.fillStyle = '#00FF00';
      };
      
      drawCornerDot(paddedTL, 'TL');
      drawCornerDot(paddedTR, 'TR');
      drawCornerDot(paddedBL, 'BL');
      drawCornerDot(paddedBR, 'BR');
      
      // 디버깅 정보 표시
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.fillText(`Module size: ${moduleSize.toFixed(2)}px`, 10, 20);
      
      const estimatedModules = Math.round(
        Math.sqrt(
          Math.pow(trCorner.x - tlCorner.x, 2) + 
          Math.pow(blCorner.y - tlCorner.y, 2)
        ) / moduleSize
      );
      const estimatedVersion = Math.round((estimatedModules - 17) / 4);
      ctx.fillText(`Estimated: ${estimatedModules} modules (v${estimatedVersion})`, 10, 40);
    }
  }, [finderDetection]);

  return (
    <div className="step-column">
      <h3 className="step-title">Step 4: Finder Pattern Detection</h3>
      
      <div className="space-y-3">
        {/* 검출 결과 요약 */}
        <div className="info-section">
          <h4 className="info-title">Detection Results</h4>
          {finderDetection ? (
            <div className="space-y-2">
              <div className="info-item">
                <span className="info-label">Candidates Found:</span>
                <span className="info-value">{finderDetection.candidates.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Selected Patterns:</span>
                <span className="info-value">{finderDetection.patterns.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Confidence:</span>
                <span className="info-value">
                  {(finderDetection.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Processing...</p>
          )}
        </div>

        {/* 시각화 캔버스 */}
        <div className="visualization-section">
          <h4 className="info-title">Pattern Visualization</h4>
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className="w-full h-auto border border-gray-300 rounded"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>
          {finderDetection && (
            <div className="mt-2 text-xs text-gray-600">
              <p>• Gray boxes: Candidate patterns</p>
              <p>• Red boxes: Selected finder patterns</p>
              <p>• Numbers: Pattern quality scores</p>
              <p>• Green dashed box: Estimated QR code boundary</p>
              <p>• Green dots: Corner points (TL, TR, BL, BR)</p>
            </div>
          )}
        </div>

        {/* 선택된 패턴 상세 정보 */}
        {finderDetection && finderDetection.patterns.length > 0 && (
          <div className="info-section">
            <h4 className="info-title">Selected Patterns</h4>
            <div className="space-y-2">
              {finderDetection.patterns.map((pattern, index) => (
                <div key={index} className="pattern-info">
                  <div className="text-sm font-medium">Pattern {index + 1}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Center:</span>{' '}
                      ({pattern.center.x.toFixed(1)}, {pattern.center.y.toFixed(1)})
                    </div>
                    <div>
                      <span className="text-gray-600">Size:</span>{' '}
                      {pattern.size.toFixed(1)}px
                    </div>
                    <div>
                      <span className="text-gray-600">Score:</span>{' '}
                      {pattern.score.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 알고리즘 설명 */}
        <div className="info-section">
          <h4 className="info-title">Algorithm Overview</h4>
          <ol className="text-xs space-y-1 text-gray-600">
            <li>1. Find contours using OpenCV.js</li>
            <li>2. Identify nested square patterns (black-white-black)</li>
            <li>3. Calculate pattern scores based on shape and size</li>
            <li>4. Select top 3 patterns forming valid triangle</li>
            <li>5. Verify 1:1:3:1:1 ratio structure</li>
          </ol>
        </div>
      </div>
    </div>
  );
}