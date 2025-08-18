import { useMemo } from 'react';
import { t } from '../../config/language';
import type { VersionInfoResult } from '../../qr-decode/decode/version-extraction/types';
import type { TriStateQR } from '../../qr-decode/types';

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
        {location === 1 ? t('위치 1 (왼쪽 하단 6×3)', 'Location 1 (Bottom-left 6×3)') : t('위치 2 (오른쪽 상단 3×6)', 'Location 2 (Top-right 3×6)')}
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
          <div>{t('읽기 순서: 열 우선 (↓)', 'Reading Order: Column-first (↓)')}</div>
        ) : (
          <div>{t('읽기 순서: 행 우선 (→)', 'Reading Order: Row-first (→)')}</div>
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
      <h2 className="font-medium mb-3">{t('2단계: 버전 정보 추출', 'Step 2: Version Information Extraction')}</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('QR 코드의 버전 정보를 추출합니다 (버전 7 이상)', 'Extract version information from QR code (version 7 and above)')}
        </p>

        {!triStateMatrix ? (
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">📊</div>
            <div className="text-gray-500 text-sm">{t('QR 코드를 감지하면 버전 정보가 표시됩니다', 'Version information will be displayed when QR code is detected')}</div>
          </div>
        ) : (
          <>

          {/* tri-state 매트릭스 시각화 */}
          {estimatedVersion && estimatedVersion >= 7 && (
            <div className="flex flex-col items-center">
              <div className="mb-2 text-center">
                <div className="text-xs font-medium">{t('버전 정보 위치', 'Version Information Location')}</div>
                <div className="text-xs text-gray-600">{t('두 위치에서 18비트 추출', 'Extract 18 bits from two locations')}</div>
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
              <div className="font-medium">{t('버전', 'Version')} {estimatedVersion}</div>
              <div className="text-xs mt-1">
                {t('버전 정보가 없습니다 (v7 이상에만 존재)', 'No version information (exists only in v7 and above)')}
              </div>
              <div className="text-xs mt-1 text-blue-600">
                {t('매트릭스 크기:', 'Matrix size:')} {triStateMatrix.size}×{triStateMatrix.size}
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
                <div className="text-xs font-medium mb-2">{t('추출된 정보', 'Extracted Information')}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('추출된 버전:', 'Extracted Version:')}</span>
                    <span className="font-mono font-semibold">v{versionInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('신뢰도:', 'Confidence:')}</span>
                    <span className="font-mono">{(versionInfo.confidence * 100).toFixed(0)}%</span>
                  </div>
                  {versionInfo.errorBits !== undefined && versionInfo.errorBits > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('BCH 정정:', 'BCH Correction:')}</span>
                      <span className="font-mono text-orange-600">{versionInfo.errorBits}{t('비트 수정됨', ' bits corrected')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 18비트 상세 정보 */}
              {versionInfo.rawBits !== undefined && (
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-xs font-medium mb-2">{t('18비트 버전 정보', '18-bit Version Information')}</div>
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
                      <div>{t('전체 18비트:', 'Total 18 bits:')} 0x{versionInfo.rawBits.toString(16).toUpperCase().padStart(5, '0')}</div>
                      <div>{t('버전 번호 (6비트):', 'Version Number (6 bits):')} {toBinaryString(versionInfo.rawBits >> 12, 6)} = {versionInfo.version}</div>
                      <div>{t('BCH 코드 (12비트):', 'BCH Code (12 bits):')} {toBinaryString(versionInfo.rawBits & 0xFFF, 12)}</div>
                      <div className="text-orange-600 mt-1">
                        {t('* LSB first 방식: 배열의 첫 비트가 최하위 비트(bit 0)', '* LSB first method: First bit in array is the least significant bit (bit 0)')}
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <div className="text-[10px] text-blue-700">
                        <div className="font-medium mb-1">{t('버전 번호 계산', 'Version Number Calculation')}</div>
                        <div>{toBinaryString(versionInfo.rawBits >> 12, 6)} (2진수)</div>
                        <div>= {Array.from(toBinaryString(versionInfo.rawBits >> 12, 6)).map((bit, idx) => 
                          bit === '1' ? `2^${5-idx}` : null
                        ).filter(Boolean).join(' + ')}</div>
                        <div>= {Array.from(toBinaryString(versionInfo.rawBits >> 12, 6)).map((bit, idx) => 
                          bit === '1' ? Math.pow(2, 5-idx) : null
                        ).filter(Boolean).join(' + ')}</div>
                        <div>= {versionInfo.version} (10진수)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 위치별 상세 결과 */}
              {(versionInfo.location1 || versionInfo.location2) && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">{t('위치별 결과', 'Results by Location')}</div>
                  
                  {versionInfo.location1 && (
                    <div className="p-2 bg-red-50 rounded text-xs">
                      <div className="font-medium text-red-700 mb-1">{t('위치 1 (왼쪽 하단)', 'Location 1 (Bottom-Left)')}</div>
                      <div className="flex gap-3 text-[10px] text-red-600">
                        <span>{t('유효:', 'Valid:')} {versionInfo.location1.isValid ? '✓' : '✗'}</span>
                        <span>{t('에러:', 'Error:')} {versionInfo.location1.errorBits}{t('비트', ' bits')}</span>
                        <span>{t('신뢰도:', 'Confidence:')} {(versionInfo.location1.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {versionInfo.location1.rawBits !== undefined && (
                        <div className="mt-1 font-mono text-[10px]">
                          {t('원본:', 'Raw:')} 0x{versionInfo.location1.rawBits.toString(16).toUpperCase().padStart(5, '0')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {versionInfo.location2 && (
                    <div className="p-2 bg-purple-50 rounded text-xs">
                      <div className="font-medium text-purple-700 mb-1">{t('위치 2 (오른쪽 상단)', 'Location 2 (Top-Right)')}</div>
                      <div className="flex gap-3 text-[10px] text-purple-600">
                        <span>{t('유효:', 'Valid:')} {versionInfo.location2.isValid ? '✓' : '✗'}</span>
                        <span>{t('에러:', 'Error:')} {versionInfo.location2.errorBits}{t('비트', ' bits')}</span>
                        <span>{t('신뢰도:', 'Confidence:')} {(versionInfo.location2.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {versionInfo.location2.rawBits !== undefined && (
                        <div className="mt-1 font-mono text-[10px]">
                          {t('원본:', 'Raw:')} 0x{versionInfo.location2.rawBits.toString(16).toUpperCase().padStart(5, '0')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* BCH 에러 정정 설명 */}
              {versionInfo.errorBits !== undefined && versionInfo.errorBits > 0 && (
                <div className="p-2 bg-yellow-50 rounded text-xs">
                  <div className="font-medium text-yellow-700 mb-1">{t('BCH 에러 정정', 'BCH Error Correction')}</div>
                  <div className="text-[10px] text-yellow-600">
                    <div>{versionInfo.errorBits}{t('비트 에러가 감지되어 정정되었습니다.', ' bit errors were detected and corrected.')}</div>
                    <div>{t('정정 후 버전', 'After correction, version')} {versionInfo.version}{t('이 확인되었습니다.', ' was confirmed.')}</div>
                  </div>
                </div>
              )}

              {/* 최종 선택 설명 */}
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="font-medium mb-1">{t('최종 선택', 'Final Selection')}</div>
                <div className="text-gray-700">
                  {versionInfo.location1 && versionInfo.location2 ? (
                    versionInfo.location1.confidence >= versionInfo.location2.confidence ? 
                      t('위치 1의 데이터가 더 신뢰할 수 있어 선택되었습니다.', 'Location 1 data was selected as it is more reliable.') :
                      t('위치 2의 데이터가 더 신뢰할 수 있어 선택되었습니다.', 'Location 2 data was selected as it is more reliable.')
                  ) : (
                    versionInfo.location1 ? t('위치 1의 데이터만 사용 가능합니다.', 'Only Location 1 data is available.') :
                    t('위치 2의 데이터만 사용 가능합니다.', 'Only Location 2 data is available.')
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {!versionInfo && estimatedVersion && estimatedVersion > 6 && (
            <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
              {t('버전 정보를 추출할 수 없습니다.', 'Cannot extract version information.')}
            </div>
          )}

          {/* 범례 */}
          <div className="p-2 bg-gray-50 rounded text-xs">
            <div className="font-medium mb-1">{t('버전 정보 구조', 'Version Information Structure')}</div>
            <div className="space-y-0.5 text-gray-600">
              <div>{t('• 버전 7-40에만 존재 (18비트)', '• Exists only in version 7-40 (18 bits)')}</div>
              <div>{t('• BCH(18,6) 에러 정정 코드 사용', '• Uses BCH(18,6) error correction code')}</div>
              <div>{t('• 최대 3비트 에러까지 정정 가능', '• Can correct up to 3 bit errors')}</div>
              <div>{t('• 2개 위치에 중복 저장', '• Stored redundantly at 2 locations')}</div>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-200 rounded"></span>
                <span>{t('버전 번호', 'Version Number')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-200 rounded"></span>
                <span>{t('BCH 코드', 'BCH Code')}</span>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};