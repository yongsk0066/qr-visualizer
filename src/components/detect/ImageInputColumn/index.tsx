import { Suspense, lazy, useState } from 'react';
import type { ImageProcessingResult } from '../../../qr-decode/types';
import { CameraInput } from './CameraInput';
import { FileInput } from './FileInput';
import { t } from '../../../i18n';

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
      <h2 className="font-medium mb-3">{t('steps.detect.imageInput')}</h2>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('detect.imageInputDesc')}
        </p>

        {/* 입력 모드 선택 버튼 */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium mb-2">{t('ui.inputMethodSelect')}</div>
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange('file')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                inputMode === 'file'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {t('imageInput.fileUpload')}
            </button>
            <button
              onClick={() => handleModeChange('camera')}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                inputMode === 'camera'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {t('imageInput.camera')}
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
                {t('imageInput.virtualCamera')}
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
                    <p className="text-sm text-gray-600">{t('imageInput.virtualCameraLoading')}</p>
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
              <div className="text-xs font-medium mb-2">{t('imageInput.uploadedImage')}</div>
              <img src={imageUrl} alt="Input QR Code" className="w-full h-auto rounded border border-gray-200" />
              {imageProcessing && (
                <div className="mt-2 text-xs text-gray-500">
                  {t('common.size')}: {imageProcessing.width} × {imageProcessing.height}px
                </div>
              )}
            </div>
          </div>
        )}

        {/* 카메라/가상카메라 모드에서의 처리 상태 */}
        {(inputMode === 'camera' || inputMode === 'virtual') && imageProcessing && (
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs font-medium mb-2">{t('imageInput.processingStatus')}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('imageInput.frameSize')}:</span>
                <span className="font-mono">{imageProcessing.width} × {imageProcessing.height}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('common.status')}:</span>
                <span className="font-mono">{isProcessing ? t('imageInput.analyzing') : t('imageInput.monitoring')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 설명 */}
        <div className="p-2 bg-blue-50 rounded text-xs">
          <div className="font-medium mb-1">{t('imageInput.inputMethods')}</div>
          <div className="space-y-0.5 text-gray-700">
            <div>• {t('imageInput.fileUploadDesc')}</div>
            <div>• {t('imageInput.cameraDesc')}</div>
            <div>• {t('imageInput.virtualCameraDesc')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
