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
            {t('errorCorrectionDecode.performingCorrection')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔧</div>
            <div className="text-gray-500 text-sm">{t('errorCorrectionDecode.willDisplayWhenDetected')}</div>
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
          {t('errorCorrectionDecode.performingCorrection')}
        </p>

        {!errorCorrectionResult || !codewords ? (
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔧</div>
            <div className="text-gray-500 text-sm">{t('errorCorrectionDecode.willStartWhenDetected')}</div>
          </div>
        ) : (
          <>
            {/* 전체 결과 요약 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('errorCorrectionDecode.correctionResult')}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('errorCorrectionDecode.correctable')}</span>
              <span
                className={`font-semibold ${isRecoverable ? 'text-green-600' : 'text-red-600'}`}
              >
                {isRecoverable ? t('errorCorrectionDecode.success') : t('errorCorrectionDecode.failure')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('errorCorrectionDecode.totalErrors')}</span>
              <span className="font-mono">{totalErrors}{t('errorCorrectionDecode.count')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('errorCorrectionDecode.successBlocks')}</span>
              <span className="font-mono">
                {blockResults.filter((r) => r.isCorrected).length} / {blockResults.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('errorCorrectionDecode.confidence')}</span>
              <span className="font-mono font-semibold">{(confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('common.blocks')} {t('common.count')}:</span>
              <span className="font-mono">{blockResults.length}{t('errorCorrectionDecode.blockCount')}</span>
            </div>
          </div>
        </div>

        {/* 실패한 경우 전체 실패 이유 요약 */}
        {!isRecoverable && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-xs font-medium text-red-700 mb-2">{t('errorCorrectionDecode.failureAnalysis')}</div>
            <div className="space-y-2 text-xs text-red-600">
              {blockResults
                .filter((r) => !r.isCorrected && r.failureReason)
                .map((r, idx) => (
                  <div key={idx}>
                    <span className="font-semibold">{t('errorCorrectionDecode.block')} {r.blockIndex + 1}:</span>{' '}
                    {r.failureReason}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 신뢰도 시각화 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('errorCorrectionDecode.correctionConfidence')}</div>
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
            {t('errorCorrectionDecode.blockCorrectionSuccess').replace('{success}', blockResults.filter((r) => r.isCorrected).length.toString()).replace('{total}', blockResults.length.toString())}
          </div>
        </div>

        {/* 블록별 신드롬 표시 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('errorCorrectionDecode.syndromeByBlock')}</div>
          <div className="space-y-2">
            {syndromes.map((blockSyndromes, blockIndex) => (
              <div key={blockIndex} className="text-xs">
                <div className="font-medium text-gray-700 mb-1">{t('errorCorrectionDecode.block')} {blockIndex + 1}</div>
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
                    ? t('errorCorrectionDecode.noErrors')
                    : `${blockSyndromes.filter((s) => s !== 0).length}${t('errorCorrectionDecode.activeSyndromes')}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 블록별 에러 요약 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('errorCorrectionDecode.errorDistribution')}</div>
          <div className="space-y-1 text-xs">
            {blockResults.map((result, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-600">{t('errorCorrectionDecode.block')} {index + 1}:</span>
                <span
                  className={`font-mono ${
                    result.errorPositions.length > (result.maxCorrectableErrors || 0)
                      ? 'text-red-600 font-semibold'
                      : result.errorPositions.length > 0
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}
                >
                  {result.errorPositions.length}{t('errorCorrectionDecode.errors')}
                  {result.maxCorrectableErrors !== undefined &&
                    t('errorCorrectionDecode.maxCorrectableErrors').replace('{max}', result.maxCorrectableErrors.toString())}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 블록별 정정 결과 */}
        <div className="space-y-3">
          <div className="text-xs font-medium">{t('errorCorrectionDecode.blockCorrectionDetails')}</div>
          {blockResults.map((result, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-xs">{t('errorCorrectionDecode.block')} {index + 1}</div>
                <div
                  className={`text-xs px-2 py-0.5 rounded ${
                    result.isCorrected ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                  }`}
                >
                  {result.isCorrected ? t('errorCorrectionDecode.correctionSuccess2') : t('errorCorrectionDecode.correctionFailure')}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {result.hasNoError ? (
                  <div className="text-green-600 font-medium">{t('errorCorrectionDecode.noErrors')}</div>
                ) : (
                  <>
                    {/* 실패 이유 표시 */}
                    {result.failureReason && (
                      <div className="p-2 bg-red-100 rounded border border-red-200">
                        <div className="font-medium text-red-700 mb-1">{t('errorCorrectionDecode.failureReason')}</div>
                        <div className="text-red-600">{result.failureReason}</div>
                      </div>
                    )}

                    {/* 에러 정정 능력 정보 */}
                    {result.maxCorrectableErrors !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('errorCorrectionDecode.errorCorrectionCapability')}</span>
                        <span
                          className={`font-mono ${
                            result.detectedErrors &&
                            result.detectedErrors > result.maxCorrectableErrors
                              ? 'text-red-600 font-semibold'
                              : ''
                          }`}
                        >
                          {result.detectedErrors || 0} / {result.maxCorrectableErrors}{t('errorCorrectionDecode.count')}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('errorCorrectionDecode.detectedErrorCount')}</span>
                        <span className="font-mono font-semibold">
                          {result.errorPositions.length}{t('errorCorrectionDecode.count')}
                        </span>
                      </div>
                      {result.errorPositions.length > 0 && (
                        <div>
                          <div className="text-gray-600 mb-1">{t('errorCorrectionDecode.errorPositions')}</div>
                          <div className="font-mono text-[10px] flex flex-wrap gap-1">
                            {result.errorPositions.map((rsPos, idx) => {
                              // Reed-Solomon 위치를 배열 인덱스로 변환
                              const arrayIndex = result.originalCodewords.length - 1 - rsPos;
                              return (
                                <span
                                  key={idx}
                                  className="bg-yellow-200 px-1 rounded"
                                  title={`${t('errorCorrectionDecode.rsPosition')} ${rsPos}`}
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
                        <div className="text-gray-600">{t('errorCorrectionDecode.errorValues')}</div>
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
                  <span className="text-gray-600">{t('errorCorrectionDecode.totalCodewords')}</span>
                  <span className="font-mono">{result.originalCodewords.length}{t('errorCorrectionDecode.count')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 정정된 데이터 코드워드 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('errorCorrectionDecode.correctedDataCodewords')}</div>
          <div className="text-xs text-gray-600 mb-2">{t('errorCorrectionDecode.total').replace('{count}', correctedDataCodewords.length.toString())}</div>
          <div className="font-mono text-[10px] flex flex-wrap gap-1">
            {correctedDataCodewords.map((codeword, index) => (
              <span
                key={index}
                className="bg-green-200 px-1 py-0.5 rounded"
                title={`${t('errorCorrectionDecode.dataCodewords')} ${index + 1}: ${codeword}`}
              >
                {toHex(codeword)}
              </span>
            ))}
          </div>
        </div>

        {/* 구성 요소 범례 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('errorCorrectionDecode.components')}</div>
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center">
              <span className="bg-green-200 px-2 py-0.5 rounded text-xs font-medium">{t('errorCorrectionDecode.syndrome0')}</span>
              <span className="ml-1 text-gray-600">{t('errorCorrectionDecode.noError')}</span>
            </div>
            <span className="text-gray-400 font-medium">+</span>
            <div className="flex items-center">
              <span className="bg-red-200 px-2 py-0.5 rounded text-xs font-medium">
                {t('errorCorrectionDecode.syndromeActive2')}
              </span>
              <span className="ml-1 text-gray-600">{t('errorCorrectionDecode.errorDetected')}</span>
            </div>
            <span className="text-gray-400 font-medium">=</span>
            <div className="flex items-center">
              <span className="bg-orange-200 px-2 py-0.5 rounded text-xs font-medium">
                {t('errorCorrectionDecode.errorCorrection')}
              </span>
              <span className="ml-1 text-gray-600">{t('errorCorrectionDecode.recoveredData')}</span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium mb-1">{t('errorCorrectionDecode.reedSolomon')}</div>
          <div className="space-y-0.5 text-gray-700">
            <div>{t('errorCorrectionDecode.processSteps.step1')}</div>
            <div>{t('errorCorrectionDecode.processSteps.step2')}</div>
            <div>{t('errorCorrectionDecode.processSteps.step3')}</div>
            <div>{t('errorCorrectionDecode.processSteps.step4')}</div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
