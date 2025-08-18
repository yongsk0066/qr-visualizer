import type { ReactNode } from 'react';
import { t } from '../../config/language';
import type { DataExtractionResult } from '../../qr-decode/decode/data-extraction/types';

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
        <h2 className="font-medium mb-3">{t('6단계: 데이터 추출', 'Step 6: Data Extraction')}</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('에러 정정된 코드워드에서 원본 데이터를 추출합니다', 'Extract original data from error-corrected codewords')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">📤</div>
            <div className="text-gray-500 text-sm">{t('QR 코드를 감지하면 데이터 추출이 시작됩니다', 'Data extraction will start when QR code is detected')}</div>
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
      case 0b0001: return t('숫자', 'Numeric');
      case 0b0010: return t('영숫자', 'Alphanumeric');
      case 0b0100: return t('바이트', 'Byte');
      case 0b1000: return t('한자', 'Kanji');
      case 0b0111: return 'ECI';
      case 0b0000: return t('종료', 'Terminator');
      default: return t('알 수 없음', 'Unknown');
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
      <h2 className="font-medium mb-3">{t('6단계: 데이터 추출', 'Step 6: Data Extraction')}</h2>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('에러 정정된 코드워드에서 원본 데이터를 추출합니다', 'Extract original data from error-corrected codewords')}
        </p>

        {/* 에러 정정 실패 경고 */}
        {errorCorrectionFailed && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="text-xs font-medium text-orange-700 mb-1">{t('⚠️ 주의', '⚠️ Warning')}</div>
            <div className="text-xs text-orange-600">
              {t('에러 정정이 완전히 성공하지 못했습니다. 일부 데이터가 손상되어 있을 수 있습니다.', 'Error correction was not completely successful. Some data may be damaged.')}
            </div>
          </div>
        )}

        {/* 추출 결과 요약 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('추출 결과', 'Extraction Result')}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('추출 상태:', 'Extraction status:')}</span>
              <span
                className={`font-semibold ${isValid ? 'text-green-600' : 'text-red-600'}`}
              >
                {isValid ? t('✓ 성공', '✓ Success') : t('✗ 실패', '✗ Failed')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('세그먼트 수:', 'Segments:')}</span>
              <span className="font-mono">{segments.length}{t('개', '')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('사용 비트:', 'Used bits:')}</span>
              <span className="font-mono">{bitsUsed} / {totalBits} bits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('신뢰도:', 'Confidence:')}</span>
              <span className="font-mono font-semibold">{(confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-xs font-medium text-red-700 mb-1">{t('❌ 추출 실패', '❌ Extraction Failed')}</div>
            <div className="text-xs text-red-600">{errorMessage}</div>
          </div>
        )}

        {/* 최종 추출 데이터 */}
        <div className="p-3 bg-green-50 rounded">
          <div className="text-xs font-medium mb-2">{t('추출된 데이터', 'Extracted Data')}</div>
          <div className="font-mono text-sm bg-white p-2 rounded border border-green-200 break-all">
            {decodedText || t('(데이터 없음)', '(No data)')}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {t('길이:', 'Length:')} {decodedText.length}{t('자', ' characters')}
          </div>
        </div>

        {/* 비트 스트림 구조 시각화 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('비트 스트림 구조', 'Bit Stream Structure')}</div>
          
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
                    title={t('패딩', 'Padding')}
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
                  <span>{t('패딩', 'Padding')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 세그먼트 상세 정보 */}
        <div className="space-y-3">
          <div className="text-xs font-medium">{t('세그먼트 상세', 'Segment Details')}</div>
          {segments.map((segment, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-xs">
                  {t('세그먼트', 'Segment')} {index + 1}: {getModeName(segment.mode)}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded ${getSegmentColor(index)}`}>
                  {segment.characterCount}{t('자', ' chars')}
                </div>
              </div>
              
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-gray-600">{t('모드 지시자:', 'Mode indicator:')}</span>
                  <span className="font-mono ml-1">{segment.modeIndicatorBits}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('문자 개수:', 'Character count:')}</span>
                  <span className="font-mono ml-1">{segment.characterCountBits}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('데이터 비트:', 'Data bits:')}</span>
                  <span className="font-mono ml-1 text-[10px]">
                    {segment.dataBits.length > 32 
                      ? segment.dataBits.slice(0, 32) + '...' 
                      : segment.dataBits}
                  </span>
                  <span className="text-gray-500 ml-1">({segment.dataBits.length} bits)</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('추출 데이터:', 'Extracted data:')}</span>
                  <span className="font-mono ml-1 break-all">{segment.data}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('비트 범위:', 'Bit range:')}</span>
                  <span className="font-mono ml-1">{segment.startBit}-{segment.endBit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 패딩 정보 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('패딩 분석', 'Padding Analysis')}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('종료 패턴:', 'Terminator pattern:')}</span>
              <span className="font-mono">
                {paddingInfo.terminatorPosition !== undefined
                  ? `${t('위치', 'Position')} ${paddingInfo.terminatorPosition}, ${paddingInfo.terminatorBits} bits`
                  : t('없음', 'None')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('바이트 경계 패딩:', 'Byte boundary padding:')}</span>
              <span className="font-mono">{paddingInfo.byteBoundaryPaddingBits} bits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('패딩 바이트:', 'Padding bytes:')}</span>
              <span className="font-mono">{paddingInfo.paddingBytes}{t('개', '')}</span>
            </div>
            {paddingInfo.paddingPattern.length > 0 && (
              <div>
                <span className="text-gray-600">{t('패딩 패턴:', 'Padding pattern:')}</span>
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
          <div className="text-xs font-medium mb-2">{t('전체 비트 스트림 상세', 'Complete Bit Stream Details')}</div>
          
          {/* 세그먼트별 비트 스트림 */}
          <div className="space-y-2">
            {segments.map((segment, segIndex) => (
              <div key={segIndex} className="space-y-1">
                <div className="text-[10px] font-medium text-gray-700">
                  {t('세그먼트', 'Segment')} {segIndex + 1}: {getModeName(segment.mode)}
                </div>
                
                {/* 모드 지시자 */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-gray-600 w-20">{t('모드 지시자:', 'Mode indicator:')}</span>
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
                    <span className="text-[10px] text-gray-600 w-20">{t('문자 개수:', 'Character count:')}</span>
                    <div className="flex-1">
                      <span className={`font-mono text-[10px] px-1 py-0.5 rounded ${getSegmentColor(segIndex)}`}>
                        {segment.characterCountBits}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">
                        ({segment.characterCount}{t('자', ' chars')})
                      </span>
                    </div>
                  </div>
                )}
                
                {/* 데이터 비트 */}
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-gray-600 w-20">{t('데이터:', 'Data:')}</span>
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
                <div className="text-[10px] font-medium text-gray-700">{t('패딩', 'Padding')}</div>
                
                {/* 종료 패턴 */}
                {paddingInfo.terminatorBits > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-gray-600 w-20">{t('종료 패턴:', 'Terminator:')}</span>
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
                    <span className="text-[10px] text-gray-600 w-20">{t('바이트 정렬:', 'Byte align:')}</span>
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
                    <span className="text-[10px] text-gray-600 w-20">{t('패딩 바이트:', 'Padding bytes:')}</span>
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
            <div className="text-[10px] font-medium text-gray-700 mb-2">{t('최종 비트스트림', 'Final Bit Stream')}</div>
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
              {Math.ceil(bitStream.length / 8)}{t('개 바이트', ' bytes')}
              {/* 디버그 정보 */}
              <span className="ml-2 text-[9px]">
                ({t('데이터:', 'Data:')} {bitsUsed}{t('비트,', ' bits,')} {t('종료:', ' Term:')} {paddingInfo.terminatorBits}{t('비트,', ' bits,')} {t('정렬:', ' Align:')} {paddingInfo.byteBoundaryPaddingBits}{t('비트', ' bits')})
              </span>
            </div>
            {/* 색상 범례 */}
            <div className="flex flex-wrap gap-2 text-[10px] mt-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-200 rounded mr-1" />
                <span>{t('모드 지시자', 'Mode Indicator')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-200 rounded mr-1" />
                <span>{t('문자 개수', 'Character Count')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-200 rounded mr-1" />
                <span>{t('데이터', 'Data')}</span>
              </div>
              {paddingInfo.terminatorBits > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-200 rounded mr-1" />
                  <span>{t('종료 패턴', 'Terminator Pattern')} ({paddingInfo.terminatorBits}{t('비트', ' bits')})</span>
                </div>
              )}
              {paddingInfo.byteBoundaryPaddingBits > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-200 rounded mr-1" />
                  <span>{t('바이트 정렬', 'Byte Alignment')} ({paddingInfo.byteBoundaryPaddingBits}{t('비트', ' bits')})</span>
                </div>
              )}
              {paddingInfo.paddingBytes > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-200 rounded mr-1" />
                  <span>{t('패딩 바이트', 'Padding Bytes')} ({paddingInfo.paddingBytes}{t('바이트', ' bytes')})</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 전체 요약 */}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">{t('총 비트 수:', 'Total bits:')}</span>
              <span className="font-mono">{bitStream.length} bits ({Math.ceil(bitStream.length / 8)} bytes)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">{t('데이터 비트:', 'Data bits:')}</span>
              <span className="font-mono">{bitsUsed} bits ({(bitsUsed / bitStream.length * 100).toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-600">{t('패딩 비트:', 'Padding bits:')}</span>
              <span className="font-mono">{bitStream.length - bitsUsed} bits</span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium mb-1">{t('데이터 추출 과정', 'Data Extraction Process')}</div>
          <div className="space-y-0.5 text-gray-700">
            <div>{t('• 모드 지시자(4비트)로 인코딩 방식 확인', '• Identify encoding method with mode indicator (4 bits)')}</div>
            <div>{t('• 문자 개수 지시자로 데이터 길이 파악', '• Determine data length with character count indicator')}</div>
            <div>{t('• 각 모드별 디코딩 규칙 적용', '• Apply decoding rules for each mode')}</div>
            <div>{t('• 종료 패턴 및 패딩 처리', '• Process terminator pattern and padding')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}