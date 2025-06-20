import { useEffect, useRef } from 'react';
import type { FinderDetectionResult } from '../../qr-decode/types';

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