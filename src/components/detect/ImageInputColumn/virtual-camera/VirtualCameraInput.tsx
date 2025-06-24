import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import type { VirtualCameraInputProps, DamageSpot, SceneHandle } from './types';
import { useContainerDimensions } from './hooks';
import { 
  CAMERA_POSITION, 
  CAMERA_FOV,
  DEFAULT_CAPTURE_RESOLUTION,
  CAPTURE_RESOLUTIONS,
  TOMATO_COOLDOWN,
  INITIAL_CAPTURE_DELAY
} from './constants';
import { t } from '../../../../i18n';

export function VirtualCameraInput({ matrix, onImageCapture }: VirtualCameraInputProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResolution, setCaptureResolution] = useState(DEFAULT_CAPTURE_RESOLUTION);
  const [hasInitialCapture, setHasInitialCapture] = useState(false);
  const [shouldThrowTomato, setShouldThrowTomato] = useState(false);
  const [tomatoCount, setTomatoCount] = useState(0);
  const [damageSpots, setDamageSpots] = useState<DamageSpot[]>([]);
  const sceneRef = useRef<SceneHandle>(null);
  
  // Custom hooks
  const { containerRef, dimensions } = useContainerDimensions();
  
  // Initial capture with ref - retry until scene is ready
  useEffect(() => {
    if (!hasInitialCapture && matrix && matrix.length > 0) {
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryCapture = () => {
        if (sceneRef.current) {
          sceneRef.current.capture();
          setHasInitialCapture(true);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryCapture, 100); // Retry after 100ms
        }
      };

      const timer = setTimeout(tryCapture, INITIAL_CAPTURE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [matrix, hasInitialCapture]);
  
  const handleManualCapture = useCallback(() => {
    sceneRef.current?.capture();
  }, []);

  const handleThrowTomato = useCallback(() => {
    if (shouldThrowTomato) return; // 이미 던지는 중이면 무시
    setShouldThrowTomato(true);
    setTomatoCount(prev => prev + 1);
  }, [shouldThrowTomato]);

  const handleTomatoThrown = useCallback(() => {
    // 약간의 지연 후 플래그 리셋 (연속 클릭 방지)
    setTimeout(() => {
      setShouldThrowTomato(false);
    }, TOMATO_COOLDOWN);
  }, []);

  const handleResetDamage = useCallback(() => {
    setDamageSpots([]);
    setTomatoCount(0);
  }, []);

  return (
    <div className="space-y-3">
      {/* 3D 뷰 */}
      <div ref={containerRef} className="p-3 bg-gray-50 rounded">
        <div className="text-xs font-medium mb-2">{t('virtualCamera.3dView')}</div>
        <div className="relative">
          <div 
            style={{ 
              width: `${dimensions.width}px`, 
              height: `${dimensions.height}px`,
              margin: '0 auto'
            }}
          >
            <Canvas
              gl={{ preserveDrawingBuffer: true, antialias: false }}
              camera={{ position: CAMERA_POSITION as [number, number, number], fov: CAMERA_FOV }}
              dpr={[1, 2]}
            >
              <Scene 
                ref={sceneRef}
                matrix={matrix} 
                onCapture={onImageCapture} 
                isCapturing={isCapturing}
                captureSize={captureResolution}
                shouldThrowTomato={shouldThrowTomato}
                onTomatoThrown={handleTomatoThrown}
                damageSpots={damageSpots}
                onDamageUpdate={setDamageSpots}
              />
            </Canvas>
          </div>
          {isCapturing && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                {t('virtualCamera.capturing')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 가상 카메라 정보 */}
      <div className="p-3 bg-gray-50 rounded">
        <div className="text-xs font-medium mb-2">{t('virtualCamera.settings')}</div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-600">{t('virtualCamera.captureMode')}</div>
              <div className="font-mono font-semibold">
                {isCapturing ? t('virtualCamera.realtime') : t('virtualCamera.manual')}
              </div>
            </div>
            <div>
              <div className="text-gray-600">{t('virtualCamera.captureResolution')}</div>
              <select 
                value={captureResolution}
                onChange={(e) => setCaptureResolution(Number(e.target.value))}
                className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
              >
                {CAPTURE_RESOLUTIONS.map(res => (
                  <option key={res} value={res}>{res}×{res}px</option>
                ))}
              </select>
            </div>
          </div>
          <div className="border-t pt-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-600">{t('virtualCamera.tomatoesThrown')}</div>
                <div className="font-mono font-semibold">{tomatoCount}{t('common.unit')}</div>
              </div>
              <div>
                <div className="text-gray-600">{t('virtualCamera.damageSpots')}</div>
                <div className="font-mono font-semibold">{damageSpots.length}{t('common.unit')}</div>
              </div>
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
            {t('virtualCamera.manualCapture')}
          </button>
          <button
            onClick={() => setIsCapturing(!isCapturing)}
            className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
              isCapturing
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isCapturing ? t('virtualCamera.stopRealtime') : t('virtualCamera.startRealtime')}
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleThrowTomato}
            disabled={shouldThrowTomato}
            className={`flex-1 px-3 py-2 text-xs rounded font-medium transition-all duration-200 ${
              shouldThrowTomato
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform scale-95'
                : 'bg-red-400 text-white hover:bg-red-500 active:bg-red-600 hover:transform hover:scale-105'
            }`}
          >
            {shouldThrowTomato ? t('virtualCamera.throwing') : t('virtualCamera.throwTomato')}
          </button>
          
          <button
            onClick={handleResetDamage}
            disabled={damageSpots.length === 0}
            className={`px-3 py-2 text-xs rounded font-medium transition-all duration-200 ${
              damageSpots.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {t('virtualCamera.reset')}
          </button>
        </div>
      </div>

      {/* 가상 카메라 사용 설명 */}
      <div className="p-2 bg-blue-50 rounded text-xs">
        <div className="font-medium mb-1">{t('virtualCamera.features')}</div>
        <div className="space-y-0.5 text-gray-700">
          <div>• {t('virtualCamera.featureDrag')}</div>
          <div>• {t('virtualCamera.featureZoom')}</div>
          <div>• {t('virtualCamera.featureTomato')}</div>
          <div>• {t('virtualCamera.featureResolution')}</div>
        </div>
      </div>
    </div>
  );
}