import type * as THREE from 'three';

export interface VirtualCameraInputProps {
  matrix: number[][];
  onImageCapture: (url: string) => void;
}

export interface TomatoState {
  id: number;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  isFlying: boolean;
  startTime: number;
  flightDuration: number;
  targetSpot: DamageSpot;
}

export interface DamageSpot {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export interface SceneProps {
  matrix: number[][];
  isCapturing: boolean;
  onCapture: (data: string) => void;
  captureSize: number;
  shouldThrowTomato: boolean;
  onTomatoThrown: () => void;
  damageSpots: DamageSpot[];
  onDamageUpdate: (spots: DamageSpot[]) => void;
}

export interface SceneHandle {
  capture: () => void;
}

export interface TomatoProps {
  tomato: TomatoState;
  onComplete: (id: number, targetSpot: DamageSpot) => void;
}

export interface QRCodeMeshProps {
  matrix: number[][];
  damageSpots: DamageSpot[];
}