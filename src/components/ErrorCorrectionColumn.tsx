import type { ErrorCorrectionData } from '../shared/types';

interface ErrorCorrectionColumnProps {
  errorCorrection: ErrorCorrectionData | null;
}

export function ErrorCorrectionColumn({ errorCorrection }: ErrorCorrectionColumnProps) {
  if (!errorCorrection) {
    return (
      <div className="step-column">
        <h2 className="font-medium mb-3">3단계: 에러 정정</h2>
        <div className="text-gray-500 text-sm">데이터를 입력하면 에러 정정이 표시됩니다</div>
      </div>
    );
  }

  const formatCodewords = (codewords: number[]): string => {
    return codewords.map(cw => cw.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">3단계: 에러 정정</h2>
      
      <div className="space-y-4">
        {/* 데이터 코드워드 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">데이터 코드워드</h3>
          <div className="text-xs text-gray-600 mb-1">
            총 {errorCorrection.dataCodewords.length}개
          </div>
          <pre className="font-mono text-xs border border-gray-200 p-2 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
            {formatCodewords(errorCorrection.dataCodewords)}
          </pre>
        </div>

        {/* 블록별 에러 정정 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">블록별 에러 정정</h3>
          {errorCorrection.dataBlocks.map((dataBlock, index) => (
            <div key={index} className="space-y-1">
              <div className="text-xs font-medium text-gray-700">
                블록 {index + 1}
              </div>
              <div className="pl-2 space-y-1">
                <div className="text-xs text-gray-600">
                  데이터: {dataBlock.length}개
                </div>
                <pre className="font-mono text-[10px] border border-gray-100 p-1 whitespace-pre-wrap leading-tight overflow-x-auto bg-gray-50 rounded">
                  {formatCodewords(dataBlock)}
                </pre>
                <div className="text-xs text-gray-600">
                  에러 정정: {errorCorrection.ecBlocks[index].length}개
                </div>
                <pre className="font-mono text-[10px] border border-gray-100 p-1 whitespace-pre-wrap leading-tight overflow-x-auto bg-red-50 rounded">
                  {formatCodewords(errorCorrection.ecBlocks[index])}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* 인터리빙된 최종 결과 */}
        <div className="pt-3 border-t border-gray-300">
          <h3 className="text-xs font-semibold text-gray-800 mb-2">인터리빙된 최종 코드워드</h3>
          <div className="text-xs text-gray-600 mb-1">
            총 {errorCorrection.totalCodewords}개 (데이터 + 에러 정정)
          </div>
          <pre className="font-mono text-xs border border-gray-300 p-2 whitespace-pre-wrap leading-tight overflow-x-auto bg-blue-50 rounded">
            {formatCodewords(errorCorrection.interleavedCodewords)}
          </pre>
        </div>
      </div>
    </div>
  );
}