import type { ErrorCorrectionLevel, DataAnalysisResult } from '../../shared/types';
import { t } from '../../lang';

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
      <h2 className="font-medium mb-3">{t('1단계: 설정', 'Step 1: Settings')}</h2>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="qr-input" className="block text-sm">
              {t('데이터 입력', 'Input data')}
            </label>
            {isProcessing && (
              <span className="text-xs text-blue-600 animate-pulse">{t('처리 중...', 'Processing...')}</span>
            )}
          </div>
          <textarea
            id="qr-input"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={t('QR 코드로 만들 데이터를 입력하세요...', 'Enter data to encode as QR code...')}
            className="w-full min-h-[150px] p-2 border border-gray-200 text-sm resize-none focus:outline-none focus:border-black"
            autoFocus
          />
        </div>

        <div className="text-xs space-y-0.5">
          <div className="flex justify-between">
            <span>{t('문자 수', 'Characters')}</span>
            <span>{inputData.length}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('권장 모드', 'Recommended mode')}</span>
            <span className="font-mono">{dataAnalysis?.recommendedMode || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('최소 버전', 'Minimum version')}</span>
            <span>{dataAnalysis?.minimumVersion || '-'}</span>
          </div>
          {dataAnalysis && !dataAnalysis.isValid && (
            <div className="text-red-600 mt-1">{t('용량 초과', 'Too much data')}</div>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <label htmlFor="qr-version" className="block mb-1 text-xs">
              {t('QR 버전', 'QR version')}
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
              {t('에러 정정 레벨', 'Error correction level')}
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
          <h3 className="text-xs font-medium text-gray-700 mb-2">{t('샘플 데이터', 'Sample data')}</h3>
          <div className="space-y-1">
            {/* 기본 인코딩 모드 */}
            <button
              onClick={() => setInputData('123456789')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">{t('숫자:', 'Numeric:')}</span> 123456789
            </button>
            <button
              onClick={() => setInputData('HELLO WORLD')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">{t('영숫자:', 'Alphanumeric:')}</span> HELLO WORLD
            </button>
            <button
              onClick={() => setInputData('https://example.com')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">URL:</span> https://example.com
            </button>
            <button
              onClick={() => setInputData('안녕하세요 QR코드')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">{t('한글:', 'Korean:')}</span> 안녕하세요 QR코드
            </button>
            <button
              onClick={() => setInputData('Mixed123한글')}
              className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              <span className="font-medium">{t('혼합:', 'Mixed:')}</span> Mixed123한글
            </button>

            {/* 실용적인 케이스들 */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="text-[10px] text-gray-500 mb-1">{t('실용 사례', 'Practical cases')}</div>

              <button
                onClick={() => setInputData('WIFI:T:WPA;S:MyWiFi;P:password123;H:false;;')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">Wi-Fi:</span> {t('네트워크 연결', 'Connect to Wi-Fi')}
              </button>

              <button
                onClick={() =>
                  setInputData(
                    'BEGIN:VCARD\nVERSION:3.0\nFN:홍길동\nORG:회사명\nTEL:010-1234-5678\nEMAIL:hong@example.com\nEND:VCARD' // cspell:disable-line
                  )
                }
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">{t('연락처:', 'Contact:')}</span> vCard 형식
              </button>

              <button
                onClick={() =>
                  setInputData(
                    'mailto:yongsk0066@gmail.com?subject=QR코드 문의&body=안녕하세요! QR 시각화 프로젝트에 대해 문의드립니다.'
                  )
                }
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">{t('이메일:', 'Email:')}</span> 메일 작성
              </button>

              <button
                onClick={() => setInputData('tel:+82-10-1234-5678')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">{t('전화:', 'Telephone:')}</span> 통화 연결
              </button>

              <button
                onClick={() =>
                  setInputData('sms:+82-10-1234-5678:안녕하세요! QR코드로 메시지를 보냅니다.')
                }
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">SMS:</span> {t('문자 메시지', 'Text message')}
              </button>

              <button
                onClick={() => setInputData('geo:37.5665,126.9780?q=서울특별시청')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">{t('위치:', 'Location:')}</span> 지도 좌표
              </button>

              <button
                onClick={() => setInputData('https://github.com/yongsk0066/qr-visualizer')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">GitHub:</span> {t('프로젝트 링크', 'Project link')}
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  const currentYear = now.getFullYear();
                  const christmas = new Date(currentYear, 11, 25); // 12월 25일

                  // 크리스마스가 지났으면 내년 크리스마스
                  const targetChristmas =
                    now > christmas ? new Date(currentYear + 1, 11, 25) : christmas;

                  const year = targetChristmas.getFullYear();
                  const startTime = `${year}1225T180000`; // 6:00 PM
                  const endTime = `${year}1225T210000`; // 9:00 PM

                  setInputData(
                    `BEGIN:VEVENT\nSUMMARY:Christmas Party at Rockefeller Center\nDTSTART:${startTime}\nDTEND:${endTime}\nLOCATION:Rockefeller Center, New York\nDESCRIPTION:Join us for a magical Christmas celebration at the iconic Rockefeller Center Christmas Tree\nEND:VEVENT` // cspell:disable-line
                  );
                }} // cspell:disable-line
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">{t('캘린더:', 'Calendar:')}</span> Christmas Party
              </button>

              <button
                onClick={() => setInputData('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">YouTube:</span> {t('동영상 링크', 'Video link')}
              </button>

              <button
                onClick={() => setInputData('market://details?id=com.android.chrome')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">{t('앱스토어:', 'App store:')}</span> {t('앱 다운로드', 'Download app')}
              </button>

              <button
                onClick={() => setInputData('fb://profile/100000000000000')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">Facebook:</span> {t('프로필 연결', 'Profile')}
              </button>

              <button
                onClick={() => setInputData('instagram://user?username=yongsk0066')} // cspell:disable-line
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">Instagram:</span> {t('프로필 방문', 'Visit profile')}
              </button>

              <button
                onClick={() => setInputData('spotify:track:2zPANzQTt5Nbkg0eBPb7HI')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">Spotify:</span> {t('음악 재생', 'Play music')}
              </button>

              <button
                onClick={() => setInputData('https://maps.google.com/maps?q=37.5665,126.9780')}
                className="w-full text-left text-xs p-1 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
              >
                <span className="font-medium">Google Maps:</span> {t('위치 공유', 'Share location')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
