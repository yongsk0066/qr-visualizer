import { useEffect, useRef, useState } from 'react';
import { t } from '@/config/language';
import type { CornerRefinementResult } from '../../qr-decode/types';

interface CornerRefinementColumnProps {
  cornerRefinement: CornerRefinementResult | null;
  binarizationImage: Uint8Array | null;
  width: number;
  height: number;
}

// Sub-component for rendering edge images to avoid hook violations
const EdgeImageVisualizer = ({ data, width, height, title }: { data: Float32Array, width: number, height: number, title: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(width, height);
    // Normalize data for visualization
    let maxVal = 0;
    for(let i=0; i<data.length; i++) if(data[i] > maxVal) maxVal = data[i];
    
    for (let i = 0; i < data.length; i++) {
      const val = Math.floor((data[i] / (maxVal || 1)) * 255);
      imageData.data[i * 4] = val;
      imageData.data[i * 4 + 1] = val;
      imageData.data[i * 4 + 2] = val;
      imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, [data, width, height]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 bg-black"
        style={{ width: '100%', maxWidth: '200px', imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export function CornerRefinementColumn({
  cornerRefinement,
  binarizationImage,
  width,
  height,
}: CornerRefinementColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showProjections] = useState(true);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Animation loop
  useEffect(() => {
    if (!cornerRefinement?.visualizationData.searchHistory) return;
    
    const historyLength = cornerRefinement.visualizationData.searchHistory.length;
    const duration = 2000; // 2 seconds animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentFrame = Math.floor(progress * historyLength);
      
      setAnimationFrame(currentFrame);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [cornerRefinement]);

  useEffect(() => {
    if (!canvasRef.current || !cornerRefinement || !binarizationImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw background (binarized image)
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < binarizationImage.length; i++) {
      const val = binarizationImage[i] === 1 ? 255 : binarizationImage[i]; // Handle 0/1 or 0/255
      imageData.data[i * 4] = val;
      imageData.data[i * 4 + 1] = val;
      imageData.data[i * 4 + 2] = val;
      imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    // Draw Finder Patterns (P1, P2, P3)
    const { p1, p2, p3, initialP4, refinedP4, searchHistory } = cornerRefinement.visualizationData;

    ctx.lineWidth = 2;
    
    // P1 (TL) - Red
    ctx.strokeStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#FF0000';
    ctx.fillText('P1', p1.x + 10, p1.y);

    // P2 (TR) - Green
    ctx.strokeStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#00FF00';
    ctx.fillText('P2', p2.x + 10, p2.y);

    // P3 (BL) - Blue
    ctx.strokeStyle = '#0000FF';
    ctx.beginPath();
    ctx.arc(p3.x, p3.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0000FF';
    ctx.fillText('P3', p3.x + 10, p3.y);

    // Draw Search History (Animated)
    if (searchHistory) {
      const currentHistory = searchHistory.slice(0, animationFrame);
      
      // Draw scanned points
      currentHistory.forEach((item, index) => {
        const alpha = Math.max(0.1, index / searchHistory.length); // Fade in effect
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`; // Yellow dots
        ctx.fillRect(item.p4.x - 1, item.p4.y - 1, 2, 2);
      });

      // Draw "Best So Far" if animating
      if (currentHistory.length > 0) {
        let bestSoFar = currentHistory[0];
        for(const item of currentHistory) {
            if(item.score > bestSoFar.score) bestSoFar = item;
        }
        
        ctx.strokeStyle = '#FFA500'; // Orange
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bestSoFar.p4.x, bestSoFar.p4.y, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Initial P4 (Yellow) - Dashed
    ctx.strokeStyle = '#FFFF00';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(initialP4.x, initialP4.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('Initial P4', initialP4.x + 10, initialP4.y);
    ctx.setLineDash([]);

    // Refined P4 (Magenta) - Solid (Only show when animation finished or nearly finished)
    if (!searchHistory || animationFrame >= searchHistory.length - 1) {
        ctx.strokeStyle = '#FF00FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(refinedP4.x, refinedP4.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#FF00FF';
        ctx.fillText('Refined P4', refinedP4.x + 10, refinedP4.y);
    }

    // Draw Search Area Box around P4
    const searchSize = 40; // Visual approximation
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(refinedP4.x - searchSize/2, refinedP4.y - searchSize/2, searchSize, searchSize);

  }, [cornerRefinement, binarizationImage, width, height, animationFrame]);

  // Render Edge Projection Graphs
  const renderProjectionGraph = (data: Float32Array, title: string, color: string) => {
    if (!data || data.length === 0) return null;

    const maxVal = Math.max(...Array.from(data));
    const height = 60;
    const width = 200;
    
    return (
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1">{title}</div>
        <div className="relative border border-gray-200 bg-white" style={{ width, height }}>
          <svg width={width} height={height} className="absolute top-0 left-0">
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              points={Array.from(data).map((val, idx) => {
                const x = (idx / data.length) * width;
                const y = height - (val / maxVal) * height;
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('5단계: 코너 정밀 보정', 'Step 5: Corner Refinement')}</h2>
      
      {cornerRefinement ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('Edge Projection 분석을 통해 4번째 모서리(P4)의 정확한 위치를 찾습니다.', 'Locate the precise position of the 4th corner (P4) using Edge Projection analysis.')}
          </p>

          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-medium">{t('P4 탐색 시각화', 'P4 Search Visualization')}</div>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-auto border border-gray-200"
              style={{ maxWidth: '100%', imageRendering: 'pixelated' }}
            />
          </div>

          {showProjections && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium mb-2">{t('Edge Projection 분석', 'Edge Projection Analysis')}</div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                 {/* Vertical Edges (Horizontal Lines) */}
                 <div className="space-y-2">
                    <EdgeImageVisualizer
                        data={cornerRefinement.edgeImages.vertical}
                        width={cornerRefinement.edgeImages.width}
                        height={cornerRefinement.edgeImages.height}
                        title={t('수평 엣지 이미지 (Horizontal Edges)', 'Horizontal Edge Image')}
                    />
                    {renderProjectionGraph(
                        cornerRefinement.edgeProjections.horizontal,
                        t('수평 투영 (Horizontal Projection)', 'Horizontal Projection'),
                        '#0000FF'
                    )}
                 </div>

                 {/* Horizontal Edges (Vertical Lines) */}
                 <div className="space-y-2">
                    <EdgeImageVisualizer
                        data={cornerRefinement.edgeImages.horizontal}
                        width={cornerRefinement.edgeImages.width}
                        height={cornerRefinement.edgeImages.height}
                        title={t('수직 엣지 이미지 (Vertical Edges)', 'Vertical Edge Image')}
                    />
                    {renderProjectionGraph(
                        cornerRefinement.edgeProjections.vertical,
                        t('수직 투영 (Vertical Projection)', 'Vertical Projection'),
                        '#FF0000'
                    )}
                 </div>
              </div>

              <div className="mt-2 text-[10px] text-gray-500">
                {t('엣지 이미지의 투영 그래프가 뚜렷한 피크를 보일수록 정렬이 잘 된 상태입니다.', 'Clear peaks in the projection graph indicate good alignment.')}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 bg-gray-50 rounded text-center">
          <div className="text-gray-400 text-3xl mb-2">⏳</div>
          <div className="text-gray-500 text-sm">{t('이전 단계가 완료되면 실행됩니다', 'Waiting for previous step')}</div>
        </div>
      )}
    </div>
  );
}
