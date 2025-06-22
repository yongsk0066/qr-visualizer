import { useMemo } from 'react';
import type { DataReadingResult } from '../../qr-decode/decode/data-reading/types';

interface DataReadingColumnProps {
  dataReadingResult: DataReadingResult | null;
  unmaskedMatrix?: (0 | 1)[][] | null;
  dataModules?: boolean[][] | null;
}

interface MatrixProps {
  matrix: (0 | 1)[][];
  size: number;
  scale?: number;
  dataModules?: boolean[][];
  byteBlocks?: number[][];
  showZigzag?: boolean;
}

const Matrix = ({ matrix, size, scale = 4, dataModules, byteBlocks, showZigzag = false }: MatrixProps) => {
  // 8가지 색상 (무지개색)
  const byteColors = [
    '#ef4444', // 빨강
    '#f97316', // 주황
    '#f59e0b', // 노랑
    '#22c55e', // 초록
    '#3b82f6', // 파랑
    '#6366f1', // 남색
    '#a855f7', // 보라
    '#ec4899', // 핑크
  ];

  const getModuleColor = (row: number, col: number) => {
    const value = matrix[row][col];
    const isData = dataModules?.[row][col];
    
    if (showZigzag && isData && byteBlocks) {
      const byteIndex = byteBlocks[row][col];
      if (byteIndex >= 0) {
        const color = byteColors[byteIndex % 8];
        return color;
      }
    }
    
    // dataModules가 제공되지 않은 경우 (전체 매트릭스 표시)
    if (!dataModules) {
      return value === 1 ? '#000' : '#fff';
    }
    
    // dataModules가 제공된 경우
    if (!isData) {
      return '#f3f4f6'; // 연한 회색: 기능 패턴
    }
    return value === 1 ? '#000' : '#fff';
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
              fillOpacity={showZigzag && dataModules?.[rowIndex][colIndex] ? 0.7 : 1}
              stroke="none"
              strokeWidth="0"
            />
          ))
        )}
      </svg>
    </div>
  );
};

export function DataReadingColumn({ 
  dataReadingResult, 
  unmaskedMatrix,
  dataModules 
}: DataReadingColumnProps) {
  const scale = useMemo(() => {
    if (!unmaskedMatrix) return 4;
    const size = unmaskedMatrix.length;
    if (size <= 45) return 6;
    if (size <= 77) return 4;
    if (size <= 125) return 3;
    return 2;
  }, [unmaskedMatrix]);

  if (!dataReadingResult || !unmaskedMatrix || !dataModules) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">4단계: 데이터 모듈 읽기</h2>
        <div className="text-gray-500 text-sm">데이터 읽기를 기다리는 중...</div>
      </div>
    );
  }

  const { 
    bitStream, 
    totalBits, 
    codewords, 
    dataCodewordCount, 
    errorCorrectionCodewordCount,
    byteBlocks,
    confidence 
  } = dataReadingResult;

  // 비트스트림을 8비트 그룹으로 나누기
  const bitGroups: string[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    bitGroups.push(bitStream.slice(i, i + 8));
  }

  // 8가지 색상 (무지개색)
  const byteColors = [
    '#ef4444', // 빨강
    '#f97316', // 주황
    '#f59e0b', // 노랑
    '#22c55e', // 초록
    '#3b82f6', // 파랑
    '#6366f1', // 남색
    '#a855f7', // 보라
    '#ec4899', // 핑크
  ];

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">4단계: 데이터 모듈 읽기</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          지그재그 패턴으로 데이터 모듈을 읽어 비트스트림을 생성합니다
        </p>

        {/* 3개 컬럼 매트릭스 시각화 */}
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max justify-center">
            {/* 전체 매트릭스 */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium mb-2">전체 매트릭스</div>
              <Matrix
                matrix={unmaskedMatrix}
                size={unmaskedMatrix.length}
                scale={scale}
              />
            </div>

            {/* 데이터 영역만 표시 */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium mb-2">데이터 영역</div>
              <Matrix
                matrix={unmaskedMatrix}
                size={unmaskedMatrix.length}
                scale={scale}
                dataModules={dataModules}
              />
            </div>

            {/* 지그재그 패턴 시각화 */}
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium mb-2">지그재그 읽기 패턴</div>
              <Matrix
                matrix={unmaskedMatrix}
                size={unmaskedMatrix.length}
                scale={scale}
                dataModules={dataModules}
                byteBlocks={byteBlocks}
                showZigzag={true}
              />
            </div>
          </div>
        </div>

        {/* 비트스트림 표시 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">비트스트림 ({totalBits} 비트)</div>
          <div className="font-mono text-[10px] space-y-1">
            {bitGroups.map((group, index) => (
              <span key={index} className="inline-block mr-1">
                <span 
                  className="px-1 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${byteColors[index % 8]}20`,
                    color: byteColors[index % 8]
                  }}
                >
                  {group}
                </span>
                <span className="text-gray-500 ml-0.5">
                  {parseInt(group.padEnd(8, '0'), 2).toString(16).padStart(2, '0').toUpperCase()}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 코드워드 시각화 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">전체 코드워드</div>
          <div className="text-[10px] text-gray-600 mb-2">
            총 {codewords.length}개 = 데이터 {dataCodewordCount}개 + 에러 정정 {errorCorrectionCodewordCount}개
          </div>
          <div className="font-mono text-[10px] flex flex-wrap gap-1">
            {codewords.map((codeword, index) => {
              const isDataCodeword = index < dataCodewordCount;
              const hexValue = codeword.toString(16).toUpperCase().padStart(2, '0');
              
              return (
                <span
                  key={index}
                  className={`${isDataCodeword ? 'bg-green-200' : 'bg-red-200'} px-1 py-0.5 rounded`}
                  title={isDataCodeword ? '데이터 코드워드' : '에러 정정 코드워드'}
                >
                  {hexValue}
                </span>
              );
            })}
          </div>
        </div>

        {/* 구성 요소 범례 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">구성 요소</div>
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center">
              <span className="bg-green-200 px-2 py-0.5 rounded text-xs font-medium">
                데이터 코드워드
              </span>
              <span className="ml-1 text-gray-600">{dataCodewordCount}개</span>
            </div>
            <span className="text-gray-400 font-medium">+</span>
            <div className="flex items-center">
              <span className="bg-red-200 px-2 py-0.5 rounded text-xs font-medium">
                에러 정정 코드워드
              </span>
              <span className="ml-1 text-gray-600">{errorCorrectionCodewordCount}개</span>
            </div>
            <span className="text-gray-400 font-medium">=</span>
            <span className="bg-blue-100 px-2 py-0.5 rounded text-xs font-medium">
              총 {codewords.length}개
            </span>
          </div>
        </div>

        {/* 신뢰도 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">읽기 신뢰도</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">신뢰도:</span>
              <span className="font-semibold">{(confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${confidence * 100}%`,
                  backgroundColor: confidence >= 1 ? '#22c55e' : confidence >= 0.9 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
            <div className="text-[10px] text-gray-500 leading-relaxed">
              예상 {codewords.length * 8}비트 중 {totalBits}비트를 읽음.
              {confidence >= 1 
                ? " 모든 데이터를 성공적으로 읽었습니다."
                : " 일부 데이터가 누락되어 에러 정정이 필요할 수 있습니다."
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}