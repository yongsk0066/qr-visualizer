import { useMemo } from 'react';
import type { ModulePlacementData } from '../shared/types';
import { generateAllMaskMatrices, MASK_DESCRIPTIONS, type MaskPattern } from '../qr/masking/maskPatterns';

interface MaskingColumnProps {
  modulePlacement: ModulePlacementData | null;
  isProcessing: boolean;
}

interface QRMatrixProps {
  matrix: (0 | 1 | null)[][];
  maskMatrix: boolean[][];
  size: number;
  scale?: number;
  pattern: MaskPattern;
}

const QRMatrix = ({ matrix, maskMatrix, size, scale = 2, pattern }: QRMatrixProps) => {
  const getModuleColor = (value: 0 | 1 | null, shouldMask: boolean) => {
    if (value === null) return '#f8f9fa'; // 빈 공간
    
    // 마스크 패턴 시각화를 위한 색상
    if (shouldMask) {
      return value === 1 ? '#ef4444' : '#fecaca'; // 빨간색 계열 (마스킹 대상)
    } else {
      return value === 1 ? '#374151' : '#f3f4f6'; // 회색 계열 (마스킹 비대상)
    }
  };

  // 매트릭스 크기 안전성 체크
  if (!matrix || !maskMatrix || matrix.length === 0 || maskMatrix.length === 0) {
    return (
      <div className="text-red-500 text-sm p-2">
        매트릭스 데이터 오류
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-center">
        <div className="text-xs font-medium">패턴 {pattern}</div>
        <div className="text-xs text-gray-600 font-mono text-[10px]">{MASK_DESCRIPTIONS[pattern]}</div>
      </div>
      <div 
        className="border border-gray-200 inline-block bg-white"
        style={{
          width: size * scale,
          height: size * scale,
          fontSize: 0,
          lineHeight: 0,
          overflow: 'hidden'
        }}
      >
        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} style={{ fontSize: 0, lineHeight: 0, height: scale }}>
            {row.map((cell, colIndex) => {
              // 안전성 체크: maskMatrix 범위 확인
              const shouldMask = maskMatrix[rowIndex] && maskMatrix[rowIndex][colIndex] !== undefined 
                ? maskMatrix[rowIndex][colIndex] 
                : false;
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    width: scale,
                    height: scale,
                    backgroundColor: getModuleColor(cell, shouldMask),
                    display: 'inline-block',
                    verticalAlign: 'top',
                    border: size <= 25 ? '0.5px solid rgba(0,0,0,0.1)' : 'none'
                  }}
                  title={`패턴 ${pattern} (${rowIndex},${colIndex}): ${cell} ${shouldMask ? '[마스킹]' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MaskingColumn = ({ modulePlacement, isProcessing }: MaskingColumnProps) => {
  if (!modulePlacement || !modulePlacement.subSteps || modulePlacement.subSteps.length === 0) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">6단계: 마스킹</h2>
        <div className="text-gray-500">모듈 배치가 완료되면 마스킹 패턴이 표시됩니다.</div>
      </div>
    );
  }

  // 최종 매트릭스 가져오기 (Step 5-7 완료본)
  const finalStep = modulePlacement.subSteps[modulePlacement.subSteps.length - 1];
  if (!finalStep || !finalStep.matrix) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">6단계: 마스킹</h2>
        <div className="text-gray-500">매트릭스 데이터를 불러오는 중...</div>
      </div>
    );
  }
  
  const { matrix } = finalStep;
  const { size } = modulePlacement;
  
  // 8가지 마스크 매트릭스 생성
  const maskMatrices = generateAllMaskMatrices(modulePlacement.version);
  
  
  const scale = useMemo(() => {
    if (size <= 21) return 8;      // 버전 1
    if (size <= 29) return 6;      // 버전 2-3
    if (size <= 41) return 5;      // 버전 4-6
    if (size <= 57) return 4;      // 버전 7-10
    return 3;                      // 버전 11+
  }, [size]);

  return (
    <div className="step-column">
      <div className="mb-4">
        <h2 className="font-medium mb-3">6단계: 마스킹</h2>
        <p className="text-sm text-gray-600 mb-2">
          8가지 마스크 패턴 후보 (빨강: 마스킹 대상)
        </p>
        {isProcessing && (
          <div className="text-sm text-blue-600">⏳ 처리 중...</div>
        )}
      </div>

      <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {Object.entries(maskMatrices).map(([patternStr, maskMatrix]) => {
          const pattern = parseInt(patternStr) as MaskPattern;
          
          // 추가 안전성 체크
          if (!maskMatrix || !Array.isArray(maskMatrix)) {
            return (
              <div key={pattern} className="text-red-500 text-sm p-2">
                패턴 {pattern}: 마스크 데이터 오류
              </div>
            );
          }
          
          return (
            <QRMatrix
              key={pattern}
              matrix={matrix}
              maskMatrix={maskMatrix}
              size={size}
              scale={scale}
              pattern={pattern}
            />
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">범례</div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500"></div>
            <span>마스킹 대상 (검은 모듈)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-200"></div>
            <span>마스킹 대상 (흰 모듈)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-700"></div>
            <span>마스킹 비대상 (검은 모듈)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-100"></div>
            <span>마스킹 비대상 (흰 모듈)</span>
          </div>
        </div>
        <div className="mt-1 text-gray-600">
          <div>i: 행 번호, j: 열 번호</div>
        </div>
      </div>
    </div>
  );
};