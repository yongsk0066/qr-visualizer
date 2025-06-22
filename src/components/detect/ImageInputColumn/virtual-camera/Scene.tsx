import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  AMBIENT_LIGHT_INTENSITY,
  CAPTURE_CHECK_INTERVAL,
  CAPTURE_INTERVAL,
  DAMAGE_SPOT_OPACITY,
  DAMAGE_SPOT_SIZE,
  DIRECTIONAL_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_POSITION,
  QR_MODULE_SCALE,
  TOMATO_FLIGHT_DURATION,
  TOMATO_START_POSITION,
  TOMATO_TARGET_RADIUS,
} from './constants';
import { QRCodeMesh } from './QRCodeMesh';
import { Tomato } from './Tomato';
import type { DamageSpot, SceneHandle, SceneProps, TomatoState } from './types';
import { createDamageSpot, getRandomPositionInCircle } from './utils';

// Custom hook for capture management
const useCaptureManager = (scene: THREE.Scene, camera: THREE.Camera, captureSize: number) => {
  const offscreenRenderer = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!offscreenRenderer.current) {
      offscreenRenderer.current = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        antialias: false,
      });
      offscreenRenderer.current.setSize(captureSize, captureSize);
    }

    return () => {
      offscreenRenderer.current?.dispose();
      offscreenRenderer.current = null;
    };
  }, [captureSize]);

  const capture = useCallback(() => {
    if (offscreenRenderer.current) {
      offscreenRenderer.current.render(scene, camera);
      return offscreenRenderer.current.domElement.toDataURL('image/png');
    }
    return null;
  }, [scene, camera]);

  return capture;
};

export const Scene = forwardRef<SceneHandle, SceneProps>(
  (
    {
      matrix,
      isCapturing,
      onCapture,
      captureSize,
      shouldThrowTomato,
      onTomatoThrown,
      damageSpots,
      onDamageUpdate,
    },
    ref
  ) => {
    const { scene, camera } = useThree();
    const lastCaptureTime = useRef(0);
    const [tomatoes, setTomatoes] = useState<TomatoState[]>([]);
    const nextTomatoId = useRef(0);
    const captureHighRes = useCaptureManager(scene, camera, captureSize);

    // Expose capture method to parent component
    useImperativeHandle(
      ref,
      () => ({
        capture: () => {
          const dataUrl = captureHighRes();
          if (dataUrl) onCapture(dataUrl);
        },
      }),
      [captureHighRes, onCapture]
    );

    // 토마토 던지기 효과 (한 번만 실행)
    useEffect(() => {
      if (!shouldThrowTomato) return;

      // QR 코드를 마주보는 위치에서 시작 (약간의 변화 추가)
      const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * TOMATO_START_POSITION.x.offset,
        TOMATO_START_POSITION.y.base + (Math.random() - 0.5) * TOMATO_START_POSITION.y.offset,
        TOMATO_START_POSITION.z
      );

      // QR 크기에 비례한 타격 범위
      const { x: targetX, y: targetY } = getRandomPositionInCircle(TOMATO_TARGET_RADIUS);
      const targetPos = new THREE.Vector3(targetX, targetY, 0);

      // 미리 얼룩 스팟 계산
      const targetSpot = createDamageSpot(
        targetX,
        targetY,
        matrix.length,
        QR_MODULE_SCALE,
        DAMAGE_SPOT_SIZE,
        DAMAGE_SPOT_OPACITY
      );

      const flightDuration =
        TOMATO_FLIGHT_DURATION.base + Math.random() * TOMATO_FLIGHT_DURATION.random;

      const newTomato: TomatoState = {
        id: nextTomatoId.current++,
        startPosition: startPos,
        targetPosition: targetPos,
        isFlying: true,
        startTime: 0,
        flightDuration,
        targetSpot,
      };

      setTomatoes((prev) => [...prev, newTomato]);
      onTomatoThrown();
    }, [shouldThrowTomato, onTomatoThrown, matrix]);

    // 토마토 애니메이션 완료 처리
    const handleTomatoComplete = useCallback(
      (tomatoId: number, targetSpot: DamageSpot) => {
        // 토마토 제거
        setTomatoes((prev) => prev.filter((t) => t.id !== tomatoId));

        // 미리 계산된 얼룩 추가
        onDamageUpdate([...damageSpots, targetSpot]);
      },
      [damageSpots, onDamageUpdate]
    );

    // 캡처 처리
    useEffect(() => {
      if (!isCapturing) return;

      const captureFrame = () => {
        const now = Date.now();
        if (now - lastCaptureTime.current < CAPTURE_INTERVAL) return;

        lastCaptureTime.current = now;
        const dataUrl = captureHighRes();
        if (dataUrl) onCapture(dataUrl);
      };

      const interval = setInterval(captureFrame, CAPTURE_CHECK_INTERVAL);
      return () => clearInterval(interval);
    }, [isCapturing, captureHighRes, onCapture]);

    return (
      <>
        <ambientLight intensity={AMBIENT_LIGHT_INTENSITY} />
        <directionalLight
          position={[...DIRECTIONAL_LIGHT_POSITION]}
          intensity={DIRECTIONAL_LIGHT_INTENSITY}
        />
        <QRCodeMesh matrix={matrix} damageSpots={damageSpots} />

        {tomatoes.map((tomato) => (
          <Tomato key={tomato.id} tomato={tomato} onComplete={handleTomatoComplete} />
        ))}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </>
    );
  }
);

Scene.displayName = 'Scene';
