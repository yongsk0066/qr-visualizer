import { useMemo } from 'react';
import type { ModulePlacementData } from '../../shared/types';

interface ModulePlacementColumnProps {
  modulePlacement: ModulePlacementData | null;
}

interface QRMatrixProps {
  matrix: (0 | 1 | null)[][];
  moduleTypes: string[][];
  size: number;
  scale?: number;
  zigzagOrder?: number[][];
}

const QRMatrix = ({ matrix, moduleTypes, size, scale = 3, showColors = true }: QRMatrixProps & { showColors?: boolean }) => {
  // 5-6A 단계인지 확인하는 함수
  const isZigzagStep = () => {
    return moduleTypes.some(row => row.some(type => type.startsWith('byte-')));
  };

  const getModuleColor = (value: 0 | 1 | null, type: string) => {
    if (!showColors) {
      // 컬러 없는 버전 - 흑백만
      if (value === null) return '#f8f9fa'; // 빈 공간
      return value === 1 ? '#000' : '#fff';
    }
    
    if (value === null) {
      return type === 'empty' ? '#f8f9fa' : '#e2e8f0'; // 빈 공간은 연한 회색
    }
    
    // 5-6A 단계일 때의 특별한 색상 처리
    if (isZigzagStep()) {
      // 8비트 블록은 채도 낮은 무지개 색상
      if (type.startsWith('byte-')) {
        const byteColors = {
          'byte-0': value === 1 ? '#b91c1c' : '#fecaca',    // 채도 낮은 빨강
          'byte-1': value === 1 ? '#c2410c' : '#fed7aa',    // 채도 낮은 주황
          'byte-2': value === 1 ? '#a16207' : '#fef3c7',    // 채도 낮은 노랑
          'byte-3': value === 1 ? '#15803d' : '#bbf7d0',    // 채도 낮은 초록
          'byte-4': value === 1 ? '#0369a1' : '#bae6fd',    // 채도 낮은 하늘
          'byte-5': value === 1 ? '#1d4ed8' : '#bfdbfe',    // 채도 낮은 파랑
          'byte-6': value === 1 ? '#6d28d9' : '#ddd6fe',    // 채도 낮은 보라
          'byte-7': value === 1 ? '#be185d' : '#fbcfe8'     // 채도 낮은 분홍
        };
        return byteColors[type as keyof typeof byteColors] || (value === 1 ? '#000' : '#fff');
      }
      
      // 기존 모듈들은 흑백으로 표시
      return value === 1 ? '#000' : '#fff';
    }
    
    // 일반 단계에서는 기존 컬러 사용
    const colors = {
      finder: value === 1 ? '#1f2937' : '#f3f4f6',      // 파인더: 진한 회색/연한 회색
      separator: '#fbbf24',                              // 분리자: 노란색
      timing: value === 1 ? '#059669' : '#a7f3d0',      // 타이밍: 초록/연한 초록
      alignment: value === 1 ? '#7c3aed' : '#ddd6fe',   // 얼라인먼트: 보라/연한 보라
      format: '#ef4444',                                 // 포맷: 빨간색
      version: '#f97316',                                // 버전: 주황색
      zigzag: value === 1 ? '#ec4899' : '#fce7f3',      // 지그재그: 핑크/연한 핑크
      data: value === 1 ? '#1e40af' : '#bfdbfe',        // 데이터: 파랑/연한 파랑
      empty: '#f8f9fa'                                   // 빈 공간: 아주 연한 회색
    };
    
    return colors[type as keyof typeof colors] || (value === 1 ? '#000' : '#fff');
  };


  return (
    <div className="border border-gray-200 inline-block bg-white shadow-sm">
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
          row.map((cell, colIndex) => {
            const moduleType = moduleTypes[rowIndex][colIndex];
            return (
              <rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex}
                y={rowIndex}
                width={1}
                height={1}
                fill={getModuleColor(cell, moduleType)}
                stroke={size <= 25 ? 'rgba(0,0,0,0.1)' : 'none'}
                strokeWidth={size <= 25 ? '0.02' : '0'}
              />
            );
          })
        )}
      </svg>
    </div>
  );
};

export const ModulePlacementColumn = ({ modulePlacement }: ModulePlacementColumnProps) => {
  const scale = useMemo(() => {
    if (!modulePlacement) return 3;
    const size = modulePlacement.size;
    if (size <= 21) return 8;      // 버전 1
    if (size <= 29) return 6;      // 버전 2-3
    if (size <= 41) return 5;      // 버전 4-6
    if (size <= 57) return 4;      // 버전 7-10
    return 3;                      // 버전 11+
  }, [modulePlacement]);

  if (!modulePlacement) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">5단계: 모듈 배치</h2>
        <div className="text-gray-500 text-sm">메시지 구성이 완료되면 모듈 배치가 표시됩니다</div>
      </div>
    );
  }

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">5단계: 모듈 배치</h2>
      <p className="text-sm text-gray-600 mb-4">
        {modulePlacement.size}×{modulePlacement.size} 매트릭스 | 
        데이터 모듈: {modulePlacement.usedDataModules}/{modulePlacement.totalDataModules}
      </p>
      
      {/* 가로 스크롤 컨테이너 */}
      <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {modulePlacement.subSteps.map((step, index) => (
              <div key={index} className="flex-shrink-0">
                <div className="text-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    {step.stepName}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    {step.description}
                  </p>
                  <p className="text-xs text-blue-600">
                    +{step.addedModules} 모듈
                  </p>
                </div>
                
                <QRMatrix 
                  matrix={step.matrix}
                  moduleTypes={step.moduleTypes}
                  size={modulePlacement.size}
                  scale={scale}
                  zigzagOrder={'zigzagOrder' in step ? (step as { zigzagOrder?: number[][] }).zigzagOrder : undefined}
                />
              </div>
            ))}
            
            {/* 5단계 완성본 (컬러 없이) */}
            <div className="flex-shrink-0">
              <div className="text-center mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  5단계 완성
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  최종 모듈 배치 완료
                </p>
                <p className="text-xs text-gray-600">
                  흑백 버전
                </p>
              </div>
              
              <QRMatrix 
                matrix={modulePlacement.finalMatrix}
                moduleTypes={modulePlacement.finalModuleTypes}
                size={modulePlacement.size}
                scale={scale}
                showColors={false}
              />
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">모듈 타입</h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-800"></div>
              <span>파인더</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400"></div>
              <span>분리자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600"></div>
              <span>타이밍</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600"></div>
              <span>얼라인먼트</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500"></div>
              <span>포맷</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500"></div>
              <span>버전</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500"></div>
              <span>지그재그</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600"></div>
              <span>데이터</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300"></div>
              <span>빈 공간</span>
            </div>
          </div>
          
          {/* 8비트 블록 범례 (채도 낮은 무지개) */}
          <h6 className="text-xs font-medium mb-2 text-gray-600">8비트 블록 (무지개 색상)</h6>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-300 border border-gray-300"></div>
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-300 border border-gray-300"></div>
              <span>1</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-300 border border-gray-300"></div>
              <span>2</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-300 border border-gray-300"></div>
              <span>3</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-sky-300 border border-gray-300"></div>
              <span>4</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-300 border border-gray-300"></div>
              <span>5</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-300 border border-gray-300"></div>
              <span>6</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-pink-300 border border-gray-300"></div>
              <span>7</span>
            </div>
          </div>
        </div>
    </div>
  );
};