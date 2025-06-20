import { useRef, useState, useEffect, useCallback } from 'react';
import type { ImageProcessingResult } from '../../qr-decode/types';

interface ImageInputColumnProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  imageProcessing: ImageProcessingResult | null;
  isProcessing: boolean;
}

export function ImageInputColumn({ 
  imageUrl, 
  setImageUrl, 
  imageProcessing,
  isProcessing 
}: ImageInputColumnProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setImageUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setImageUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // 프레임 캡처 및 처리 (useRef로 상태 참조)
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Capture skipped: refs not ready');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 비디오가 재생 중인지 확인
    if (video.paused || video.ended || video.readyState < 2) {
      console.log('Capture skipped: video not ready');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0);
    
    // 캔버스 내용을 data URL로 변환
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log('Frame captured, size:', video.videoWidth, 'x', video.videoHeight);
    // 타임스탬프를 추가하여 매번 다른 URL로 인식되도록 함
    setImageUrl(dataUrl + '#' + Date.now());
  }, [setImageUrl]);

  // 주기적으로 프레임 캡처
  const startCapturing = useCallback(() => {
    // 500ms마다 프레임 캡처 (초당 2프레임)
    intervalRef.current = window.setInterval(captureFrame, 500);
  }, [captureFrame]);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // 후면 카메라 우선
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
        
        // 비디오가 준비되면 재생
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        
        // 비디오가 실제로 재생되기 시작하면 캡처 시작
        videoRef.current.onplaying = () => {
          console.log('Video is playing, starting capture...');
          startCapturing();
        };
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      alert('카메라에 접근할 수 없습니다.');
    }
  }, [startCapturing]);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCameraActive(false);
    setIsUsingCamera(false);
  }, [stream]);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stream]);

  return (
    <div className="step-column">
      <h3 className="step-title">Step 1: Image Input</h3>
      
      {/* 입력 모드 선택 버튼 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setIsUsingCamera(false);
            stopCamera();
          }}
          className={`flex-1 px-3 py-2 text-xs rounded ${
            !isUsingCamera 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          파일 업로드
        </button>
        <button
          onClick={() => {
            setIsUsingCamera(true);
            startCamera();
          }}
          className={`flex-1 px-3 py-2 text-xs rounded ${
            isUsingCamera 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          카메라
        </button>
      </div>

      {/* 파일 업로드 UI */}
      {!isUsingCamera && (
        <div className="mb-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-gray-600 text-sm">
              클릭하거나 이미지를 드래그하여 업로드
            </p>
          </div>
        </div>
      )}

      {/* 카메라 UI */}
      {isUsingCamera && (
        <div className="mb-4 space-y-3">
          <div className="bg-gray-50 p-3 rounded relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto rounded"
              style={{ maxHeight: '300px' }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            {isCameraActive && (
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                  실시간 스캔 중
                </span>
              </div>
            )}
          </div>
          <button
            onClick={stopCamera}
            className="w-full px-3 py-2 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            카메라 정지
          </button>
        </div>
      )}

      {/* 결과 이미지 표시 */}
      {imageUrl && !isUsingCamera && (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <img 
              src={imageUrl} 
              alt="Input QR Code" 
              className="w-full h-auto rounded"
            />
          </div>
          
          {imageProcessing && (
            <div className="text-xs space-y-1">
              <p>크기: {imageProcessing.width} × {imageProcessing.height}px</p>
              <p>상태: {isProcessing ? '처리 중...' : '처리 완료'}</p>
            </div>
          )}
        </div>
      )}

      {/* 카메라 모드에서의 처리 상태 */}
      {isUsingCamera && imageProcessing && (
        <div className="text-xs space-y-1 mt-3">
          <p>프레임 크기: {imageProcessing.width} × {imageProcessing.height}px</p>
          <p>상태: {isProcessing ? '분석 중...' : '대기 중'}</p>
        </div>
      )}
    </div>
  );
}