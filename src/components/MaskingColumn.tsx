import { useMemo } from 'react';
import type { ModulePlacementData } from '../shared/types';
import { 
  generateAllMaskMatrices, 
  generateAllEncodingMaskMatrices,
  MASK_DESCRIPTIONS, 
  type MaskPattern 
} from '../qr/masking/maskPatterns';

interface MaskingColumnProps {
  modulePlacement: ModulePlacementData | null;
}

interface QRMatrixProps {
  matrix: (0 | 1 | null)[][];
  maskMatrix: boolean[][];
  size: number;
  scale?: number;
  pattern: MaskPattern;
  title: string;
  isXorResult?: boolean;
}

const QRMatrix = ({ matrix, maskMatrix, size, scale = 2, pattern, title, isXorResult = false }: QRMatrixProps) => {
  const getModuleColor = (row: number, col: number) => {
    if (isXorResult) {
      // XOR 결과: 원본 매트릭스와 마스크를 XOR한 결과
      const originalValue = matrix[row][col];
      const shouldMask = maskMatrix[row][col];
      
      if (originalValue === null) {
        return '#f8f9fa'; // 빈 공간
      }
      
      // XOR 연산: 마스킹이 적용되면 비트를 뒤집음
      const resultValue = shouldMask ? (1 - originalValue) : originalValue;
      return resultValue === 1 ? '#000' : '#fff';
    } else {
      // 마스크 패턴만 표시 (기존 로직)
      const shouldMask = maskMatrix[row][col];
      return shouldMask ? '#000' : '#fff';
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
        <div className="text-xs font-medium">{title}</div>
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
  
  const { matrix, moduleTypes } = finalStep;
  const { size } = modulePlacement;
  
  // 8가지 마스크 매트릭스 생성 (전체 패턴)
  const maskMatrices = generateAllMaskMatrices(modulePlacement.version);
  
  // 8가지 인코딩 영역 마스크 매트릭스 생성 (필터링된 패턴)
  const encodingMaskMatrices = generateAllEncodingMaskMatrices(modulePlacement.version, moduleTypes);
  

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">6단계: 마스킹</h2>
      <p className="text-sm text-gray-600 mb-4">
        8가지 마스크 패턴 (전체 패턴 | 인코딩 영역만 | XOR 결과)
      </p>

      <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {Object.entries(maskMatrices).map(([patternStr, maskMatrix]) => {
          const pattern = parseInt(patternStr) as MaskPattern;
          const encodingMaskMatrix = encodingMaskMatrices[pattern];
          
          // 추가 안전성 체크
          if (!maskMatrix || !Array.isArray(maskMatrix) || !encodingMaskMatrix) {
            return (
              <div key={pattern} className="text-red-500 text-sm p-2">
                패턴 {pattern}: 마스크 데이터 오류
              </div>
            );
          }
          
          return (
            <div key={pattern} className="space-y-3">
              <div className="text-center text-xs font-medium text-gray-700">
                패턴 {pattern}
              </div>
              
              <div className="flex justify-center gap-3">
                <QRMatrix
                  matrix={matrix}
                  maskMatrix={maskMatrix}
                  size={size}
                  scale={scale}
                  pattern={pattern}
                  title="전체 패턴"
                />
                
                <QRMatrix
                  matrix={matrix}
                  maskMatrix={encodingMaskMatrix}
                  size={size}
                  scale={scale}
                  pattern={pattern}
                  title="인코딩 영역만"
                />
                
                <QRMatrix
                  matrix={matrix}
                  maskMatrix={encodingMaskMatrix}
                  size={size}
                  scale={scale}
                  pattern={pattern}
                  title="XOR 결과"
                  isXorResult={true}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
        <div className="font-medium mb-1">마스크 패턴 3단계 비교</div>
        <div className="space-y-1">
          <div><strong>전체 패턴:</strong> 전체 매트릭스에 수학적 패턴 적용</div>
          <div><strong>인코딩 영역만:</strong> 데이터 영역에만 패턴 필터링</div>
          <div><strong>XOR 결과:</strong> 원본 QR과 마스크를 XOR한 최종 결과</div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-black"></div>
            <span>검정 모듈 (비트 1)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white border border-gray-300"></div>
            <span>흰색 모듈 (비트 0)</span>
          </div>
        </div>
        <div className="mt-1 text-gray-600">
          <div>XOR 연산: 마스킹 위치에서 비트 반전</div>
          <div>ISO/IEC 18004: 기능 패턴에는 마스킹 미적용</div>
        </div>
      </div>
    </div>
  );
};