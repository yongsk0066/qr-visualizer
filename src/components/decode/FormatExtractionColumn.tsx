import { useMemo } from 'react';
import type { FormatInfoResult } from '../../qr-decode/decode/format-extraction/types';
import type { TriStateQR } from '../../qr-decode/types';
import { t } from '../../i18n';

interface FormatExtractionColumnProps {
  formatInfo: FormatInfoResult | null;
  triStateMatrix?: TriStateQR | null;
}

interface TriStateMatrixProps {
  matrix: (-1 | 0 | 1)[][];
  size: number;
  scale?: number;
  highlightFormat?: boolean;
}

const TriStateMatrix = ({ matrix, size, scale = 4, highlightFormat = false }: TriStateMatrixProps) => {
  const getModuleColor = (row: number, col: number) => {
    const value = matrix[row][col];
    
    // 포맷 정보 영역 하이라이트
    if (highlightFormat) {
      // 포맷 정보 위치 1 (왼쪽 상단)
      const isFormatLocation1 = (
        (row === 8 && col <= 8 && col !== 6) || // 가로줄 (타이밍 패턴 제외)
        (col === 8 && row <= 8 && row !== 6)    // 세로줄 (타이밍 패턴 제외)
      );
      
      // 포맷 정보 위치 2 (오른쪽 하단)
      const isFormatLocation2 = (
        (row === 8 && col >= size - 8) ||       // 우측 가로줄
        (col === 8 && row >= size - 7)          // 하단 세로줄
      );
      
      if (isFormatLocation1) {
        if (value === -1) return '#fbbf24'; // 노란색 (unknown)
        if (value === 1) return '#dc2626';  // 빨간색 (검은 모듈)
        return '#fecaca';                    // 연한 빨간색 (흰 모듈)
      }
      
      if (isFormatLocation2) {
        if (value === -1) return '#f59e0b'; // 주황색 (unknown)
        if (value === 1) return '#7c3aed';  // 보라색 (검은 모듈)
        return '#ddd6fe';                    // 연한 보라색 (흰 모듈)
      }
    }
    
    // 일반 모듈 색상
    if (value === -1) return '#e5e7eb'; // 회색 (unknown)
    if (value === 1) return '#000';      // 검은색 (1)
    return '#fff';                       // 흰색 (0)
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
              stroke={size <= 45 ? 'rgba(0,0,0,0.05)' : 'none'}
              strokeWidth={size <= 45 ? '0.02' : '0'}
            />
          ))
        )}
      </svg>
    </div>
  );
};

