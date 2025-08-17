import type { MessageConstructionResult } from '../../qr-encode/message-construction/messageConstruction';
import { formatBitString } from '../../qr-encode/message-construction/messageConstruction';
import { t } from '@/config/language';

interface MessageConstructionColumnProps {
  result: MessageConstructionResult | null;
}

export function MessageConstructionColumn({ result }: MessageConstructionColumnProps) {
  if (!result) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">{t('4단계: 최종 비트스트림', 'Step 4: Final Bit Stream')}</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('데이터와 에러 정정 코드를 결합하여 최종 비트스트림을 생성합니다', 'Combines data and error correction codes to generate the final bit stream')}
          </p>
          
          <div className="p-8 bg-gray-50 rounded text-center">
            <div className="text-gray-400 text-3xl mb-2">🔗</div>
            <div className="text-gray-500 text-sm">{t('에러 정정이 완료되면 최종 비트스트림이 표시됩니다', 'The final bit stream will be displayed when error correction is completed')}</div>
          </div>
        </div>
      </div>
    );
  }

  const renderColoredBitStream = () => {
    const bits = result.finalBitStream;
    const dataBits = result.dataBits;
    const ecBits = result.ecBits;
    
    return formatBitString(bits).split(' ').map((byte, index) => {
      const bitPosition = index * 8;
      const isData = bitPosition < dataBits;
      const isEC = bitPosition >= dataBits && bitPosition < dataBits + ecBits;
      const isRemainder = bitPosition >= dataBits + ecBits;

      return (
        <span
          key={index}
          className={
            isData ? 'text-green-600' :
            isEC ? 'text-red-600' :
            isRemainder ? 'text-orange-600' :
            ''
          }
        >
          {byte}
        </span>
      );
    }).reduce((acc, curr, index) => {
      if (index > 0) acc.push(<span key={`space-${index}`}> </span>);
      acc.push(curr);
      return acc;
    }, [] as React.ReactElement[]);
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('4단계: 최종 비트스트림', 'Step 4: Final Bit Stream')}</h2>

      <div className="space-y-4">
        {/* 비트스트림 정보 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('비트스트림 정보', 'Bit Stream Information')}</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('총 비트 수:', 'Total Bits:')}</span>
              <span className="font-mono">{result.totalBits}bit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('데이터 비트:', 'Data Bits:')}</span>
              <span className="font-mono text-green-600">{result.dataBits}bit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('에러 정정 비트:', 'Error Correction Bits:')}</span>
              <span className="font-mono text-red-600">{result.ecBits}bit</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('잔여 비트:', 'Remainder Bits:')}</span>
              <span className="font-mono text-orange-600">{result.remainderBits}bit</span>
            </div>
          </div>
        </div>

        {/* 최종 비트스트림 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('최종 비트스트림', 'Final Bit Stream')}</h3>
          <div className="font-mono text-xs border border-gray-200 p-2 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
            {renderColoredBitStream()}
          </div>
        </div>

        {/* 범례 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">{t('범례', 'Legend')}</h3>
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-600 rounded mr-1"></span>
              <span>{t('데이터 비트', 'Data Bits')}</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-600 rounded mr-1"></span>
              <span>{t('에러 정정 비트', 'Error Correction Bits')}</span>
            </div>
            {result.remainderBits > 0 && (
              <div className="flex items-center">
                <span className="w-3 h-3 bg-orange-600 rounded mr-1"></span>
                <span>{t('잔여 비트', 'Remainder Bits')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 다음 단계 안내 */}
        <div className="pt-3 border-t border-gray-300">
          <div className="text-xs text-gray-600">
            {t('다음: 모듈 배치 및 마스킹', 'Next: Module Placement and Masking')}
          </div>
        </div>
      </div>
    </div>
  );
}