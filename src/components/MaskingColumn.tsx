import { useMemo } from 'react';
import type { ModulePlacementData } from '../shared/types';
import { generateAllMaskMatrices, MASK_DESCRIPTIONS, type MaskPattern } from '../qr/masking/maskPatterns';

interface MaskingColumnProps {
  modulePlacement: ModulePlacementData | null;
}

interface QRMatrixProps {
  matrix: (0 | 1 | null)[][];
  maskMatrix: boolean[][];
  size: number;
  scale?: number;
  pattern: MaskPattern;
}

const QRMatrix = ({ matrix, maskMatrix, size, scale = 2, pattern }: QRMatrixProps) => {
  const getModuleColor = (shouldMask: boolean) => {
    // 단순한 흑백 마스크 패턴만 표시
    return shouldMask ? '#000' : '#fff';
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
              // 안전성 체크: maskMatrix 범위 확인
              const shouldMask = maskMatrix[rowIndex] && maskMatrix[rowIndex][colIndex] !== undefined 
                ? maskMatrix[rowIndex][colIndex] 
                : false;
              
              return (
                <rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex}
                  y={rowIndex}
                  width={1}
                  height={1}
                  fill={getModuleColor(shouldMask)}
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

export const MaskingColumn = ({ modulePlacement }: MaskingColumnProps) => {
  // useMemo를 컴포넌트 상단으로 이동 (조건부 호출 방지)
  const scale = useMemo(() => {
    if (!modulePlacement) return 3;
    const size = modulePlacement.size;
    if (size <= 21) return 8;      // 버전 1
    if (size <= 29) return 6;      // 버전 2-3
    if (size <= 41) return 5;      // 버전 4-6
    if (size <= 57) return 4;      // 버전 7-10
    return 3;                      // 버전 11+
  }, [modulePlacement]);

  if (!modulePlacement || !modulePlacement.subSteps || modulePlacement.subSteps.length === 0) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">6단계: 마스킹</h2>
        <div className="text-gray-500 text-sm">모듈 배치가 완료되면 마스킹 패턴이 표시됩니다</div>
      </div>
    );
  }

  // 최종 매트릭스 가져오기 (Step 5-7 완료본)
  const finalStep = modulePlacement.subSteps[modulePlacement.subSteps.length - 1];
  if (!finalStep || !finalStep.matrix) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">6단계: 마스킹</h2>
        <div className="text-gray-500 text-sm">매트릭스 데이터를 불러오는 중...</div>
      </div>
    );
  }
  
  const { matrix } = finalStep;
  const { size } = modulePlacement;
  
  // 8가지 마스크 매트릭스 생성
  const maskMatrices = generateAllMaskMatrices(modulePlacement.version);
  

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">6단계: 마스킹</h2>
      <p className="text-sm text-gray-600 mb-4">
        8가지 마스크 패턴 후보 (검정: 마스킹 적용)
      </p>

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
        <div className="font-medium mb-1">마스크 패턴</div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-black"></div>
            <span>마스킹 적용 위치</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white border border-gray-300"></div>
            <span>마스킹 비적용 위치</span>
          </div>
        </div>
        <div className="mt-1 text-gray-600">
          <div>i: 행 번호, j: 열 번호</div>
        </div>
      </div>
    </div>
  );
};