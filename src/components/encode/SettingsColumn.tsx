import type { ErrorCorrectionLevel, DataAnalysisResult } from '../shared/types';

interface SettingsColumnProps {
  inputData: string;
  setInputData: (data: string) => void;
  qrVersion: string;
  setQrVersion: (version: string) => void;
  errorLevel: ErrorCorrectionLevel;
  setErrorLevel: (level: ErrorCorrectionLevel) => void;
  dataAnalysis: DataAnalysisResult | null;
  isProcessing?: boolean;
}

export function SettingsColumn({
  inputData,
  setInputData,
  qrVersion,
  setQrVersion,
  errorLevel,
  setErrorLevel,
  dataAnalysis,
  isProcessing = false,
}: SettingsColumnProps) {
  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">1단계: 설정</h2>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="qr-input" className="block text-sm">
              데이터 입력
            </label>
            {isProcessing && (
              <span className="text-xs text-blue-600 animate-pulse">처리 중...</span>
            )}
          </div>
          <textarea
            id="qr-input"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="QR 코드로 만들 데이터를 입력하세요..."
            className="w-full min-h-[60px] p-2 border border-gray-200 text-sm resize-none focus:outline-none focus:border-black"
            autoFocus
          />
        </div>

        <div className="text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>문자 수</span>
            <span>{inputData.length}</span>
          </div>
          <div className="flex justify-between">
            <span>권장 모드</span>
            <span className="font-mono">{dataAnalysis?.recommendedMode || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span>최소 버전</span>
            <span>{dataAnalysis?.minimumVersion || '-'}</span>
          </div>
          {dataAnalysis && !dataAnalysis.isValid && (
            <div className="text-red-600 mt-1">용량 초과</div>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <label htmlFor="qr-version" className="block mb-1 text-xs">
              QR 버전
            </label>
            <select
              id="qr-version"
              value={qrVersion}
              onChange={(e) => setQrVersion(e.target.value)}
              className="w-full p-1.5 border border-gray-200 text-xs focus:outline-none focus:border-black"
            >
              {[...Array(40)].map((_, i) => {
                const version = i + 1;
                const modules = 4 * version + 17;
                return (
                  <option key={version} value={version}>
                    {version} ({modules}×{modules})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="error-level" className="block mb-1 text-xs">
              에러 정정 레벨
            </label>
            <select
              id="error-level"
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as ErrorCorrectionLevel)}
              className="w-full p-1.5 border border-gray-200 text-xs focus:outline-none focus:border-black"
            >
              <option value="L">L (Low)</option>
              <option value="M">M (Medium)</option>
              <option value="Q">Q (Quartile)</option>
              <option value="H">H (High)</option>
            </select>
          </div>
        </div>

        {/* 샘플 데이터 */}
        <div>
          <h3 className="text-xs font-medium text-gray-700 mb-2">샘플 데이터</h3>
          <div className="space-y-1">
            <button
              onClick={() => setInputData('123456789')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">숫자:</span> 123456789
            </button>
            <button
              onClick={() => setInputData('HELLO WORLD')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">영숫자:</span> HELLO WORLD
            </button>
            <button
              onClick={() => setInputData('https://example.com')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">바이트:</span> https://example.com
            </button>
            <button
              onClick={() => setInputData('안녕하세요 QR코드')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">한글:</span> 안녕하세요 QR코드
            </button>
            <button
              onClick={() => setInputData('Mixed123한글')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">혼합:</span> Mixed123한글
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
