import { Suspense, lazy, useState } from 'react';
import type { ImageProcessingResult } from '../../../qr-decode/types';
import { CameraInput } from './CameraInput';
import { FileInput } from './FileInput';
import { t } from '../../lang';

// VirtualCameraInput를 lazy load
const VirtualCameraInput = lazy(() =>
  import('./virtual-camera').then((module) => ({
    default: module.VirtualCameraInput,
  }))
);

interface ImageInputColumnProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  imageProcessing: ImageProcessingResult | null;
  isProcessing: boolean;
  encodedQRMatrix?: number[][] | null;
}

type InputMode = 'file' | 'camera' | 'virtual';

export function ImageInputColumn({
  imageUrl,
  setImageUrl,
  imageProcessing,
  isProcessing,
  encodedQRMatrix,
}: ImageInputColumnProps) {
  // 기본값을 virtual로 설정
  const [inputMode, setInputMode] = useState<InputMode>('virtual');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleModeChange = (mode: InputMode) => {
    // 현재 모드에서 벗어날 때 정리
    if (inputMode === 'camera' && mode !== 'camera') {
      setIsCameraActive(false);
    }
    setInputMode(mode);

    // 카메라 모드로 전환시 활성화
    if (mode === 'camera') {
      setIsCameraActive(true);
    }
  };

  const handleCameraStop = () => {
    setIsCameraActive(false);
    setInputMode('file');
  };

  return (
    <div className="step-column">
      <h2 className="font-medium mb-3">{t('1단계: 이미지 입력', 'Step 1: Image Input')}</h2>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('QR 코드 이미지를 업로드하거나 카메라로 캡처합니다', 'Upload a QR image or capture from camera')}
        </p>

        {/* 입력 모드 선택 버튼 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">입력 방법 선택</div>
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange('file')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                inputMode === 'file'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              파일 업로드
            </button>
            <button
              onClick={() => handleModeChange('camera')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                inputMode === 'camera'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              카메라
            </button>
            {encodedQRMatrix && (
              <button
                onClick={() => handleModeChange('virtual')}
                className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                  inputMode === 'virtual'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                가상 카메라
              </button>
            )}
          </div>
        </div>

        {/* 파일 업로드 UI */}
        {inputMode === 'file' && <FileInput onImageSelect={setImageUrl} />}

        {/* 카메라 UI */}
        {inputMode === 'camera' && (
          <CameraInput
            isActive={isCameraActive}
            onImageCapture={setImageUrl}
            onStop={handleCameraStop}
          />
        )}

        {/* Virtual Camera UI */}
        {inputMode === 'virtual' && encodedQRMatrix && (
          <Suspense
            fallback={
              <div className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                    <p className="text-sm text-gray-600">가상 카메라 로딩 중...</p>
                  </div>
                </div>
              </div>
            }
          >
            <VirtualCameraInput matrix={encodedQRMatrix} onImageCapture={setImageUrl} />
          </Suspense>
        )}

        {/* 결과 이미지 표시 (파일 모드에서만) */}
        {imageUrl && inputMode === 'file' && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs font-medium mb-2">업로드된 이미지</div>
              <img src={imageUrl} alt="Input QR Code" className="w-full h-auto rounded border border-gray-200" />
              {imageProcessing && (
                <div className="mt-2 text-xs text-gray-500">
                  크기: {imageProcessing.width} × {imageProcessing.height}px
                </div>
              )}
            </div>
          </div>
        )}

        {/* 카메라/가상카메라 모드에서의 처리 상태 */}
        {(inputMode === 'camera' || inputMode === 'virtual') && imageProcessing && (
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">처리 상태</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">프레임 크기:</span>
                <span className="font-mono">{imageProcessing.width} × {imageProcessing.height}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">상태:</span>
                <span className="font-mono">{isProcessing ? '분석 중...' : '실시간 모니터링 중'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 설명 */}
        <div className="p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium mb-1">입력 방법</div>
          <div className="space-y-0.5 text-gray-700">
            <div>• 파일 업로드: 드래그 앤 드롭 또는 클릭하여 선택</div>
            <div>• 카메라: 수동/자동 모드로 실시간 캐팁</div>
            <div>• 가상 카메라: 3D QR 코드를 다양한 각도에서 테스트</div>
          </div>
        </div>
      </div>
    </div>
  );
}
