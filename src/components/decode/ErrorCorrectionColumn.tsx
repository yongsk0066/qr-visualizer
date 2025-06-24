import type { ErrorCorrectionResult } from '../../qr-decode/decode/error-correction/types';
import { t } from '../../i18n';

interface ErrorCorrectionColumnProps {
  errorCorrectionResult: ErrorCorrectionResult | null;
  codewords?: number[] | null;
}

export function ErrorCorrectionColumn({
  errorCorrectionResult,
  codewords,
}: ErrorCorrectionColumnProps) {
  if (!errorCorrectionResult || !codewords) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">{t('steps.decode.errorCorrection')}</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reed-Solomon 에러 정정 알고리즘으로 손상된 데이터를 복구합니다
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔧</div>
            <div className="text-gray-500 text-sm">QR 코드를 감지하면 에러 정정이 표시됩니다</div>
          </div>
        </div>
      </div>
    );
  }

  const {
    correctedDataCodewords,
    blockResults,
    totalErrors,
    isRecoverable,
    confidence,
    syndromes,
  } = errorCorrectionResult;

  // 16진수 변환 함수
  const toHex = (value: number): string => {
    return value.toString(16).toUpperCase().padStart(2, '0');
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.decode.errorCorrection')}</h2>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Reed-Solomon 에러 정정 알고리즘으로 손상된 데이터를 복구합니다
        </p>

        {!errorCorrectionResult || !codewords ? (
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔧</div>
            <div className="text-gray-500 text-sm">QR 코드를 감지하면 에러 정정이 시작됩니다</div>
          </div>
        ) : (
          <>
            {/* 전체 결과 요약 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">정정 결과</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">정정 가능:</span>
              <span
                className={`font-semibold ${isRecoverable ? 'text-green-600' : 'text-red-600'}`}
              >
                {isRecoverable ? '✓ 성공' : '✗ 실패'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">총 에러 수:</span>
              <span className="font-mono">{totalErrors}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">성공 블록:</span>
              <span className="font-mono">
                {blockResults.filter((r) => r.isCorrected).length} / {blockResults.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">신뢰도:</span>
              <span className="font-mono font-semibold">{(confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">블록 수:</span>
              <span className="font-mono">{blockResults.length}개</span>
            </div>
          </div>
        </div>

        {/* 실패한 경우 전체 실패 이유 요약 */}
        {!isRecoverable && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-xs font-medium text-red-700 mb-2">❌ 정정 실패 원인 분석</div>
            <div className="space-y-2 text-xs text-red-600">
              {blockResults
                .filter((r) => !r.isCorrected && r.failureReason)
                .map((r, idx) => (
                  <div key={idx}>
                    <span className="font-semibold">블록 {r.blockIndex + 1}:</span>{' '}
                    {r.failureReason}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 신뢰도 시각화 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">정정 신뢰도</div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${confidence * 100}%`,
                backgroundColor:
                  confidence >= 1 ? '#22c55e' : confidence >= 0.8 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <div className="text-[10px] text-gray-500">
            {blockResults.filter((r) => r.isCorrected).length} / {blockResults.length} 블록 정정
            성공
          </div>
        </div>

        {/* 블록별 신드롬 표시 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">블록별 신드롬</div>
          <div className="space-y-2">
            {syndromes.map((blockSyndromes, blockIndex) => (
              <div key={blockIndex} className="text-xs">
                <div className="font-medium text-gray-700 mb-1">블록 {blockIndex + 1}</div>
                <div className="flex flex-wrap gap-0.5 font-mono text-[10px]">
                  {blockSyndromes.map((syndrome, index) => (
                    <span
                      key={index}
                      className={`px-1 rounded ${
                        syndrome === 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                      }`}
                      title={`S${index}: ${syndrome}`}
                    >
                      {toHex(syndrome)}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {blockSyndromes.every((s) => s === 0)
                    ? '에러 없음'
                    : `${blockSyndromes.filter((s) => s !== 0).length}개 신드롬 활성`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 블록별 에러 요약 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">블록별 에러 분포</div>
          <div className="space-y-1 text-xs">
            {blockResults.map((result, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-600">블록 {index + 1}:</span>
                <span
                  className={`font-mono ${
                    result.errorPositions.length > (result.maxCorrectableErrors || 0)
                      ? 'text-red-600 font-semibold'
                      : result.errorPositions.length > 0
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}
                >
                  {result.errorPositions.length}개 에러
                  {result.maxCorrectableErrors !== undefined &&
                    ` (최대 ${result.maxCorrectableErrors}개)`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 블록별 정정 결과 */}
        <div className="space-y-3">
          <div className="text-xs font-medium">블록별 정정 상세</div>
          {blockResults.map((result, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-xs">블록 {index + 1}</div>
                <div
                  className={`text-xs px-2 py-0.5 rounded ${
                    result.isCorrected ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                  }`}
                >
                  {result.isCorrected ? '정정 성공' : '정정 실패'}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {result.hasNoError ? (
                  <div className="text-green-600 font-medium">에러 없음</div>
                ) : (
                  <>
                    {/* 실패 이유 표시 */}
                    {result.failureReason && (
                      <div className="p-2 bg-red-100 rounded border border-red-200">
                        <div className="font-medium text-red-700 mb-1">실패 이유:</div>
                        <div className="text-red-600">{result.failureReason}</div>
                      </div>
                    )}

                    {/* 에러 정정 능력 정보 */}
                    {result.maxCorrectableErrors !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">에러 정정 능력:</span>
                        <span
                          className={`font-mono ${
                            result.detectedErrors &&
                            result.detectedErrors > result.maxCorrectableErrors
                              ? 'text-red-600 font-semibold'
                              : ''
                          }`}
                        >
                          {result.detectedErrors || 0} / {result.maxCorrectableErrors}개
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">검출된 에러 개수:</span>
                        <span className="font-mono font-semibold">
                          {result.errorPositions.length}개
                        </span>
                      </div>
                      {result.errorPositions.length > 0 && (
                        <div>
                          <div className="text-gray-600 mb-1">에러 위치 (배열 인덱스):</div>
                          <div className="font-mono text-[10px] flex flex-wrap gap-1">
                            {result.errorPositions.map((rsPos, idx) => {
                              // Reed-Solomon 위치를 배열 인덱스로 변환
                              const arrayIndex = result.originalCodewords.length - 1 - rsPos;
                              return (
                                <span
                                  key={idx}
                                  className="bg-yellow-200 px-1 rounded"
                                  title={`RS position: ${rsPos}`}
                                >
                                  {arrayIndex}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {result.errorMagnitudes.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-gray-600">에러 값:</div>
                        <div className="flex flex-wrap gap-0.5 font-mono text-[10px]">
                          {result.errorMagnitudes.map((magnitude, idx) => (
                            <span key={idx} className="bg-orange-200 px-1 rounded">
                              {toHex(magnitude)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">총 코드워드:</span>
                  <span className="font-mono">{result.originalCodewords.length}개</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 정정된 데이터 코드워드 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">정정된 데이터 코드워드</div>
          <div className="text-xs text-gray-600 mb-2">총 {correctedDataCodewords.length}개</div>
          <div className="font-mono text-[10px] flex flex-wrap gap-1">
            {correctedDataCodewords.map((codeword, index) => (
              <span
                key={index}
                className="bg-green-200 px-1 py-0.5 rounded"
                title={`데이터 코드워드 ${index + 1}: ${codeword}`}
              >
                {toHex(codeword)}
              </span>
            ))}
          </div>
        </div>

        {/* 구성 요소 범례 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">구성 요소</div>
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center">
              <span className="bg-green-200 px-2 py-0.5 rounded text-xs font-medium">신드롬 0</span>
              <span className="ml-1 text-gray-600">에러 없음</span>
            </div>
            <span className="text-gray-400 font-medium">+</span>
            <div className="flex items-center">
              <span className="bg-red-200 px-2 py-0.5 rounded text-xs font-medium">
                신드롬 활성
              </span>
              <span className="ml-1 text-gray-600">에러 검출</span>
            </div>
            <span className="text-gray-400 font-medium">=</span>
            <div className="flex items-center">
              <span className="bg-orange-200 px-2 py-0.5 rounded text-xs font-medium">
                에러 정정
              </span>
              <span className="ml-1 text-gray-600">복구된 데이터</span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium mb-1">Reed-Solomon 에러 정정</div>
          <div className="space-y-0.5 text-gray-700">
            <div>• 각 블록별로 신드롬 계산하여 에러 검출</div>
            <div>• Berlekamp-Massey 알고리즘으로 에러 위치 찾기</div>
            <div>• Forney 알고리즘으로 에러 값 계산 및 정정</div>
            <div>• 정정 후 검증을 통해 성공 여부 확인</div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
