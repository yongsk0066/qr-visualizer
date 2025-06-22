import type { DamageSpot } from './types';
import { FINDER_PATTERN_CORE_SIZE } from './constants';

// Check if position is in allowed area (avoiding only finder patterns)
export const isInAllowedArea = (row: number, col: number, size: number): boolean => {
  const finderCore = FINDER_PATTERN_CORE_SIZE;
  
  // Check if in top-left finder pattern core
  if (row < finderCore && col < finderCore) return false;
  
  // Check if in top-right finder pattern core
  if (row < finderCore && col >= size - finderCore) return false;
  
  // Check if in bottom-left finder pattern core
  if (row >= size - finderCore && col < finderCore) return false;
  
  // 나머지 모든 영역 허용 (데이터 영역, 타이밍 패턴, 얼라인먼트 패턴 등)
  return true;
};

// Convert 3D coordinates to 2D canvas coordinates
export const convert3DToCanvasCoords = (
  x: number, 
  y: number, 
  matrixSize: number, 
  scale: number
): { x: number; y: number } => {
  const canvasSize = matrixSize * scale;
  const conversionRatio = canvasSize / 2; // Box is 2x2
  
  return {
    x: x * conversionRatio,
    y: -y * conversionRatio // Y축 반전
  };
};

// Create random damage spot
export const createDamageSpot = (
  targetX: number,
  targetY: number,
  matrixSize: number,
  scale: number,
  sizeConfig: { base: number; random: number },
  opacityConfig: { base: number; random: number }
): DamageSpot => {
  const coords = convert3DToCanvasCoords(targetX, targetY, matrixSize, scale);
  
  return {
    x: coords.x,
    y: coords.y,
    size: sizeConfig.base + Math.random() * sizeConfig.random,
    opacity: opacityConfig.base + Math.random() * opacityConfig.random
  };
};

// Generate random position within circle
export const getRandomPositionInCircle = (radius: number): { x: number; y: number } => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radius; // sqrt for uniform distribution
  
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
};