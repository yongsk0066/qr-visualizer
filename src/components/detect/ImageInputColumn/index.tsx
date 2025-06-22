import { Suspense, lazy, useState } from 'react';
import type { ImageProcessingResult } from '../../../qr-decode/types';
import { CameraInput } from './CameraInput';
import { FileInput } from './FileInput';

// VirtualCameraInput를 lazy load
const VirtualCameraInput = lazy(() =>
  import('./VirtualCameraInput').then((module) => ({
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
      <h3 className="step-title">Step 1: Image Input</h3>

      {/* 입력 모드 선택 버튼 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleModeChange('file')}
          className={`flex-1 px-3 py-2 text-xs rounded ${
            inputMode === 'file'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          파일 업로드
        </button>
        <button
          onClick={() => handleModeChange('camera')}
          className={`flex-1 px-3 py-2 text-xs rounded ${
            inputMode === 'camera'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          카메라
        </button>
        {encodedQRMatrix && (
          <button
            onClick={() => handleModeChange('virtual')}
            className={`flex-1 px-3 py-2 text-xs rounded ${
              inputMode === 'virtual'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            가상 카메라
          </button>
        )}
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
            <div className="bg-gray-50 p-3 rounded">
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
          <div className="bg-gray-50 p-3 rounded">
            <img src={imageUrl} alt="Input QR Code" className="w-full h-auto rounded" />
          </div>

          {imageProcessing && (
            <div className="text-xs space-y-1">
              <p>
                크기: {imageProcessing.width} × {imageProcessing.height}px
              </p>
              <p>상태: {isProcessing ? '처리 중...' : '처리 완료'}</p>
            </div>
          )}
        </div>
      )}

      {/* 카메라/가상카메라 모드에서의 처리 상태 */}
      {(inputMode === 'camera' || inputMode === 'virtual') && imageProcessing && (
        <div className="text-xs space-y-1 mt-3">
          <p>
            프레임 크기: {imageProcessing.width} × {imageProcessing.height}px
          </p>
          <p>상태: {isProcessing ? '분석 중...' : '대기 중'}</p>
        </div>
      )}
    </div>
  );
}
