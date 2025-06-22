import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import * as THREE from 'three';

interface VirtualCameraInputProps {
  matrix: number[][];
  onImageCapture: (url: string) => void;
}

// 3D QR Code Mesh Component
function QRCodeMesh({ matrix }: { matrix: number[][] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!matrix || matrix.length === 0) return;

    const size = matrix.length;
    const scale = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

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
function Scene({ matrix, isCapturing, onCapture, captureSize }: { 
  matrix: number[][]; 
  isCapturing: boolean;
  onCapture: (data: string) => void;
  captureSize: number;
}) {
  const { gl, scene, camera } = useThree();
  const lastCaptureTime = useRef(0);
  const offscreenRenderer = useRef<THREE.WebGLRenderer | null>(null);

  // 오프스크린 렌더러 초기화
  useEffect(() => {
    if (!offscreenRenderer.current) {
      offscreenRenderer.current = new THREE.WebGLRenderer({ 
        preserveDrawingBuffer: true,
        antialias: false 
      });
      offscreenRenderer.current.setSize(captureSize, captureSize);
    }
    
    return () => {
      offscreenRenderer.current?.dispose();
      offscreenRenderer.current = null;
    };
  }, [captureSize]);

  // 캡처 함수
  const captureHighRes = useCallback(() => {
    if (offscreenRenderer.current) {
      offscreenRenderer.current.render(scene, camera);
      const dataUrl = offscreenRenderer.current.domElement.toDataURL('image/png');
      onCapture(dataUrl);
    }
  }, [scene, camera, onCapture]);

  useEffect(() => {
    if (!isCapturing) return;

    const captureFrame = () => {
      const now = Date.now();
      if (now - lastCaptureTime.current < 500) return;
      
      lastCaptureTime.current = now;
      captureHighRes();
    };

    const interval = setInterval(captureFrame, 50);
    return () => clearInterval(interval);
  }, [isCapturing, captureHighRes]);

  useFrame(() => {
    (window as unknown as { 
      virtualCameraGL?: { 
        gl: unknown; 
        scene: unknown; 
        camera: unknown;
        captureHighRes?: () => void;
      } 
    }).virtualCameraGL = { gl, scene, camera, captureHighRes };
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

export function VirtualCameraInput({ matrix, onImageCapture }: VirtualCameraInputProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [captureResolution, setCaptureResolution] = useState(1024); // 캡처 해상도
  const [hasInitialCapture, setHasInitialCapture] = useState(false);

  // 컨테이너 크기에 맞춰 Canvas 크기 조정
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width - 24, 400); // 최대 400px, 패딩 고려
        setDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 초기 자동 캡처
  useEffect(() => {
    if (!hasInitialCapture && matrix && matrix.length > 0) {
      // Scene이 렌더링될 시간을 주기 위해 지연
      const timer = setTimeout(() => {
        const { captureHighRes } = (window as unknown as { 
          virtualCameraGL?: { 
            gl: unknown; 
            scene: unknown; 
            camera: unknown;
            captureHighRes?: () => void;
          } 
        }).virtualCameraGL || {};
        
        if (captureHighRes) {
          captureHighRes();
          setHasInitialCapture(true);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [matrix, hasInitialCapture]);

  const handleManualCapture = useCallback(() => {
    const { captureHighRes } = (window as unknown as { 
      virtualCameraGL?: { 
        gl: unknown; 
        scene: unknown; 
        camera: unknown;
        captureHighRes?: () => void;
      } 
    }).virtualCameraGL || {};
    
    if (captureHighRes) {
      captureHighRes();
    }
  }, []);

  return (
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
            <span className="info-value">{isCapturing ? 'Real-time (500ms)' : 'Manual'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Capture Resolution:</span>
            <select 
              value={captureResolution}
              onChange={(e) => setCaptureResolution(Number(e.target.value))}
              className="text-xs border rounded px-1 py-0.5"
            >
              <option value={512}>512×512</option>
              <option value={1024}>1024×1024</option>
              <option value={2048}>2048×2048</option>
            </select>
          </div>
        </div>
      </div>
      
      <div ref={containerRef} className="bg-gray-50 p-3 rounded relative">
        <div 
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            margin: '0 auto'
          }}
        >
          <Canvas
            gl={{ preserveDrawingBuffer: true, antialias: false }}
            camera={{ position: [0, 0, 5], fov: 50 }}
            dpr={[1, 2]}
          >
            <Scene 
              matrix={matrix} 
              onCapture={onImageCapture} 
              isCapturing={isCapturing}
              captureSize={captureResolution}
            />
          </Canvas>
        </div>
        {isCapturing && (
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
          onClick={handleManualCapture}
          className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          캡처
        </button>
        <button
          onClick={() => setIsCapturing(!isCapturing)}
          className={`flex-1 px-3 py-2 text-xs rounded ${
            isCapturing
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isCapturing ? '실시간 정지' : '실시간 시작'}
        </button>
      </div>
    </div>
  );
}