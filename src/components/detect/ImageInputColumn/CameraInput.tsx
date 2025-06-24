import { useRef, useEffect, useCallback, useState } from 'react';
import { t } from '../../../i18n';

interface CameraInputProps {
  isActive: boolean;
  onImageCapture: (url: string) => void;
  onStop: () => void;
}

export function CameraInput({ isActive, onImageCapture, onStop }: CameraInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastCaptureTime = useRef(0);
  const [isCapturing, setIsCapturing] = useState(false);

  // 단일 프레임 캡처
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.paused || video.ended || video.readyState < 2) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onImageCapture(dataUrl + '#' + Date.now());
  }, [onImageCapture]);

  // 수동 캡처
  const handleManualCapture = useCallback(() => {
    captureFrame();
  }, [captureFrame]);

  // 카메라 시작
  useEffect(() => {
    if (!isActive) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
          
          videoRef.current.onplaying = () => {
            // 카메라가 준비되면 아무것도 하지 않음 (수동/실시간 모드로 제어)
          };
        }
      } catch {
        alert(t('camera.accessError'));
        onStop();
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, onStop]);

  // 실시간 캡처 모드 관리
  useEffect(() => {
    if (!isCapturing || !isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const captureWithThrottle = () => {
      const now = Date.now();
      if (now - lastCaptureTime.current < 500) return; // 500ms 간격
      
      lastCaptureTime.current = now;
      captureFrame();
    };

    intervalRef.current = window.setInterval(captureWithThrottle, 50); // 20 FPS 체크

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCapturing, isActive, captureFrame]);

  if (!isActive) return null;

  return (
    <div className="space-y-3">
      {/* 카메라 화면 */}
      <div className="p-3 bg-gray-50 rounded">
        <div className="text-xs font-medium mb-2">{t('camera.cameraView')}</div>
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto rounded border border-gray-200"
            style={{ maxHeight: '300px' }}
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          {isCapturing && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {t('camera.capturing')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 카메라 정보 */}
      <div className="p-3 bg-gray-50 rounded">
        <div className="text-xs font-medium mb-2">{t('camera.cameraInfo')}</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-600">{t('camera.resolution')}</div>
            <div className="font-mono font-semibold">
              {videoRef.current?.videoWidth || t('common.loading')} × {videoRef.current?.videoHeight || t('common.loading')}
            </div>
          </div>
          <div>
            <div className="text-gray-600">{t('camera.captureMode')}</div>
            <div className="font-mono font-semibold">
              {isCapturing ? t('camera.realtime') : t('camera.manual')}
            </div>
          </div>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleManualCapture}
            className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {t('camera.manualCapture')}
          </button>
          <button
            onClick={() => setIsCapturing(!isCapturing)}
            className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
              isCapturing
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isCapturing ? t('camera.stopRealtime') : t('camera.startRealtime')}
          </button>
        </div>
        
        <button
          onClick={onStop}
          className="w-full px-3 py-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          {t('camera.stopCamera')}
        </button>
      </div>

      {/* 카메라 사용 설명 */}
      <div className="p-2 bg-amber-50 rounded text-xs">
        <div className="font-medium mb-1">{t('camera.captureMethod')}</div>
        <div className="space-y-0.5 text-gray-700">
          <div>• {t('camera.manualCaptureDesc')}</div>
          <div>• {t('camera.realtimeModeDesc')}</div>
          <div>• {t('camera.positionTip')}</div>
        </div>
      </div>
    </div>
  );
}