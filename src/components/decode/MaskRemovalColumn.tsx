import { useMemo } from 'react';
import type { MaskRemovalResult } from '../../qr-decode/decode/mask-removal/types';
import type { TriStateQR } from '../../qr-decode/types';
import { MASK_DESCRIPTIONS, MASK_PATTERNS, type MaskPattern } from '../../qr-encode/masking/maskPatterns';

interface MaskRemovalColumnProps {
  maskRemovalResult: MaskRemovalResult | null;
  triStateMatrix?: TriStateQR | null;
}

interface MatrixProps {
  matrix: (0 | 1)[][];
  size: number;
  scale?: number;
  mode?: 'original' | 'mask' | 'result';
  maskPattern?: number;
  dataModules?: boolean[][];
}

const Matrix = ({ matrix, size, scale = 4, mode = 'original', maskPattern, dataModules }: MatrixProps) => {
  const getModuleColor = (row: number, col: number) => {
    const value = matrix[row][col];
    
    if (mode === 'mask' && maskPattern !== undefined) {
      // 마스크 패턴 표시 모드
      const maskFunction = MASK_PATTERNS[maskPattern as MaskPattern];
      const shouldMask = maskFunction(row, col);
      const isData = dataModules?.[row][col];
      
      if (isData && shouldMask) {
        return '#3b82f6'; // 파란색: 마스크가 적용되는 데이터 영역
      } else if (isData) {
        return '#e5e7eb'; // 연한 회색: 마스크가 적용되지 않는 데이터 영역
      } else {
        return '#fff'; // 흰색: 기능 패턴 영역
      }
    } else {
      // 원본 및 결과 표시 모드 - 단순 검정/흰색
      return value === 1 ? '#000' : '#fff';
    }
  };

  return (
    <div className="border border-gray-200 inline-block bg-white">
      <svg 
        width={size * scale} 
        height={size * scale} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block' }}
      >
        <rect width={size} height={size} fill="white" />
        
        {matrix.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex}
              y={rowIndex}
              width={1}
              height={1}
              fill={getModuleColor(rowIndex, colIndex)}
              stroke="none"
              strokeWidth="0"
            />
          ))
        )}
      </svg>
    </div>
  );
};

export function MaskRemovalColumn({ maskRemovalResult, triStateMatrix }: MaskRemovalColumnProps) {
  const scale = useMemo(() => {
    if (!triStateMatrix) return 4;
    const size = triStateMatrix.size;
    if (size <= 25) return 6;
    if (size <= 45) return 4;
    if (size <= 65) return 3;
    return 2;
  }, [triStateMatrix]);

  // 마스크 제거 전 매트릭스 (tri-state를 0/1로 변환)
  const beforeMatrix = useMemo(() => {
    if (!triStateMatrix) return null;
    
    const { matrix, size } = triStateMatrix;
    const result: (0 | 1)[][] = Array.from(
      { length: size }, 
      () => Array(size).fill(0)
    );
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = matrix[r][c];
        result[r][c] = value === -1 ? 0 : value as (0 | 1);
      }
    }
    
    return result;
  }, [triStateMatrix]);

  // 마스크 패턴 시각화용 매트릭스 (모든 데이터 영역을 흰색으로)
  const maskVisualizationMatrix = useMemo(() => {
    if (!triStateMatrix || !maskRemovalResult) return null;
    
    const size = triStateMatrix.size;
    const result: (0 | 1)[][] = Array.from(
      { length: size }, 
      () => Array(size).fill(0)
    );
    
    // 기능 패턴은 원본 값 유지, 데이터 영역은 모두 흰색
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!maskRemovalResult.dataModules[r][c]) {
          // 기능 패턴은 원본 값 유지
          const value = triStateMatrix.matrix[r][c];
          result[r][c] = value === -1 ? 0 : value as (0 | 1);
        }
      }
    }
    
    return result;
  }, [triStateMatrix, maskRemovalResult]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">3단계: 마스크 패턴 제거</h2>
      
      {!maskRemovalResult || !triStateMatrix || !beforeMatrix || !maskVisualizationMatrix ? (
        <div className="text-gray-500 text-sm">마스크 제거를 기다리는 중...</div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            데이터 모듈에 적용된 마스크 패턴을 제거하여 원본 데이터를 복원합니다
          </p>

          {/* 마스크 패턴 정보 */}
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">마스크 패턴 정보</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">패턴 번호:</span>
                <span className="font-mono font-semibold">{maskRemovalResult.maskPattern}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">패턴 공식:</span>
                <span className="font-mono text-[10px]">
                  {MASK_DESCRIPTIONS[maskRemovalResult.maskPattern]}
                </span>
              </div>
            </div>
          </div>


          {/* 3개 컬럼 매트릭스 시각화 */}
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max justify-center">
              {/* 원본 (마스크 제거 전) */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium mb-2">마스크 제거 전</div>
                <Matrix
                  matrix={beforeMatrix}
                  size={triStateMatrix.size}
                  scale={scale}
                  mode="original"
                />
              </div>

              {/* 마스크 패턴 */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium mb-2">× 마스크 패턴 {maskRemovalResult.maskPattern}</div>
                <Matrix
                  matrix={maskVisualizationMatrix}
                  size={triStateMatrix.size}
                  scale={scale}
                  mode="mask"
                  maskPattern={maskRemovalResult.maskPattern}
                  dataModules={maskRemovalResult.dataModules}
                />
              </div>

              {/* 결과 (마스크 제거 후) */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium mb-2">= 마스크 제거 후</div>
                <Matrix
                  matrix={maskRemovalResult.unmaskedMatrix}
                  size={triStateMatrix.size}
                  scale={scale}
                  mode="result"
                />
              </div>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium mb-2">마스크 제거 통계</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">총 모듈 수:</span>
                  <span className="font-mono">{triStateMatrix.size * triStateMatrix.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">데이터 모듈:</span>
                  <span className="font-mono">{maskRemovalResult.dataModuleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">마스크 적용 모듈:</span>
                  <span className="font-mono">
                    {maskRemovalResult.maskedModules.flat().filter(Boolean).length}
                  </span>
                </div>
                {maskRemovalResult.unknownModuleCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unknown 모듈:</span>
                    <span className="font-mono text-orange-600">
                      {maskRemovalResult.unknownModuleCount}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">신뢰도:</span>
                  <span className="font-mono font-semibold">
                    {(maskRemovalResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 범례 */}
            <div className="p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium mb-1">마스크 패턴 표시</div>
              <div className="flex gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>마스크 적용 영역</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span>데이터 영역 (마스크 미적용)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                  <span>기능 패턴 영역</span>
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div className="p-2 bg-blue-50 rounded text-xs">
              <div className="font-medium mb-1">마스크 제거 과정</div>
              <div className="space-y-0.5 text-gray-700">
                <div>• 포맷 정보에서 추출한 마스크 패턴 번호 사용</div>
                <div>• 데이터 모듈에만 마스크 패턴 적용 (기능 패턴 제외)</div>
                <div>• 마스크 위치에서 XOR 연산으로 원본 데이터 복원</div>
                <div>• Unknown 모듈은 흰색(0)으로 가정</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}