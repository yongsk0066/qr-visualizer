import { useEffect, useRef } from 'react';
import type { FinderDetectionResult } from '../../qr-decode/types';
import { t } from '../../i18n';
import {
  calculateCenter,
  calculateLineIntersection,
  scaleFromCenter,
} from '../../shared/utils/geometry';

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
            ? Math.min(...pattern.corners.map((c) => c[axis]))
            : Math.max(...pattern.corners.map((c) => c[axis]));
        }
        return pattern.center[axis] + (type === 'min' ? -halfFinder : halfFinder);
      };

      // QR 코드 모서리 계산 - 모든 모서리를 교점으로 계산
      let tlCorner = { x: 0, y: 0 };
      let trCorner = { x: 0, y: 0 };
      let blCorner = { x: 0, y: 0 };
      let brCorner = { x: 0, y: 0 };

      if (
        topLeft.corners &&
        topRight.corners &&
        bottomLeft.corners &&
        topLeft.corners.length === 4 &&
        topRight.corners.length === 4 &&
        bottomLeft.corners.length === 4
      ) {
        // TL Corner: Top-left의 왼쪽 변과 위쪽 변의 교점
        const tlLeftEdge = [...topLeft.corners]
          .sort((a, b) => a.x - b.x)
          .slice(0, 2)
          .sort((a, b) => a.y - b.y);
        const tlTopEdge = [...topLeft.corners]
          .sort((a, b) => a.y - b.y)
          .slice(0, 2)
          .sort((a, b) => a.x - b.x);

        const tlIntersection = calculateLineIntersection(
          { p1: tlLeftEdge[0], p2: tlLeftEdge[1] },
          { p1: tlTopEdge[0], p2: tlTopEdge[1] }
        );
        if (tlIntersection) tlCorner = tlIntersection;

        // TR Corner: Top-right의 오른쪽 변과 위쪽 변의 교점
        const trRightEdge = [...topRight.corners]
          .sort((a, b) => b.x - a.x)
          .slice(0, 2)
          .sort((a, b) => a.y - b.y);
        const trTopEdge = [...topRight.corners]
          .sort((a, b) => a.y - b.y)
          .slice(0, 2)
          .sort((a, b) => a.x - b.x);

        const trIntersection = calculateLineIntersection(
          { p1: trRightEdge[0], p2: trRightEdge[1] },
          { p1: trTopEdge[0], p2: trTopEdge[1] }
        );
        if (trIntersection) trCorner = trIntersection;

        // BL Corner: Bottom-left의 왼쪽 변과 아래쪽 변의 교점
        const blLeftEdge = [...bottomLeft.corners]
          .sort((a, b) => a.x - b.x)
          .slice(0, 2)
          .sort((a, b) => a.y - b.y);
        const blBottomEdge = [...bottomLeft.corners]
          .sort((a, b) => b.y - a.y)
          .slice(0, 2)
          .sort((a, b) => a.x - b.x);

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
          y: trCorner.y + (blCorner.y - tlCorner.y),
        };
      }

      // 대각선의 교점(중심점) 계산
      const center =
        calculateLineIntersection(
          { p1: tlCorner, p2: brCorner }, // TL-BR 대각선
          { p1: trCorner, p2: blCorner } // TR-BL 대각선
        ) || calculateCenter([tlCorner, trCorner, blCorner, brCorner]);

      // 중심점 기준으로 패딩 적용 (5% 확대)
      const paddingScale = 1.05;
      const corners = [tlCorner, trCorner, blCorner, brCorner];
      const paddedCorners = scaleFromCenter(corners, center, paddingScale);
      const [paddedTL, paddedTR, paddedBL, paddedBR] = paddedCorners;

      // 이미지 해상도에 비례하는 스케일 계산
      const imageSize = Math.max(canvas.width, canvas.height);
      const scale = imageSize / 512; // 512px 기준으로 스케일 계산
      const lineWidth = Math.max(2, 3 * scale);
      const fontSize = Math.max(12, Math.round(14 * scale));
      const smallFontSize = Math.max(10, Math.round(12 * scale));
      const dotRadius = Math.max(3, 5 * scale);

      // QR 코드 전체 범위 그리기 (패딩 적용된 좌표 사용)
      ctx.strokeStyle = '#00FF00'; // 녹색
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([5 * scale, 5 * scale]); // 점선

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
      const drawCornerDot = (corner: { x: number; y: number }, label: string) => {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText(label, corner.x + 10 * scale, corner.y - 5 * scale);
        ctx.fillStyle = '#00FF00';
      };

      drawCornerDot(paddedTL, 'TL');
      drawCornerDot(paddedTR, 'TR');
      drawCornerDot(paddedBL, 'BL');
      drawCornerDot(paddedBR, 'BR');

      // 디버깅 정보 표시
      ctx.fillStyle = '#000000';
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(`Module size: ${moduleSize.toFixed(2)}px`, 10 * scale, 20 * scale);

      const estimatedModules = Math.round(
        Math.sqrt(Math.pow(trCorner.x - tlCorner.x, 2) + Math.pow(blCorner.y - tlCorner.y, 2)) /
          moduleSize
      );
      const estimatedVersion = Math.round((estimatedModules - 17) / 4);
      ctx.fillText(`Estimated: ${estimatedModules} modules (v${estimatedVersion})`, 10 * scale, 40 * scale);
    }
  }, [finderDetection]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.detect.finderDetection')}</h2>

      {finderDetection ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('finderDetection.description')}
          </p>
          {/* 시각화 캔버스 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('finderDetection.patternDetectionResult')}</div>
            <canvas
              ref={canvasRef}
              className="w-full h-auto border border-gray-200"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            <div className="mt-2 space-y-0.5 text-[11px] text-gray-600">
              <div>• {t('finderDetection.grayBox')}</div>
              <div>• {t('finderDetection.redBox')}</div>
              <div>• {t('finderDetection.numbers')}</div>
              <div>• {t('finderDetection.greenDashedLine')}</div>
              <div>• {t('finderDetection.greenDots')}</div>
            </div>
          </div>

          {/* 검출 통계 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('finderDetection.detectionInfo')}</div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <div className="text-gray-600">{t('finderDetection.candidatePatterns')}</div>
                <div className="font-mono font-semibold">{finderDetection.candidates.length}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">{t('finderDetection.selectedPatterns')}</div>
                <div className="font-mono font-semibold">{finderDetection.patterns.length}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">{t('common.confidence')}</div>
                <div className="font-mono font-semibold">{(finderDetection.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* 선택된 패턴 상세 정보 */}
          {finderDetection.patterns.length > 0 && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium mb-2">{t('finderDetection.selectedPatternDetails')}</div>
              <div className="space-y-2">
                {finderDetection.patterns.map((pattern, index) => (
                  <div key={index} className="p-2 bg-white rounded border border-gray-200">
                    <div className="text-xs font-medium mb-1">{t('finderDetection.pattern')} {index + 1}</div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-gray-600">{t('finderDetection.center')}:</span>
                        <div className="font-mono">({pattern.center.x.toFixed(0)}, {pattern.center.y.toFixed(0)})</div>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('common.size')}:</span>
                        <div className="font-mono">{pattern.size.toFixed(1)}px</div>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('finderDetection.score')}:</span>
                        <div className="font-mono">{pattern.score.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 설명 */}
          <div className="p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium mb-1">{t('finderDetection.algorithm')}</div>
            <div className="space-y-0.5 text-gray-700">
              <div>• {t('finderDetection.algorithmStep1')}</div>
              <div>• {t('finderDetection.algorithmStep2')}</div>
              <div>• {t('finderDetection.algorithmStep3')}</div>
              <div>• {t('finderDetection.algorithmStep4')}</div>
              <div>• {t('finderDetection.algorithmStep5')}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('finderDetection.description')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔍</div>
            <div className="text-gray-500 text-sm">{t('finderDetection.waitingForBinarization')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
