import { useRef, useEffect } from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import type { QRCodeMeshProps } from './types';
import { isInAllowedArea } from './utils';
import {
  QR_MODULE_SCALE,
  QR_QUIET_ZONE,
  QR_BOX_SIZE,
  DAMAGE_SPOT_RENDER_SCALE,
  DAMAGE_GRADIENT_COLORS
} from './constants';

export function QRCodeMesh({ matrix, damageSpots }: QRCodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  
  const scale = QR_MODULE_SCALE;
  const quietZone = QR_QUIET_ZONE * scale;

  useEffect(() => {
    if (!matrix || matrix.length === 0) return;

    const size = matrix.length;
    const canvas = document.createElement('canvas');
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Render original QR code
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (matrix[row][col] === 1) {
          ctx.fillStyle = 'black';
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    }
    
    // Apply damage spots (only in center area)
    damageSpots.forEach((spot) => {
      const canvasX = spot.x + canvas.width / 2;
      const canvasY = spot.y + canvas.height / 2;
      const matrixRow = Math.floor(canvasY / scale); // 좌표 변환 단순화
      const matrixCol = Math.floor(canvasX / scale);
      
      // 경계 체크와 Finder pattern만 피하는 관대한 영역 체크
      if (matrixRow >= 0 && matrixRow < size && matrixCol >= 0 && matrixCol < size && 
          isInAllowedArea(matrixRow, matrixCol, size)) {
        const gradient = ctx.createRadialGradient(canvasX, canvasY, 0, canvasX, canvasY, spot.size);
        
        DAMAGE_GRADIENT_COLORS.forEach(({ stop, color }) => {
          const opacity = stop === 1 ? 0 : spot.opacity * (1 - stop * 0.5);
          gradient.addColorStop(stop, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`);
        });
        
        ctx.fillStyle = gradient;
        const renderSize = spot.size * DAMAGE_SPOT_RENDER_SCALE;
        ctx.fillRect(canvasX - renderSize, canvasY - renderSize, renderSize * 2, renderSize * 2);
      }
    });

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
  }, [matrix, damageSpots, scale, quietZone]);

  return (
    <Box ref={meshRef} args={[...QR_BOX_SIZE]} position={[0, 0, 0]}>
      <meshBasicMaterial side={THREE.DoubleSide} />
    </Box>
  );
}