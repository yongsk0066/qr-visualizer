import { useMemo } from 'react';
import type { ModulePlacementData } from '../shared/types';

interface ModulePlacementColumnProps {
  modulePlacement: ModulePlacementData | null;
  isProcessing: boolean;
}

interface QRMatrixProps {
  matrix: (0 | 1 | null)[][];
  moduleTypes: string[][];
  size: number;
  scale?: number;
}

const QRMatrix = ({ matrix, moduleTypes, size, scale = 3, showColors = true }: QRMatrixProps & { showColors?: boolean }) => {
  const getModuleColor = (value: 0 | 1 | null, type: string) => {
    if (!showColors) {
      // 컬러 없는 버전 - 흑백만
      if (value === null) return '#f8f9fa'; // 빈 공간
      return value === 1 ? '#000' : '#fff';
    }
    
    if (value === null) {
      return type === 'empty' ? '#f8f9fa' : '#e2e8f0'; // 빈 공간은 연한 회색
    }
    
    // 모듈 타입별 색상
    const colors = {
      finder: value === 1 ? '#1f2937' : '#f3f4f6',      // 파인더: 진한 회색/연한 회색
      separator: '#fbbf24',                              // 분리자: 노란색
      timing: value === 1 ? '#059669' : '#a7f3d0',      // 타이밍: 초록/연한 초록
      alignment: value === 1 ? '#7c3aed' : '#ddd6fe',   // 얼라인먼트: 보라/연한 보라
      format: '#ef4444',                                 // 포맷: 빨간색
      version: '#f97316',                                // 버전: 주황색
      data: value === 1 ? '#1e40af' : '#bfdbfe',        // 데이터: 파란/연한 파간
      empty: '#f8f9fa'                                   // 빈 공간: 아주 연한 회색
    };
    
    return colors[type as keyof typeof colors] || (value === 1 ? '#000' : '#fff');
  };

  return (
    <div 
      className="border border-gray-200 inline-block bg-white shadow-sm"
      style={{ 
        fontSize: 0, // Remove whitespace between elements
        lineHeight: 0 
      }}
    >
      {matrix.map((row, rowIndex) => (
        <div key={rowIndex} style={{ fontSize: 0, lineHeight: 0 }}>
          {row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: scale,
                height: scale,
                backgroundColor: getModuleColor(cell, moduleTypes[rowIndex][colIndex]),
                display: 'inline-block',
                border: size <= 25 ? '0.5px solid rgba(0,0,0,0.1)' : 'none'
              }}
              title={`${moduleTypes[rowIndex][colIndex]} (${rowIndex},${colIndex}): ${cell}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const ModulePlacementColumn = ({ modulePlacement, isProcessing }: ModulePlacementColumnProps) => {
  const scale = useMemo(() => {
    if (!modulePlacement) return 3;
    const size = modulePlacement.size;
    if (size <= 21) return 8;      // 버전 1
    if (size <= 29) return 6;      // 버전 2-3
    if (size <= 41) return 5;      // 버전 4-6
    if (size <= 57) return 4;      // 버전 7-10
    return 3;                      // 버전 11+
  }, [modulePlacement?.size]);

  if (isProcessing) {
    return (
      <div className="step-column">
        <div className="step-header">
          <h3 className="step-title">Step 5: Module Placement</h3>
        </div>
        <div className="step-content">
          <div className="loading-indicator">처리 중...</div>
        </div>
      </div>
    );
  }

  if (!modulePlacement) {
    return (
      <div className="step-column">
        <div className="step-header">
          <h3 className="step-title">Step 5: Module Placement</h3>
          <p className="step-subtitle">7단계 모듈 배치 과정</p>
        </div>
        <div className="step-content">
          <div className="empty-state">
            <p className="text-gray-500">데이터를 입력하세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-column">
      <div className="step-header">
        <h3 className="step-title">Step 5: Module Placement</h3>
        <p className="step-subtitle">
          {modulePlacement.size}×{modulePlacement.size} 매트릭스 | 
          데이터 모듈: {modulePlacement.usedDataModules}/{modulePlacement.totalDataModules}
        </p>
      </div>
      
      <div className="step-content">
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
                />
              </div>
            ))}
            
            {/* Step 5 완성본 (컬러 없이) */}
            <div className="flex-shrink-0">
              <div className="text-center mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Step 5 완성
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
              <div className="w-3 h-3 bg-blue-600"></div>
              <span>데이터</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300"></div>
              <span>빈 공간</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};