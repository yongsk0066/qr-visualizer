import type { ErrorCorrectionData } from '../../shared/types';
import { t } from '@/config/language';

interface ErrorCorrectionColumnProps {
  errorCorrection: ErrorCorrectionData | null;
}

export function ErrorCorrectionColumn({ errorCorrection }: ErrorCorrectionColumnProps) {
  if (!errorCorrection) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">{t('3단계: 에러 정정', 'Step 3: Error Correction')}</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('Reed-Solomon 알고리즘으로 에러 정정 코드를 생성합니다', 'Generate error correction codes using Reed-Solomon algorithm')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🛡️</div>
            <div className="text-gray-500 text-sm">{t('데이터를 입력하면 에러 정정이 표시됩니다', 'Error correction will be displayed when data is entered')}</div>
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
          title={isDataCodeword ? t('데이터 코드워드', 'Data Codeword') : t('에러 정정 코드워드', 'Error Correction Codeword')}
        >
          {hexValue}
        </span>
      );
    });
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('3단계: 에러 정정', 'Step 3: Error Correction')}</h2>

      <div className="space-y-4">
        {/* 데이터 코드워드 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('데이터 코드워드', 'Data Codewords')}</h3>
          <div className="text-xs text-gray-600 mb-1">
            {t('총', 'Total')} {errorCorrection.dataCodewords.length}{t('개', ' codewords')}
          </div>
          <pre className="font-mono text-xs border border-gray-200 p-2 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
            {formatCodewords(errorCorrection.dataCodewords)}
          </pre>
        </div>

        {/* 블록별 에러 정정 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('블록별 에러 정정', 'Error Correction by Block')}</h3>
          {errorCorrection.dataBlocks.map((dataBlock: number[], index: number) => (
            <div key={index} className="space-y-1">
              <div className="text-xs font-medium text-gray-700">{t('블록', 'Block')} {index + 1}</div>
              <div className="pl-2 space-y-1">
                <div className="text-xs text-gray-600">{t('데이터', 'Data')}: {dataBlock.length}{t('개', ' codewords')}</div>
                <pre className="font-mono text-[10px] border border-gray-100 p-1 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
                  {formatCodewords(dataBlock)}
                </pre>
                <div className="text-xs text-gray-600">
                  {t('에러 정정', 'Error Correction')}: {errorCorrection.ecBlocks[index].length}{t('개', ' codewords')}
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
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('구성 요소', 'Components')}</h3>
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center">
              <span className="bg-green-200 px-2 py-0.5 rounded text-xs font-medium">
                {t('데이터 코드워드', 'Data Codewords')}
              </span>
              <span className="ml-1 text-gray-600">{errorCorrection.dataCodewords.length}{t('개', ' codewords')}</span>
            </div>
            <span className="text-gray-400 font-medium">+</span>
            <div className="flex items-center">
              <span className="bg-red-200 px-2 py-0.5 rounded text-xs font-medium">
                {t('에러 정정 코드워드', 'Error Correction Codewords')}
              </span>
              <span className="ml-1 text-gray-600">{errorCorrection.ecCodewords.length}{t('개', ' codewords')}</span>
            </div>
            {errorCorrection.remainderBits > 0 && (
              <>
                <span className="text-gray-400 font-medium">+</span>
                <div className="flex items-center">
                  <span className="bg-orange-200 px-2 py-0.5 rounded text-xs font-medium">
                    {t('잔여 비트', 'Remainder Bits')}
                  </span>
                  <span className="ml-1 text-gray-600">{errorCorrection.remainderBits}bit</span>
                </div>
              </>
            )}
            <span className="text-gray-400 font-medium">=</span>
            <span className="bg-blue-100 px-2 py-0.5 rounded text-xs font-medium">
              {t('최종', 'Total')} {errorCorrection.totalCodewords}{t('개', ' codewords')}
            </span>
          </div>
        </div>

        {/* 인터리빙된 최종 결과 */}
        <div className="pt-3 border-t border-gray-300">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('인터리빙된 최종 코드워드', 'Final Interleaved Codewords')}</h3>
          <div className="text-xs text-gray-600 mb-1">
            {t('총', 'Total')} {errorCorrection.totalCodewords}{t('개 (데이터 + 에러 정정)', ' codewords (Data + Error Correction)')}
          </div>
          <div className="font-mono text-xs border border-gray-300 p-2 leading-tight overflow-x-auto bg-blue-50 rounded flex flex-wrap gap-1">
            {renderColoredInterleavedCodewords()}
          </div>
        </div>
      </div>
    </div>
  );
}
