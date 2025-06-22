import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import * as THREE from 'three';
import type { ImageProcessingResult } from '../../qr-decode/types';

interface ImageInputColumnProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  imageProcessing: ImageProcessingResult | null;
  isProcessing: boolean;
  encodedQRMatrix?: number[][] | null;
}

// 3D QR Code Mesh Component
function QRCodeMesh({ matrix }: { matrix: number[][] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!matrix || matrix.length === 0) return;

    // Create canvas for QR code texture
    const size = matrix.length;
    const scale = 20; // Increased for better resolution
    const canvas = document.createElement('canvas');
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Draw QR code
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (matrix[row][col] === 1) {
          ctx.fillStyle = 'black';
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    }

    // Add quiet zone
    const quietZone = 4 * scale;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width + quietZone * 2;
    finalCanvas.height = canvas.height + quietZone * 2;
    const finalCtx = finalCanvas.getContext('2d');
    
    if (finalCtx) {
      finalCtx.fillStyle = 'white';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      finalCtx.drawImage(canvas, quietZone, quietZone);
    }

    // Create texture
    const texture = new THREE.CanvasTexture(finalCanvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    textureRef.current = texture;

    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).map = texture;
      (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }, [matrix]);

  return (
    <Box ref={meshRef} args={[2, 2, 0.1]}>
      <meshBasicMaterial side={THREE.DoubleSide} />
    </Box>
  );
}

// 3D Scene Component
function Scene({ matrix, isCapturing, onCapture }: { 
  matrix: number[][]; 
  isCapturing: boolean;
  onCapture: (data: string) => void; 
}) {
  const { gl, scene, camera } = useThree();
  const lastCaptureTime = useRef(0);

  useEffect(() => {
    if (!isCapturing) return;

    const captureFrame = () => {
      const now = Date.now();
      if (now - lastCaptureTime.current < 500) return;
      
      lastCaptureTime.current = now;
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL('image/png');
      onCapture(dataUrl);
    };

    const interval = setInterval(captureFrame, 50); // 20 FPS (1000ms / 20 = 50ms)
    return () => clearInterval(interval);
  }, [gl, scene, camera, onCapture, isCapturing]);

  // 단건 캡처를 위한 함수
  useFrame(() => {
    // Scene을 외부에서 접근할 수 있도록 gl을 window에 저장
    (window as unknown as { virtualCameraGL?: { gl: unknown; scene: unknown; camera: unknown } }).virtualCameraGL = { gl, scene, camera };
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <QRCodeMesh matrix={matrix} />
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
      />
    </>
  );
}

export function ImageInputColumn({ 
  imageUrl, 
  setImageUrl, 
  imageProcessing,
  isProcessing,
  encodedQRMatrix
}: ImageInputColumnProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputMode, setInputMode] = useState<'file' | 'camera' | 'virtual'>(encodedQRMatrix ? 'virtual' : 'file');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVirtualCapturing, setIsVirtualCapturing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // encodedQRMatrix가 있으면 자동으로 virtual 모드로 전환
  useEffect(() => {
    if (encodedQRMatrix) {
      setInputMode('virtual');
    }
  }, [encodedQRMatrix]);

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
    // 타임스탬프를 추가하여 매번 다른 URL로 인식되도록 함
    setImageUrl(dataUrl + '#' + Date.now());
  }, [setImageUrl]);

  // 주기적으로 프레임 캡처
  const startCapturing = useCallback(() => {
    // 50ms마다 프레임 캡처 (20 FPS)
    intervalRef.current = window.setInterval(captureFrame, 50);
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
          startCapturing();
        };
      }
    } catch {
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
    setInputMode('file');
  }, [stream]);

  // Virtual Camera 캡처 핸들러
  const handleVirtualCapture = useCallback((dataUrl: string) => {
    setImageUrl(dataUrl);
  }, [setImageUrl]);

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
            setInputMode('file');
            stopCamera();
          }}
          className={`flex-1 px-3 py-2 text-xs rounded ${
            inputMode === 'file'
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          파일 업로드
        </button>
        <button
          onClick={() => {
            setInputMode('camera');
            startCamera();
          }}
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
            onClick={() => {
              setInputMode('virtual');
              stopCamera();
            }}
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
      {inputMode === 'file' && (
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
      {inputMode === 'camera' && (
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

      {/* Virtual Camera UI */}
      {inputMode === 'virtual' && encodedQRMatrix && (
        <div className="mb-4 space-y-3">
          <div className="info-section">
            <h4 className="info-title">3D QR Code</h4>
            <div className="space-y-1 text-xs">
              <div className="info-item">
                <span className="info-label">Control:</span>
                <span className="info-value">Drag to rotate, scroll to zoom</span>
              </div>
              <div className="info-item">
                <span className="info-label">Capture Mode:</span>
                <span className="info-value">{isVirtualCapturing ? 'Real-time (500ms)' : 'Manual'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded relative" style={{ width: '512px', height: '512px', margin: '0 auto' }}>
            <Canvas
              gl={{ preserveDrawingBuffer: true, antialias: false }}
              camera={{ position: [0, 0, 5], fov: 50 }}
              dpr={[1, 2]}
            >
              <Scene matrix={encodedQRMatrix} onCapture={handleVirtualCapture} isCapturing={isVirtualCapturing} />
            </Canvas>
            {isVirtualCapturing && (
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                  실시간 캡처 중
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Single capture
                const { gl, scene, camera } = (window as unknown as { virtualCameraGL?: { gl: { render: (scene: unknown, camera: unknown) => void; domElement: HTMLCanvasElement }; scene: unknown; camera: unknown } }).virtualCameraGL || {};
                if (gl && scene && camera) {
                  gl.render(scene, camera);
                  const dataUrl = gl.domElement.toDataURL('image/png');
                  handleVirtualCapture(dataUrl);
                }
              }}
              className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              캡처
            </button>
            <button
              onClick={() => setIsVirtualCapturing(!isVirtualCapturing)}
              className={`flex-1 px-3 py-2 text-xs rounded ${
                isVirtualCapturing
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isVirtualCapturing ? '실시간 정지' : '실시간 시작'}
            </button>
          </div>
        </div>
      )}

      {/* 결과 이미지 표시 */}
      {imageUrl && inputMode === 'file' && (
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

      {/* 카메라/가상카메라 모드에서의 처리 상태 */}
      {(inputMode === 'camera' || inputMode === 'virtual') && imageProcessing && (
        <div className="text-xs space-y-1 mt-3">
          <p>프레임 크기: {imageProcessing.width} × {imageProcessing.height}px</p>
          <p>상태: {isProcessing ? '분석 중...' : '대기 중'}</p>
        </div>
      )}
    </div>
  );
}