export function FormatExtractionColumn({ formatInfo, triStateMatrix }: FormatExtractionColumnProps) {
  const scale = useMemo(() => {
    if (!triStateMatrix) return 4;
    const size = triStateMatrix.size;
    if (size <= 25) return 8;
    if (size <= 45) return 5;
    if (size <= 65) return 4;
    return 3;
  }, [triStateMatrix]);

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.decode.formatExtraction')}</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('formatExtraction.extractingFormat')}
        </p>

        {!formatInfo || !triStateMatrix ? (
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔍</div>
            <div className="text-gray-500 text-sm">{t('formatExtraction.willDisplayWhenDetected')}</div>
          </div>
        ) : (
          <>

          {/* tri-state 매트릭스 시각화 */}
          <div className="flex flex-col items-center">
            <div className="mb-2 text-center">
              <div className="text-xs font-medium">{t('formatExtraction.formatInfoLocation')}</div>
              <div className="text-xs text-gray-600">{t('formatExtraction.extractFrom15Bits')}</div>
            </div>
            <TriStateMatrix
              matrix={triStateMatrix.matrix}
              size={triStateMatrix.size}
              scale={scale}
              highlightFormat={true}
            />
          </div>

          {/* 추출된 정보 표시 */}
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium mb-2">{t('formatExtraction.extractedInfo')}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('formatExtraction.errorCorrectionLevel')}</span>
                  <span className="font-mono font-semibold">{formatInfo.errorLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('formatExtraction.maskPattern')}</span>
                  <span className="font-mono font-semibold">{t('formatExtraction.pattern')} {formatInfo.maskPattern}</span>
                </div>
                {formatInfo.errorBits !== undefined && formatInfo.errorBits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('formatExtraction.bchCorrected')}</span>
                    <span className="font-mono text-orange-600">{formatInfo.errorBits}{t('formatExtraction.bitsCorrected')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 두 위치의 포맷 비트 상세 */}
            <div className="space-y-2">
              {/* 위치 1 */}
              {formatInfo.location1 && (
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs font-medium mb-1">{t('formatExtraction.location1')}</div>
                  <div className="font-mono text-xs">
                    <div className="flex gap-0.5 flex-wrap mb-1">
                      {formatInfo.location1.rawBits.split('').map((bit, index) => {
                        let bgColor = '';
                        if (index < 2) bgColor = 'bg-blue-200';
                        else if (index < 5) bgColor = 'bg-green-200';
                        else bgColor = 'bg-yellow-200';
                        
                        return (
                          <span key={index} className={`px-1 rounded ${bgColor}`}>
                            {bit}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-600">
                      <span>{t('formatExtraction.confidence')} {(formatInfo.location1.confidence * 100).toFixed(0)}%</span>
                      {formatInfo.location1.errorBits > 0 && (
                        <span className="text-orange-600">
                          {formatInfo.location1.errorBits}{t('formatExtraction.bitsCorrected')}
                        </span>
                      )}
                      <span className="text-orange-600">{t('formatExtraction.msbFirst')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 위치 2 */}
              {formatInfo.location2 && (
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs font-medium mb-1">{t('formatExtraction.location2')}</div>
                  <div className="font-mono text-xs">
                    <div className="flex gap-0.5 flex-wrap mb-1">
                      {formatInfo.location2.rawBits.split('').map((bit, index) => {
                        let bgColor = '';
                        if (index < 2) bgColor = 'bg-blue-200';
                        else if (index < 5) bgColor = 'bg-green-200';
                        else bgColor = 'bg-yellow-200';
                        
                        return (
                          <span key={index} className={`px-1 rounded ${bgColor}`}>
                            {bit}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-600">
                      <span>{t('formatExtraction.confidence')} {(formatInfo.location2.confidence * 100).toFixed(0)}%</span>
                      {formatInfo.location2.errorBits > 0 && (
                        <span className="text-orange-600">
                          {formatInfo.location2.errorBits}{t('formatExtraction.bitsCorrected')}
                        </span>
                      )}
                      <span className="text-orange-600">{t('formatExtraction.msbFirst')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 범례 */}
              <div className="flex gap-2 text-[10px] text-gray-600 justify-center">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-200 rounded"></span>
                  <span>{t('formatExtraction.errorLevel')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-200 rounded"></span>
                  <span>{t('formatExtraction.mask')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-200 rounded"></span>
                  <span>{t('formatExtraction.bchCode')}</span>
                </div>
              </div>
            </div>

            {/* 최종 선택 결과 */}
            <div className="p-2 bg-blue-50 rounded text-xs">
              <div className="font-medium mb-1">{t('formatExtraction.finalSelection')}</div>
              <div className="text-gray-700">
                {formatInfo.location1 && formatInfo.location2 ? (
                  formatInfo.location1.confidence >= formatInfo.location2.confidence ? 
                    t('formatExtraction.location1MoreReliable') :
                    t('formatExtraction.location2MoreReliable')
                ) : (
                  formatInfo.location1 ? t('formatExtraction.onlyLocation1Available') :
                  t('formatExtraction.onlyLocation2Available')
                )}
              </div>
            </div>
          </div>

          {/* 범례 */}
          <div className="p-2 bg-gray-50 rounded text-xs">
            <div className="font-medium mb-1">{t('formatExtraction.formatInfoStructure')}</div>
            <div className="space-y-0.5 text-gray-600">
              <div>{t('formatExtraction.structureDetails.duplicateStorage')}</div>
              <div>{t('formatExtraction.structureDetails.bchErrorCorrection')}</div>
              <div>{t('formatExtraction.structureDetails.maxErrorCorrection')}</div>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400"></div>
                <span>{t('formatExtraction.location1').split(' ')[1]}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400"></div>
                <span>{t('formatExtraction.location2').split(' ')[1]}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400"></div>
                <span>{t('common.unknown')}</span>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}