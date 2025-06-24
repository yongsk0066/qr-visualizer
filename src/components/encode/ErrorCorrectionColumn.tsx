import type { ErrorCorrectionData } from '../../shared/types';
import { t } from '../../i18n';

interface ErrorCorrectionColumnProps {
  errorCorrection: ErrorCorrectionData | null;
}

export function ErrorCorrectionColumn({ errorCorrection }: ErrorCorrectionColumnProps) {
  if (!errorCorrection) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">{t('steps.encode.errorCorrection')}</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('errorCorrection.generatingCodewords')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🛡️</div>
            <div className="text-gray-500 text-sm">{t('errorCorrection.waitingForData')}</div>
          </div>
        </div>
      </div>
    );
  }

  const formatCodewords = (codewords: number[]): string => {
    return codewords.map((cw) => cw.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  };

  const renderColoredInterleavedCodewords = () => {
    const interleavedDataLength = errorCorrection.dataBlocks.reduce(
      (sum: number, block: number[]) => sum + block.length,
      0
    );

    return errorCorrection.interleavedCodewords.map((codeword: number, index: number) => {
      const isDataCodeword = index < interleavedDataLength;
      const hexValue = codeword.toString(16).toUpperCase().padStart(2, '0');

      return (
        <span
          key={index}
          className={`${isDataCodeword ? 'bg-green-200' : 'bg-red-200'} px-0.5 rounded`}
          title={isDataCodeword ? t('errorCorrection.dataCodewords') : t('errorCorrection.ecCodewords')}
        >
          {hexValue}
        </span>
      );
    });
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('steps.encode.errorCorrection')}</h2>

      <div className="space-y-4">
        {/* 데이터 코드워드 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('errorCorrection.dataCodewords')}</h3>
          <div className="text-xs text-gray-600 mb-1">
            {t('common.total')} {errorCorrection.dataCodewords.length}{t('ui.count')}
          </div>
          <pre className="font-mono text-xs border border-gray-200 p-2 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
            {formatCodewords(errorCorrection.dataCodewords)}
          </pre>
        </div>

        {/* 블록별 에러 정정 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('errorCorrection.ecBlocks')}</h3>
          {errorCorrection.dataBlocks.map((dataBlock: number[], index: number) => (
            <div key={index} className="space-y-1">
              <div className="text-xs font-medium text-gray-700">{t('errorCorrection.block')} {index + 1}</div>
              <div className="pl-2 space-y-1">
                <div className="text-xs text-gray-600">{t('errorCorrection.data')}: {dataBlock.length}{t('ui.count')}</div>
                <pre className="font-mono text-[10px] border border-gray-100 p-1 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
                  {formatCodewords(dataBlock)}
                </pre>
                <div className="text-xs text-gray-600">
                  {t('errorCorrection.ecCodewords')}: {errorCorrection.ecBlocks[index].length}{t('ui.count')}
                </div>
                <pre className="font-mono text-[10px] border border-gray-100 p-1 whitespace-pre-wrap leading-tight overflow-x-auto bg-red-50 rounded">
                  {formatCodewords(errorCorrection.ecBlocks[index])}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* 구성 요소 표시 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('errorCorrection.components')}</h3>
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center">
              <span className="bg-green-200 px-2 py-0.5 rounded text-xs font-medium">
                {t('errorCorrection.dataCodewords')}
              </span>
              <span className="ml-1 text-gray-600">{errorCorrection.dataCodewords.length}{t('ui.count')}</span>
            </div>
            <span className="text-gray-400 font-medium">+</span>
            <div className="flex items-center">
              <span className="bg-red-200 px-2 py-0.5 rounded text-xs font-medium">
                {t('errorCorrection.ecCodewords')}
              </span>
              <span className="ml-1 text-gray-600">{errorCorrection.ecCodewords.length}{t('ui.count')}</span>
            </div>
            {errorCorrection.remainderBits > 0 && (
              <>
                <span className="text-gray-400 font-medium">+</span>
                <div className="flex items-center">
                  <span className="bg-orange-200 px-2 py-0.5 rounded text-xs font-medium">
                    {t('errorCorrection.remainderBits')}
                  </span>
                  <span className="ml-1 text-gray-600">{errorCorrection.remainderBits}{t('common.bit')}</span>
                </div>
              </>
            )}
            <span className="text-gray-400 font-medium">=</span>
            <span className="bg-blue-100 px-2 py-0.5 rounded text-xs font-medium">
              {t('common.total')} {errorCorrection.totalCodewords}{t('ui.count')}
            </span>
          </div>
        </div>

        {/* 인터리빙된 최종 결과 */}
        <div className="pt-3 border-t border-gray-300">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('errorCorrection.interleavedCodewords')}</h3>
          <div className="text-xs text-gray-600 mb-1">
            {t('common.total')} {errorCorrection.totalCodewords}{t('ui.count')} ({t('errorCorrection.data')} + {t('errorCorrection.ecCodewords')})
          </div>
          <div className="font-mono text-xs border border-gray-300 p-2 leading-tight overflow-x-auto bg-blue-50 rounded flex flex-wrap gap-1">
            {renderColoredInterleavedCodewords()}
          </div>
        </div>
      </div>
    </div>
  );
}
