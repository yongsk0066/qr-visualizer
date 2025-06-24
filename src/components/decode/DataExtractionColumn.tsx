import type { ReactNode } from 'react';
import type { DataExtractionResult } from '../../qr-decode/decode/data-extraction/types';
import { t } from '../../i18n';

interface DataExtractionColumnProps {
  dataExtractionResult: DataExtractionResult | null;
  correctedDataCodewords?: number[] | null;
  errorCorrectionFailed?: boolean;
}

export function DataExtractionColumn({
  dataExtractionResult,
  correctedDataCodewords,
  errorCorrectionFailed,
}: DataExtractionColumnProps) {
  // 데이터가 없을 때의 기본 UI
  if (!dataExtractionResult || !correctedDataCodewords) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">{t('steps.decode.dataExtraction')}</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('dataExtraction.description')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">📤</div>
            <div className="text-gray-500 text-sm">{t('dataExtraction.waitingForQR')}</div>
          </div>
        </div>
      </div>
    );
  }

  const {
    segments,
    decodedText,
    bitStream,
    bitsUsed,
    totalBits,
    paddingInfo,
    isValid,
    confidence,
    errorMessage,
  } = dataExtractionResult;


  // 모드 이름 변환
  const getModeName = (mode: number): string => {
    switch (mode) {
      case 0b0001: return t('encode.mode.numeric');
      case 0b0010: return t('encode.mode.alphanumeric');
      case 0b0100: return t('encode.mode.byte');
      case 0b1000: return t('encode.mode.kanji');
      case 0b0111: return t('encode.mode.eci');
      case 0b0000: return t('encode.mode.terminator');
      default: return t('common.unknown');
    }
  };

  // 세그먼트별 색상
  const getSegmentColor = (index: number): string => {
    const colors = [
      'bg-blue-200',
      'bg-green-200',
      'bg-yellow-200',
      'bg-purple-200',
      'bg-pink-200',
      'bg-indigo-200',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.decode.dataExtraction')}</h2>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('dataExtraction.description')}
        </p>

        {/* 에러 정정 실패 경고 */}
        {errorCorrectionFailed && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="text-xs font-medium text-orange-700 mb-1">⚠️ {t('common.warning')}</div>
            <div className="text-xs text-orange-600">
              {t('dataExtraction.errorCorrectionWarning')}
            </div>
          </div>
        )}

        {/* 추출 결과 요약 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('dataExtraction.extractionResult')}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dataExtraction.extractionStatus')}:</span>
              <span
                className={`font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}
              >
                {isValid ? t('common.success') : t('common.failure')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dataExtraction.segmentCount')}:</span>
              <span className="font-mono">{segments.length}{t('common.unit')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dataExtraction.bitsUsed')}:</span>
              <span className="font-mono">{bitsUsed} / {totalBits} bits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('common.confidence')}:</span>
              <span className="font-mono font-semibold">{(confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-xs font-medium text-red-700 mb-1">❌ {t('dataExtraction.extractionFailed')}</div>
            <div className="text-xs text-red-600">{errorMessage}</div>
          </div>
        )}

        {/* 최종 추출 데이터 */}
        <div className="p-3 bg-green-50 rounded">
          <div className="text-xs font-medium mb-2">{t('dataExtraction.extractedData')}</div>
          <div className="font-mono text-sm bg-white p-2 rounded border border-green-200 break-all">
            {decodedText || t('dataExtraction.noData')}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {t('common.length')}: {decodedText.length}{t('common.characters')}
          </div>
        </div>

        {/* 비트 스트림 구조 시각화 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('dataExtraction.bitStreamStructure')}</div>
          
          {/* 컴팩트 비트 시각화 */}
          <div className="font-mono text-[10px] break-all mb-3">
            {segments.map((segment, segIndex) => (
              <span key={segIndex}>
                {/* 모드 지시자 */}
                <span className={`px-0.5 ${getSegmentColor(segIndex)}`}>
                  {segment.modeIndicatorBits}
                </span>
                {/* 문자 개수 */}
                {segment.characterCountBits && (
                  <span className={`px-0.5 ${getSegmentColor(segIndex)} opacity-80`}>
                    {segment.characterCountBits}
                  </span>
                )}
                {/* 데이터 (8비트씩 그룹화) */}
                {segment.dataBits.match(/.{1,8}/g)?.map((byte, byteIdx) => (
                  <span
                    key={byteIdx}
                    className={`px-0.5 ${getSegmentColor(segIndex)} ${
                      byteIdx % 2 === 0 ? 'opacity-100' : 'opacity-70'
                    }`}
                  >
                    {byte}
                  </span>
                ))}
              </span>
            ))}
            {/* 패딩 */}
            {paddingInfo.terminatorPosition !== undefined && (
              <>
                {paddingInfo.terminatorBits > 0 && (
                  <span className="px-0.5 bg-gray-300">
                    {'0'.repeat(paddingInfo.terminatorBits)}
                  </span>
                )}
                {paddingInfo.byteBoundaryPaddingBits > 0 && (
                  <span className="px-0.5 bg-gray-300 opacity-80">
                    {'0'.repeat(paddingInfo.byteBoundaryPaddingBits)}
                  </span>
                )}
                {paddingInfo.paddingPattern.map((pattern, idx) => (
                  <span
                    key={idx}
                    className={`px-0.5 ${
                      pattern === 'EC' ? 'bg-gray-300' : 'bg-gray-400'
                    }`}
                  >
                    {parseInt(pattern, 16).toString(2).padStart(8, '0')}
                  </span>
                ))}
              </>
            )}
          </div>
          
          {/* 세그먼트별 색상 표시 */}
          <div className="space-y-2">
            <div className="relative">
              <div className="h-4 bg-gray-200 rounded overflow-hidden">
                {segments.map((segment, index) => {
                  const width = ((segment.endBit - segment.startBit) / totalBits) * 100;
                  const left = (segment.startBit / totalBits) * 100;
                  return (
                    <div
                      key={index}
                      className={`absolute h-full ${getSegmentColor(index)}`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                      title={`${getModeName(segment.mode)}: ${segment.data}`}
                    />
                  );
                })}
                {/* 패딩 영역 */}
                {paddingInfo.terminatorPosition !== undefined && (
                  <div
                    className="absolute h-full bg-gray-400"
                    style={{
                      left: `${(paddingInfo.terminatorPosition / totalBits) * 100}%`,
                      width: `${((totalBits - paddingInfo.terminatorPosition) / totalBits) * 100}%`,
                    }}
                    title={t('common.padding')}
                  />
                )}
              </div>
            </div>
            
            {/* 범례 */}
            <div className="flex flex-wrap gap-2 text-[10px]">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 ${getSegmentColor(index)} rounded mr-1`} />
                  <span>{getModeName(segment.mode)}: "{segment.data}"</span>
                </div>
              ))}
              {paddingInfo.terminatorPosition !== undefined && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded mr-1" />
                  <span>{t('common.padding')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 세그먼트 상세 정보 */}
        <div className="space-y-3">
          <div className="text-xs font-medium">{t('dataExtraction.segmentDetails')}</div>
          {segments.map((segment, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-xs">
                  {t('dataExtraction.segment')} {index + 1}: {getModeName(segment.mode)}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded ${getSegmentColor(index)}`}>
                  {segment.characterCount}{t('common.characters')}
                </div>
              </div>
              
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-gray-600">{t('dataExtraction.modeIndicator')}:</span>
                  <span className="font-mono ml-1">{segment.modeIndicatorBits}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('dataExtraction.characterCount')}:</span>
                  <span className="font-mono ml-1">{segment.characterCountBits}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('dataExtraction.dataBits')}:</span>
                  <span className="font-mono ml-1 text-[10px]">
                    {segment.dataBits.length > 32 
                      ? segment.dataBits.slice(0, 32) + '...' 
                      : segment.dataBits}
                  </span>
                  <span className="text-gray-500 ml-1">({segment.dataBits.length} bits)</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('dataExtraction.extractedDataLabel')}:</span>
                  <span className="font-mono ml-1 break-all">{segment.data}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('dataExtraction.bitRange')}:</span>
                  <span className="font-mono ml-1">{segment.startBit}-{segment.endBit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 패딩 정보 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('dataExtraction.paddingAnalysis')}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dataExtraction.terminatorPattern')}:</span>
              <span className="font-mono">
                {paddingInfo.terminatorPosition !== undefined
                  ? `${t('dataExtraction.position')} ${paddingInfo.terminatorPosition}, ${paddingInfo.terminatorBits} bits`
                  : t('common.none')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dataExtraction.byteBoundaryPadding')}:</span>
              <span className="font-mono">{paddingInfo.byteBoundaryPaddingBits} bits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dataExtraction.paddingBytes')}:</span>
              <span className="font-mono">{paddingInfo.paddingBytes}{t('common.unit')}</span>
            </div>
            {paddingInfo.paddingPattern.length > 0 && (
              <div>
                <span className="text-gray-600">{t('dataExtraction.paddingPattern')}:</span>
                <div className="font-mono text-[10px] mt-1 flex flex-wrap gap-1">
                  {paddingInfo.paddingPattern.map((pattern, idx) => (
                    <span
                      key={idx}
                      className={`px-1 py-0.5 rounded ${
                        pattern === 'EC' || pattern === '11' 
                          ? 'bg-green-200' 
                          : 'bg-red-200'
                      }`}
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 전체 비트 스트림 시각화 (인코딩 스타일) */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('dataExtraction.fullBitStreamDetails')}</div>
          
          {/* 세그먼트별 비트 스트림 */}
          <div className="space-y-2">
            {segments.map((segment, segIndex) => (
              <div key={segIndex} className="space-y-1">
                <div className="text-[10px] font-medium text-gray-700">
                  {t('dataExtraction.segment')} {segIndex + 1}: {getModeName(segment.mode)}
                </div>
                
                {/* 모드 지시자 */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-gray-600 w-20">{t('dataExtraction.modeIndicator')}:</span>
                  <div className="flex-1">
                    <span className={`font-mono text-[10px] px-1 py-0.5 rounded ${getSegmentColor(segIndex)}`}>
                      {segment.modeIndicatorBits}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-1">
                      ({getModeName(segment.mode)})
                    </span>
                  </div>
                </div>
                
                {/* 문자 개수 지시자 */}
                {segment.characterCountBits && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-600 w-20">{t('dataExtraction.characterCount')}:</span>
                    <div className="flex-1">
                      <span className={`font-mono text-[10px] px-1 py-0.5 rounded ${getSegmentColor(segIndex)}`}>
                        {segment.characterCountBits}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">
                        ({segment.characterCount}{t('common.characters')})
                      </span>
                    </div>
                  </div>
                )}
                
                {/* 데이터 비트 */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-gray-600 w-20">{t('common.data')}:</span>
                  <div className="flex-1">
                    <div className="font-mono text-[10px] break-all">
                      {segment.dataBits.split('').map((bit, bitIndex) => {
                        const byteIndex = Math.floor(bitIndex / 8);
                        return (
                          <span
                            key={bitIndex}
                            className={`inline-block px-0.5 ${
                              byteIndex % 2 === 0 
                                ? `${getSegmentColor(segIndex)} opacity-100` 
                                : `${getSegmentColor(segIndex)} opacity-70`
                            }`}
                          >
                            {bit}
                            {(bitIndex + 1) % 8 === 0 && bitIndex < segment.dataBits.length - 1 && ' '}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      "{segment.data}" ({segment.dataBits.length} bits)
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 패딩 섹션 */}
            {paddingInfo.terminatorPosition !== undefined && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-gray-700">{t('common.padding')}</div>
                
                {/* 종료 패턴 */}
                {paddingInfo.terminatorBits > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-600 w-20">{t('dataExtraction.terminatorPattern')}:</span>
                    <div className="flex-1">
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-gray-300">
                        {'0'.repeat(paddingInfo.terminatorBits)}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">
                        ({paddingInfo.terminatorBits} bits)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* 바이트 경계 패딩 */}
                {paddingInfo.byteBoundaryPaddingBits > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-600 w-20">{t('dataExtraction.byteAlignment')}:</span>
                    <div className="flex-1">
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-gray-300">
                        {'0'.repeat(paddingInfo.byteBoundaryPaddingBits)}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">
                        ({paddingInfo.byteBoundaryPaddingBits} bits)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* 패딩 바이트 */}
                {paddingInfo.paddingBytes > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-600 w-20">{t('dataExtraction.paddingBytes')}:</span>
                    <div className="flex-1">
                      <div className="font-mono text-[10px]">
                        {paddingInfo.paddingPattern.map((pattern, idx) => (
                          <span key={idx} className="inline-block">
                            <span className={`px-1 py-0.5 rounded ${
                              pattern === 'EC' ? 'bg-gray-300' : 'bg-gray-400'
                            }`}>
                              {parseInt(pattern, 16).toString(2).padStart(8, '0')}
                            </span>
                            {idx < paddingInfo.paddingPattern.length - 1 && ' '}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {paddingInfo.paddingPattern.join(' ')} ({paddingInfo.paddingBytes} bytes)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 전체 비트스트림 (8비트 단위) */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-[10px] font-medium text-gray-700 mb-2">{t('dataExtraction.finalBitStream')}</div>
            <div className="font-mono text-[10px] break-all">
              {(() => {
                const elements: ReactNode[] = [];
                
                // 각 영역별 색상 정의
                const getColorForBit = (bitPos: number): string => {
                  // 세그먼트 확인
                  for (let j = 0; j < segments.length; j++) {
                    const segment = segments[j];
                    // 모드 지시자
                    if (bitPos >= segment.startBit && bitPos < segment.startBit + segment.modeIndicatorBits.length) {
                      return 'bg-red-200'; // 모드 지시자는 빨간색
                    }
                    // 문자 개수
                    const charCountStart = segment.startBit + segment.modeIndicatorBits.length;
                    if (bitPos >= charCountStart && bitPos < charCountStart + segment.characterCountBits.length) {
                      return 'bg-blue-200'; // 문자 개수는 파란색
                    }
                    // 데이터
                    const dataStart = charCountStart + segment.characterCountBits.length;
                    if (bitPos >= dataStart && bitPos < segment.endBit) {
                      return 'bg-green-200'; // 데이터는 초록색
                    }
                  }
                  
                  // 패딩 영역 확인
                  // bitsUsed가 실제 데이터가 끝나는 위치
                  if (bitPos >= bitsUsed) {
                    // 종료 패턴 (데이터 직후 최대 4비트)
                    if (bitPos < bitsUsed + paddingInfo.terminatorBits) {
                      return 'bg-yellow-200'; // 종료 패턴은 노란색
                    }
                    // 바이트 경계 패딩
                    const byteBoundaryStart = bitsUsed + paddingInfo.terminatorBits;
                    const byteBoundaryEnd = byteBoundaryStart + paddingInfo.byteBoundaryPaddingBits;
                    if (bitPos >= byteBoundaryStart && bitPos < byteBoundaryEnd) {
                      return 'bg-orange-200'; // 바이트 경계 패딩은 주황색
                    }
                    // 패딩 바이트 (나머지 전부)
                    if (bitPos >= byteBoundaryEnd) {
                      return 'bg-purple-200'; // 패딩 바이트는 보라색
                    }
                  }
                  
                  return ''; // 기본값
                };
                
                // 비트 스트림을 8비트씩 나누어 처리
                for (let i = 0; i < bitStream.length; i += 8) {
                  const byte = bitStream.slice(i, i + 8);
                  
                  // 바이트 내의 각 비트 처리
                  const byteElements: ReactNode[] = [];
                  for (let bitIdx = 0; bitIdx < byte.length; bitIdx++) {
                    const absoluteBitPos = i + bitIdx;
                    const color = getColorForBit(absoluteBitPos);
                    
                    byteElements.push(
                      <span
                        key={`bit-${absoluteBitPos}`}
                        className={color}
                      >
                        {byte[bitIdx]}
                      </span>
                    );
                  }
                  
                  elements.push(
                    <span key={`byte-${i}`} className="inline-block mr-1">
                      {byteElements}
                    </span>
                  );
                }
                
                return elements;
              })()}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              {Math.ceil(bitStream.length / 8)}{t('common.unit')} {t('common.bytes')}
              {/* 디버그 정보 */}
              <span className="ml-2 text-[9px]">
                ({t('common.data')}: {bitsUsed}{t('common.bits')}, {t('dataExtraction.terminator')}: {paddingInfo.terminatorBits}{t('common.bits')}, {t('dataExtraction.alignment')}: {paddingInfo.byteBoundaryPaddingBits}{t('common.bits')})
              </span>
            </div>
            {/* 색상 범례 */}
            <div className="flex flex-wrap gap-2 text-[10px] mt-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-200 rounded mr-1" />
                <span>{t('dataExtraction.modeIndicator')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-200 rounded mr-1" />
                <span>{t('dataExtraction.characterCount')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-200 rounded mr-1" />
                <span>{t('common.data')}</span>
              </div>
              {paddingInfo.terminatorBits > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-200 rounded mr-1" />
                  <span>{t('dataExtraction.terminatorPattern')} ({paddingInfo.terminatorBits}{t('common.bits')})</span>
                </div>
              )}
              {paddingInfo.byteBoundaryPaddingBits > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-200 rounded mr-1" />
                  <span>{t('dataExtraction.byteAlignment')} ({paddingInfo.byteBoundaryPaddingBits}{t('common.bits')})</span>
                </div>
              )}
              {paddingInfo.paddingBytes > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-200 rounded mr-1" />
                  <span>{t('dataExtraction.paddingBytes')} ({paddingInfo.paddingBytes}{t('common.bytes')})</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 전체 요약 */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">{t('dataExtraction.totalBits')}:</span>
              <span className="font-mono">{bitStream.length} {t('common.bits')} ({Math.ceil(bitStream.length / 8)} {t('common.bytes')})</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">{t('dataExtraction.dataBits')}:</span>
              <span className="font-mono">{bitsUsed} {t('common.bits')} ({(bitsUsed / bitStream.length * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">{t('dataExtraction.paddingBits')}:</span>
              <span className="font-mono">{bitStream.length - bitsUsed} {t('common.bits')}</span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium mb-1">{t('dataExtraction.process')}</div>
          <div className="space-y-0.5 text-gray-700">
            <div>• {t('dataExtraction.processStep1')}</div>
            <div>• {t('dataExtraction.processStep2')}</div>
            <div>• {t('dataExtraction.processStep3')}</div>
            <div>• {t('dataExtraction.processStep4')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}