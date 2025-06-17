import { useEffect, useRef } from 'react';
import type { FinderDetectionResult, BinarizationResult } from '../../qr-decode/types';

interface FinderDetectionColumnProps {
  binarization: BinarizationResult | null;
  finderDetection: FinderDetectionResult | null;
}

export function FinderDetectionColumn({ binarization, finderDetection }: FinderDetectionColumnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!binarization || !finderDetection || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, binary } = binarization;
    canvas.width = width;
    canvas.height = height;

    // 이진 이미지 그리기
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < binary.length; i++) {
      const value = binary[i] === 1 ? 0 : 255; // 1은 검정, 0은 흰색
      const offset = i * 4;
      imageData.data[offset] = value;     // R
      imageData.data[offset + 1] = value; // G
      imageData.data[offset + 2] = value; // B
      imageData.data[offset + 3] = 255;   // A
    }
    ctx.putImageData(imageData, 0, 0);

    // 후보 패턴 그리기
    finderDetection.candidates.forEach((candidate, index) => {
      // 후보 원 그리기
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.arc(candidate.x, candidate.y, candidate.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // 중심점 표시
      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.beginPath();
      ctx.arc(candidate.x, candidate.y, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 패턴 번호 표시 (배경 추가)
      const text = `${index + 1}`;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 텍스트 배경
      const metrics = ctx.measureText(text);
      const padding = 3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        candidate.x - metrics.width / 2 - padding,
        candidate.y - 6 - padding,
        metrics.width + padding * 2,
        12 + padding * 2
      );
      
      // 텍스트
      ctx.fillStyle = '#cc0000';
      ctx.fillText(text, candidate.x, candidate.y);
    });

    // 선택된 3개의 Finder 패턴 강조
    if (finderDetection.selected) {
      // 삼각형 연결선 먼저 그리기 (뒤에 위치)
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(finderDetection.selected[0].x, finderDetection.selected[0].y);
      ctx.lineTo(finderDetection.selected[1].x, finderDetection.selected[1].y);
      ctx.lineTo(finderDetection.selected[2].x, finderDetection.selected[2].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      
      const labels = ['TL', 'TR', 'BL']; // Top-Left, Top-Right, Bottom-Left
      const colors = ['#00cc00', '#0099ff', '#ff6600']; // 각 패턴별 다른 색상
      
      finderDetection.selected.forEach((point, index) => {
        const color = colors[index];
        
        // 외곽 원
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // 내부 원
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        // 중심점 표시
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 라벨 표시 (배경 추가)
        const label = labels[index];
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 라벨 배경
        const metrics = ctx.measureText(label);
        const padding = 4;
        const labelY = point.y - 35;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        const boxX = point.x - metrics.width / 2 - padding;
        const boxY = labelY - 10 - padding;
        const boxW = metrics.width + padding * 2;
        const boxH = 20 + padding * 2;
        
        // 둥근 사각형 그리기
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 4);
        ctx.fill();
        ctx.stroke();
        
        // 라벨 텍스트
        ctx.fillStyle = color;
        ctx.fillText(label, point.x, labelY);
      });
    }
  }, [binarization, finderDetection]);

  return (
    <div className="step-column">
      <h3 className="step-title">Step 4: Finder Detection</h3>
      
      {finderDetection ? (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <canvas 
              ref={canvasRef} 
              className="w-full h-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          <div className="text-xs space-y-1">
            <p>후보 패턴 수: {finderDetection.candidates.length}</p>
            <p>Finder 패턴 검출: {finderDetection.selected ? '성공' : '실패'}</p>
            {finderDetection.selected && (
              <>
                <p className="font-medium mt-2">검출된 좌표:</p>
                {finderDetection.selected.map((point, idx) => (
                  <p key={idx} className="pl-2">
                    패턴 {idx + 1}: ({point.x.toFixed(1)}, {point.y.toFixed(1)})
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">대기 중...</p>
      )}
    </div>
  );
}