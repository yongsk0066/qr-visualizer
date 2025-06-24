import { useMemo } from 'react';
import type { VersionInfoResult } from '../../qr-decode/decode/version-extraction/types';
import type { TriStateQR } from '../../qr-decode/types';
import { t } from '../../i18n';

interface VersionExtractionColumnProps {
  versionInfo: VersionInfoResult | null;
  triStateMatrix?: TriStateQR | null;
}

interface TriStateMatrixProps {
  matrix: (-1 | 0 | 1)[][];
  size: number;
  scale?: number;
  highlightVersion?: boolean;
}

interface ExtractedRegionProps {
  matrix: (-1 | 0 | 1)[][];
  size: number;
  location: 1 | 2;
}

const TriStateMatrix = ({ matrix, size, scale = 4, highlightVersion = false }: TriStateMatrixProps) => {
  const getModuleColor = (row: number, col: number) => {
    const value = matrix[row][col];
    
    // 버전 정보 영역 하이라이트
    if (highlightVersion && size >= 45) { // 버전 7 이상만
      // 버전 정보 위치 1 (왼쪽 하단, 6×3)
      const isVersionLocation1 = (
        col < 6 && row >= size - 11 && row < size - 8
      );
      
      // 버전 정보 위치 2 (오른쪽 상단, 3×6)
      const isVersionLocation2 = (
        row < 6 && col >= size - 11 && col < size - 8
      );
      
      if (isVersionLocation1) {
        if (value === -1) return '#fbbf24'; // 노란색 (unknown)
        if (value === 1) return '#dc2626';  // 빨간색 (검은 모듈)
        return '#fecaca';                    // 연한 빨간색 (흰 모듈)
      }
      
      if (isVersionLocation2) {
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

// 추출된 영역 시각화 컴포넌트
const ExtractedRegion = ({ matrix, size, location }: ExtractedRegionProps) => {
  const bits: (-1 | 0 | 1)[] = [];
  
  if (location === 1) {
    // Location 1: 왼쪽 하단 (6×3)
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row < 3; row++) {
        const y = size - 11 + row;
        bits.push(matrix[y][col]);
      }
    }
  } else {
    // Location 2: 오른쪽 상단 (3×6)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        const x = size - 11 + col;
        bits.push(matrix[row][x]);
      }
    }
  }

  const width = location === 1 ? 6 : 3;
  const height = location === 1 ? 3 : 6;
  const scale = 20;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium">
        {location === 1 ? t('versionExtraction.location1BottomLeft') : t('versionExtraction.location2TopRight')}
      </div>
      
      {/* 추출된 영역 그리드 */}
      <svg
        width={width * scale}
        height={height * scale}
        viewBox={`0 0 ${width * scale} ${height * scale}`}
        className="border border-gray-300"
      >
        {bits.map((bit, index) => {
          const col = location === 1 ? Math.floor(index / 3) : index % 3;
          const row = location === 1 ? index % 3 : Math.floor(index / 3);
          const fill = bit === -1 ? '#e5e7eb' : bit === 1 ? '#000' : '#fff';
          
          return (
            <g key={index}>
              <rect
                x={col * scale}
                y={row * scale}
                width={scale}
                height={scale}
                fill={fill}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="0.5"
              />
              <text
                x={col * scale + scale/2}
                y={row * scale + scale/2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill={bit === 1 ? '#fff' : '#000'}
              >
                {index}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 읽기 순서 설명 */}
      <div className="text-[10px] text-gray-600">
        {location === 1 ? (
          <div>{t('versionExtraction.readOrderColumnFirst')}</div>
        ) : (
          <div>{t('versionExtraction.readOrderRowFirst')}</div>
        )}
      </div>

      {/* 비트 스트림 */}
      <div className="font-mono text-xs">
        <div className="flex gap-0.5 flex-wrap">
          {bits.map((bit, index) => (
            <span
              key={index}
              className={`px-1 rounded ${
                bit === -1 ? 'bg-gray-200 text-gray-500' :
                bit === 1 ? 'bg-gray-700 text-white' :
                'bg-gray-100'
              }`}
            >
              {bit === -1 ? '?' : bit}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const toBinaryString = (value: number, length: number): string => {
  return value.toString(2).padStart(length, '0');
};

export const VersionExtractionColumn = ({ 
  versionInfo, 
  triStateMatrix 
}: VersionExtractionColumnProps) => {
  const scale = useMemo(() => {
    if (!triStateMatrix) return 4;
    const size = triStateMatrix.size;
    if (size <= 45) return 6;
    if (size <= 77) return 4;
    if (size <= 125) return 3;
    return 2;
  }, [triStateMatrix]);

  const estimatedVersion = triStateMatrix 
    ? Math.floor((triStateMatrix.size - 17) / 4)
    : null;

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.decode.versionExtraction')}</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('versionExtraction.extractingVersion')}
        </p>

        {!triStateMatrix ? (
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">📊</div>
            <div className="text-gray-500 text-sm">{t('versionExtraction.willDisplayWhenDetected')}</div>
          </div>
        ) : (
          <>

          {/* tri-state 매트릭스 시각화 */}
          {estimatedVersion && estimatedVersion >= 7 && (
            <div className="flex flex-col items-center">
              <div className="mb-2 text-center">
                <div className="text-xs font-medium">{t('versionExtraction.versionInfoLocation')}</div>
                <div className="text-xs text-gray-600">{t('versionExtraction.extractFrom18Bits')}</div>
              </div>
              <TriStateMatrix
                matrix={triStateMatrix.matrix}
                size={triStateMatrix.size}
                scale={scale}
                highlightVersion={true}
              />
            </div>
          )}

          {/* 버전 6 이하 메시지 */}
          {estimatedVersion && estimatedVersion <= 6 && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm">
              <div className="font-medium">{t('versionExtraction.version')} {estimatedVersion}</div>
              <div className="text-xs mt-1">
                {t('versionExtraction.noVersionInfo')}
              </div>
              <div className="text-xs mt-1 text-blue-600">
                {t('versionExtraction.matrixSize')} {triStateMatrix.size}×{triStateMatrix.size}
              </div>
            </div>
          )}

          {/* 버전 7 이상 - 추출된 영역 표시 */}
          {estimatedVersion && estimatedVersion >= 7 && triStateMatrix && (
            <div className="grid grid-cols-2 gap-3">
              <ExtractedRegion 
                matrix={triStateMatrix.matrix} 
                size={triStateMatrix.size} 
                location={1} 
              />
              <ExtractedRegion 
                matrix={triStateMatrix.matrix} 
                size={triStateMatrix.size} 
                location={2} 
              />
            </div>
          )}

          {/* 추출된 버전 정보 */}
          {versionInfo && (
            <div className="space-y-3">
              {/* 메인 결과 */}
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs font-medium mb-2">{t('versionExtraction.extractedInfo')}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('versionExtraction.extractedVersion')}</span>
                    <span className="font-mono font-semibold">v{versionInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('versionExtraction.confidence')}</span>
                    <span className="font-mono">{(versionInfo.confidence * 100).toFixed(0)}%</span>
                  </div>
                  {versionInfo.errorBits !== undefined && versionInfo.errorBits > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('versionExtraction.bchCorrected')}</span>
                      <span className="font-mono text-orange-600">{versionInfo.errorBits}{t('versionExtraction.bitsCorrected')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 18비트 상세 정보 */}
              {versionInfo.rawBits !== undefined && (
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-xs font-medium mb-2">{t('versionExtraction.18bitVersionInfo')}</div>
                  <div className="font-mono text-xs space-y-2">
                    <div className="flex gap-0.5 flex-wrap">
                      {toBinaryString(versionInfo.rawBits, 18).split('').map((bit, index) => {
                        let bgColor = '';
                        if (index < 6) bgColor = 'bg-blue-200';
                        else bgColor = 'bg-yellow-200';
                        
                        return (
                          <span key={index} className={`px-1 rounded ${bgColor}`}>
                            {bit}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-gray-600 space-y-0.5">
                      <div>{t('versionExtraction.whole18Bits')} 0x{versionInfo.rawBits.toString(16).toUpperCase().padStart(5, '0')}</div>
                      <div>{t('versionExtraction.versionNumberBits')} {toBinaryString(versionInfo.rawBits >> 12, 6)} = {versionInfo.version}</div>
                      <div>{t('versionExtraction.bchCodeBits')} {toBinaryString(versionInfo.rawBits & 0xFFF, 12)}</div>
                      <div className="text-orange-600 mt-1">
                        {t('versionExtraction.lsbFirst')}
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <div className="text-[10px] text-blue-700">
                        <div className="font-medium mb-1">{t('versionExtraction.versionCalculation')}</div>
                        <div>{toBinaryString(versionInfo.rawBits >> 12, 6)} {t('versionExtraction.binary')}</div>
                        <div>= {Array.from(toBinaryString(versionInfo.rawBits >> 12, 6)).map((bit, idx) => 
                          bit === '1' ? `2^${5-idx}` : null
                        ).filter(Boolean).join(' + ')}</div>
                        <div>= {Array.from(toBinaryString(versionInfo.rawBits >> 12, 6)).map((bit, idx) => 
                          bit === '1' ? Math.pow(2, 5-idx) : null
                        ).filter(Boolean).join(' + ')}</div>
                        <div>= {versionInfo.version} {t('versionExtraction.decimal')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 위치별 상세 결과 */}
              {(versionInfo.location1 || versionInfo.location2) && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{t('versionExtraction.locationResults')}</div>
                  
                  {versionInfo.location1 && (
                    <div className="p-2 bg-red-50 rounded text-xs">
                      <div className="font-medium text-red-700 mb-1">{t('versionExtraction.location1')}</div>
                      <div className="flex gap-3 text-[10px] text-red-600">
                        <span>{t('versionExtraction.valid')}: {versionInfo.location1.isValid ? '✓' : '✗'}</span>
                        <span>{t('versionExtraction.error')}: {versionInfo.location1.errorBits}{t('versionExtraction.bitsError')}</span>
                        <span>{t('versionExtraction.confidence')} {(versionInfo.location1.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {versionInfo.location1.rawBits !== undefined && (
                        <div className="mt-1 font-mono text-[10px]">
                          {t('versionExtraction.original')} 0x{versionInfo.location1.rawBits.toString(16).toUpperCase().padStart(5, '0')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {versionInfo.location2 && (
                    <div className="p-2 bg-purple-50 rounded text-xs">
                      <div className="font-medium text-purple-700 mb-1">{t('versionExtraction.location2')}</div>
                      <div className="flex gap-3 text-[10px] text-purple-600">
                        <span>{t('versionExtraction.valid')}: {versionInfo.location2.isValid ? '✓' : '✗'}</span>
                        <span>{t('versionExtraction.error')}: {versionInfo.location2.errorBits}{t('versionExtraction.bitsError')}</span>
                        <span>{t('versionExtraction.confidence')} {(versionInfo.location2.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {versionInfo.location2.rawBits !== undefined && (
                        <div className="mt-1 font-mono text-[10px]">
                          {t('versionExtraction.original')} 0x{versionInfo.location2.rawBits.toString(16).toUpperCase().padStart(5, '0')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BCH 에러 정정 설명 */}
              {versionInfo.errorBits !== undefined && versionInfo.errorBits > 0 && (
                <div className="p-2 bg-yellow-50 rounded text-xs">
                  <div className="font-medium text-yellow-700 mb-1">{t('versionExtraction.bchErrorCorrection')}</div>
                  <div className="text-[10px] text-yellow-600">
                    <div>{versionInfo.errorBits}{t('versionExtraction.bitsErrorCorrected')}</div>
                    <div>{t('versionExtraction.versionConfirmed').replace('{version}', versionInfo.version.toString())}</div>
                  </div>
                </div>
              )}

              {/* 최종 선택 설명 */}
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="font-medium mb-1">{t('versionExtraction.finalSelection')}</div>
                <div className="text-gray-700">
                  {versionInfo.location1 && versionInfo.location2 ? (
                    versionInfo.location1.confidence >= versionInfo.location2.confidence ? 
                      t('versionExtraction.location1MoreReliable') :
                      t('versionExtraction.location2MoreReliable')
                  ) : (
                    versionInfo.location1 ? t('versionExtraction.onlyLocation1Available') :
                    t('versionExtraction.onlyLocation2Available')
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {!versionInfo && estimatedVersion && estimatedVersion > 6 && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
              {t('versionExtraction.cannotExtractVersion')}
            </div>
          )}

          {/* 범례 */}
          <div className="p-2 bg-gray-50 rounded text-xs">
            <div className="font-medium mb-1">{t('versionExtraction.versionInfoStructure')}</div>
            <div className="space-y-0.5 text-gray-600">
              <div>{t('versionExtraction.structureDetails.version7Plus')}</div>
              <div>{t('versionExtraction.structureDetails.bchErrorCorrection')}</div>
              <div>{t('versionExtraction.structureDetails.maxErrorCorrection')}</div>
              <div>{t('versionExtraction.structureDetails.duplicateStorage')}</div>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-200 rounded"></span>
                <span>{t('versionExtraction.versionNumber')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-200 rounded"></span>
                <span>{t('versionExtraction.bchCode')}</span>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};