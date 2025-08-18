import { useMemo } from 'react';
import { t } from '../../config/language';
import type { FormatInfoResult } from '../../qr-decode/decode/format-extraction/types';
import type { TriStateQR } from '../../qr-decode/types';

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
      <h2 className="font-medium mb-3">{t('1단계: 포맷 정보 추출', 'Step 1: Format Information Extraction')}</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('QR 코드의 포맷 정보(에러 정정 레벨, 마스크 패턴)를 추출합니다', 'Extract format information (error correction level, mask pattern) from QR code')}
        </p>

        {!formatInfo || !triStateMatrix ? (
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔍</div>
            <div className="text-gray-500 text-sm">{t('QR 코드를 감지하면 포맷 정보가 표시됩니다', 'Format information will be displayed when QR code is detected')}</div>
          </div>
        ) : (
          <>

          {/* tri-state 매트릭스 시각화 */}
          <div className="flex flex-col items-center">
            <div className="mb-2 text-center">
              <div className="text-xs font-medium">{t('포맷 정보 위치', 'Format Information Location')}</div>
              <div className="text-xs text-gray-600">{t('빨간색 영역에서 15비트 추출', 'Extract 15 bits from red area')}</div>
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
              <div className="text-xs font-medium mb-2">{t('추출된 정보', 'Extracted Information')}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('에러 정정 레벨:', 'Error Correction Level:')}  </span>
                  <span className="font-mono font-semibold">{formatInfo.errorLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('마스크 패턴:', 'Mask Pattern:')}</span>
                  <span className="font-mono font-semibold">{t('패턴', 'Pattern')} {formatInfo.maskPattern}</span>
                </div>
                {formatInfo.errorBits !== undefined && formatInfo.errorBits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('BCH 정정:', 'BCH Correction:')}</span>
                    <span className="font-mono text-orange-600">{formatInfo.errorBits}{t('비트 수정됨', ' bits corrected')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 두 위치의 포맷 비트 상세 */}
            <div className="space-y-2">
              {/* 위치 1 */}
              {formatInfo.location1 && (
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs font-medium mb-1">{t('위치 1 (왼쪽 상단)', 'Location 1 (Top-Left)')}</div>
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
                      <span>{t('신뢰도:', 'Confidence:')} {(formatInfo.location1.confidence * 100).toFixed(0)}%</span>
                      {formatInfo.location1.errorBits > 0 && (
                        <span className="text-orange-600">
                          {formatInfo.location1.errorBits}{t('비트 정정됨', ' bits corrected')}
                        </span>
                      )}
                      <span className="text-orange-600">MSB first</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 위치 2 */}
              {formatInfo.location2 && (
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs font-medium mb-1">{t('위치 2 (오른쪽 하단)', 'Location 2 (Bottom-Right)')}</div>
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
                      <span>{t('신뢰도:', 'Confidence:')} {(formatInfo.location2.confidence * 100).toFixed(0)}%</span>
                      {formatInfo.location2.errorBits > 0 && (
                        <span className="text-orange-600">
                          {formatInfo.location2.errorBits}{t('비트 정정됨', ' bits corrected')}
                        </span>
                      )}
                      <span className="text-orange-600">MSB first</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 범례 */}
              <div className="flex gap-2 text-[10px] text-gray-600 justify-center">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-200 rounded"></span>
                  <span>{t('에러 레벨', 'Error Level')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-200 rounded"></span>
                  <span>{t('마스크', 'Mask')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-200 rounded"></span>
                  <span>BCH</span>
                </div>
              </div>
            </div>

            {/* 최종 선택 결과 */}
            <div className="p-2 bg-blue-50 rounded text-xs">
              <div className="font-medium mb-1">{t('최종 선택', 'Final Selection')}</div>
              <div className="text-gray-700">
                {formatInfo.location1 && formatInfo.location2 ? (
                  formatInfo.location1.confidence >= formatInfo.location2.confidence ? 
                    t('위치 1의 데이터가 더 신뢰할 수 있어 선택되었습니다.', 'Location 1 data was selected as it is more reliable.') :
                    t('위치 2의 데이터가 더 신뢰할 수 있어 선택되었습니다.', 'Location 2 data was selected as it is more reliable.')
                ) : (
                  formatInfo.location1 ? t('위치 1의 데이터만 사용 가능합니다.', 'Only Location 1 data is available.') :
                  t('위치 2의 데이터만 사용 가능합니다.', 'Only Location 2 data is available.')
                )}
              </div>
            </div>
          </div>

          {/* 범례 */}
          <div className="p-2 bg-gray-50 rounded text-xs">
            <div className="font-medium mb-1">{t('포맷 정보 구조', 'Format Information Structure')}</div>
            <div className="space-y-0.5 text-gray-600">
              <div>{t('• 2개의 위치에서 중복 저장 (신뢰성 향상)', '• Stored redundantly at 2 locations (reliability improvement)')}</div>
              <div>{t('• BCH(15,5) 에러 정정 코드 사용', '• Uses BCH(15,5) error correction code')}</div>
              <div>{t('• 최대 3비트 에러까지 정정 가능', '• Can correct up to 3 bit errors')}</div>
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400"></div>
                <span>{t('위치 1', 'Location 1')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400"></div>
                <span>{t('위치 2', 'Location 2')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400"></div>
                <span>Unknown</span>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}