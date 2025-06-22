import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { TomatoProps } from './types';
import { TOMATO_RADIUS, TOMATO_PARABOLA_HEIGHT, TOMATO_MATERIAL } from './constants';

export function Tomato({ tomato, onComplete }: TomatoProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTimeRef = useRef<number>(0);

  useFrame((state) => {
    if (!meshRef.current || !tomato.isFlying) return;

    // 첫 프레임에서 시작 시간 설정
    if (startTimeRef.current === 0) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const progress = Math.min(elapsed / tomato.flightDuration, 1);

    if (progress >= 1) {
      // 애니메이션 완료 - 얼룩 생성하고 토마토 제거
      onComplete(tomato.id, tomato.targetSpot);
      return;
    }

    // 베지어 곡선으로 부드러운 포물선 경로 계산
    const startPos = tomato.startPosition;
    const targetPos = tomato.targetPosition;

    // 중간 지점 (높이 추가로 포물선 효과)
    const midPoint = new THREE.Vector3(
      (startPos.x + targetPos.x) / 2,
      Math.max(startPos.y, targetPos.y) + TOMATO_PARABOLA_HEIGHT,
      (startPos.z + targetPos.z) / 2
    );

    // 이차 베지어 곡선 계산
    const t = progress;
    const oneMinusT = 1 - t;

    const currentPosition = new THREE.Vector3(
      oneMinusT * oneMinusT * startPos.x + 2 * oneMinusT * t * midPoint.x + t * t * targetPos.x,
      oneMinusT * oneMinusT * startPos.y + 2 * oneMinusT * t * midPoint.y + t * t * targetPos.y,
      oneMinusT * oneMinusT * startPos.z + 2 * oneMinusT * t * midPoint.z + t * t * targetPos.z
    );

    meshRef.current.position.copy(currentPosition);
  });

  return (
    <Sphere ref={meshRef} args={[TOMATO_RADIUS]} position={tomato.startPosition.toArray()}>
      <meshStandardMaterial {...TOMATO_MATERIAL} />
    </Sphere>
  );
}
