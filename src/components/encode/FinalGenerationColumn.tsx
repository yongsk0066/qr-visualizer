import { useMemo } from 'react';
import type { FinalQRResult } from '../../qr-encode/final-generation/finalGeneration';

interface FinalGenerationColumnProps {
  finalGeneration: FinalQRResult | null;
}

interface QRMatrixProps {
  matrix: (0 | 1 | null)[][];
  size: number;
  scale?: number;
  title: string;
  subtitle?: string;
  highlightAreas?: 'format' | 'version' | 'none';
}

const QRMatrix = ({ matrix, size, scale = 2, title, subtitle, highlightAreas = 'none' }: QRMatrixProps) => {
  const getModuleColor = (row: number, col: number) => {
    const value = matrix[row][col];
    
    if (value === null) {
      return '#f8f9fa'; // 빈 공간
    }
    
    // 특정 영역 하이라이트
    if (highlightAreas === 'format') {
      // 포맷 정보 영역 하이라이트 (대략적인 위치)
      const isFormatArea = (
        (row === 8 && (col <= 8 || col >= size - 8)) ||
        (col === 8 && (row <= 8 || row >= size - 7))
      );
      
      if (isFormatArea) {
        return value === 1 ? '#dc2626' : '#fecaca'; // 빨간색 계열
      }
    } else if (highlightAreas === 'version') {
      // 버전 정보 영역 하이라이트 (버전 7+ 전용)
      const isVersionArea = (
        (row >= size - 11 && row <= size - 9 && col <= 5) || // 좌하단
        (row <= 5 && col >= size - 11 && col <= size - 9)    // 우상단
      );
      
      if (isVersionArea) {
        return value === 1 ? '#ea580c' : '#fed7aa'; // 주황색 계열
      }
    }
    
    return value === 1 ? '#000' : '#fff';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-center">
        <div className="text-xs font-medium">{title}</div>
        {subtitle && <div className="text-xs text-gray-600">{subtitle}</div>}
      </div>
      <div className="border border-gray-200 inline-block bg-white">
        <svg 
          width={size * scale} 
          height={size * scale} 
          viewBox={`0 0 ${size} ${size}`}
          style={{ display: 'block' }}
        >
          {/* 배경 */}
          <rect width={size} height={size} fill="white" />
          
          {/* 모듈별 rect */}
          {matrix.map((row, rowIndex) =>
            row.map((_, colIndex) => {
              return (
                <rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex}
                  y={rowIndex}
                  width={1}
                  height={1}
                  fill={getModuleColor(rowIndex, colIndex)}
                  stroke={size <= 25 ? 'rgba(0,0,0,0.1)' : 'none'}
                  strokeWidth={size <= 25 ? '0.02' : '0'}
                />
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};

const InfoDisplay = ({ finalGeneration }: { finalGeneration: FinalQRResult }) => {
  const formatInfoBinary = finalGeneration.formatInfo.toString(2).padStart(15, '0');
  const versionInfoBinary = finalGeneration.versionInfo ? 
    finalGeneration.versionInfo.toString(2).padStart(18, '0') : null;

  return (
    <div className="p-2 bg-gray-50 rounded border min-w-[140px]">
      <div className="text-xs space-y-1">
        <div className="font-medium text-center">생성 정보</div>
        
        <div className="space-y-1">
          <div className="text-xs">
            <span className="font-medium">선택된 마스크:</span>
            <div className="font-mono text-green-600">패턴 {finalGeneration.selectedMaskPattern}</div>
          </div>
          
          <div className="text-xs">
            <span className="font-medium">포맷 정보:</span>
            <div className="font-mono text-red-600 text-[10px] break-all">
              {formatInfoBinary}
            </div>
            <div className="text-gray-600 text-[10px]">
              (15비트 BCH 코드)
            </div>
          </div>
          
          {versionInfoBinary && (
            <div className="text-xs">
              <span className="font-medium">버전 정보:</span>
              <div className="font-mono text-orange-600 text-[10px] break-all">
                {versionInfoBinary}
              </div>
              <div className="text-gray-600 text-[10px]">
                (18비트 BCH 코드)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const FinalGenerationColumn = ({ finalGeneration }: FinalGenerationColumnProps) => {
  const scale = useMemo(() => {
    if (!finalGeneration) return 3;
    const size = finalGeneration.finalMatrix.length;
    if (size <= 21) return 8;      // 버전 1
    if (size <= 29) return 6;      // 버전 2-3
    if (size <= 41) return 5;      // 버전 4-6
    if (size <= 57) return 4;      // 버전 7-10
    return 3;                      // 버전 11+
  }, [finalGeneration]);

  if (!finalGeneration) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">7단계: 최종 생성</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            포맷 정보와 버전 정보를 추가하여 완전한 QR 코드를 생성합니다
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🎉</div>
            <div className="text-gray-500 text-sm">마스킹이 완료되면 최종 QR 코드가 표시됩니다</div>
          </div>
        </div>
      </div>
    );
  }

  const size = finalGeneration.finalMatrix.length;
  const hasVersionInfo = finalGeneration.versionInfo !== null;

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">7단계: 최종 생성</h2>
      <p className="text-sm text-gray-600 mb-4">
        완성된 QR 코드 (포맷/버전 정보 포함)
      </p>

      <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-auto">
        {/* 4단계 과정 */}
        <div className="flex gap-3 min-w-max">
          <QRMatrix
            matrix={finalGeneration.steps.step1_withSelectedMask}
            size={size}
            scale={scale}
            title="마스킹 적용"
            subtitle="선택된 패턴"
          />
          
          <QRMatrix
            matrix={finalGeneration.steps.step2_withFormatInfo}
            size={size}
            scale={scale}
            title="포맷 정보"
            subtitle="15비트 BCH"
            highlightAreas="format"
          />
          
          {hasVersionInfo && (
            <QRMatrix
              matrix={finalGeneration.steps.step3_withVersionInfo}
              size={size}
              scale={scale}
              title="버전 정보"
              subtitle="18비트 BCH"
              highlightAreas="version"
            />
          )}
          
          <QRMatrix
            matrix={finalGeneration.finalMatrix}
            size={size}
            scale={scale}
            title="최종 완성"
            subtitle="QR 코드"
          />
          
          <InfoDisplay finalGeneration={finalGeneration} />
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">최종 생성 과정</div>
        <div className="space-y-1">
          <div><strong>마스킹 적용:</strong> 선택된 패턴을 인코딩 영역에 XOR</div>
          <div><strong>포맷 정보:</strong> 에러 레벨 + 마스크 패턴 (BCH 인코딩, MSB first)</div>
          {hasVersionInfo && (
            <div><strong>버전 정보:</strong> 버전 7+ 전용 (BCH 인코딩, LSB first)</div>
          )}
          <div><strong>최종 완성:</strong> 스캔 가능한 완전한 QR 코드</div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400"></div>
            <span>포맷 정보 영역</span>
          </div>
          {hasVersionInfo && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-400"></div>
              <span>버전 정보 영역</span>
            </div>
          )}
        </div>
        <div className="mt-2 p-1 bg-blue-100 rounded">
          <div className="text-blue-700 font-medium">🎉 QR 코드 생성 과정 완료!</div>
        </div>
      </div>
    </div>
  );
};