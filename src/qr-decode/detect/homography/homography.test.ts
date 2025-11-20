import { describe, it, expect } from 'vitest';
import { calculateEdgeProjections, findFourthCorner } from './edgeProjection';

describe('Edge Projection', () => {
  // Create a synthetic image with a square (QR code like)
  const width = 100;
  const height = 100;
  const imageData = new Uint8Array(width * height);

  // Draw a white square on black background
  // P1(20,20), P2(80,20), P3(20,80), P4(80,80)
  for (let y = 20; y <= 80; y++) {
    for (let x = 20; x <= 80; x++) {
      imageData[y * width + x] = 255;
    }
  }

  it('should calculate edge projections correctly', () => {
    const p1 = { x: 20, y: 20 };
    const p2 = { x: 80, y: 20 };
    const p3 = { x: 20, y: 80 };
    const p4 = { x: 80, y: 80 };

    const result = calculateEdgeProjections(
      imageData,
      width,
      height,
      p1,
      p2,
      p3,
      p4
    );

    expect(result.horizontalScore).toBeGreaterThan(0);
    expect(result.verticalScore).toBeGreaterThan(0);
  });

  it('should find the correct 4th corner', async () => {
    const p1 = { x: 20, y: 20 };
    const p2 = { x: 80, y: 20 };
    const p3 = { x: 20, y: 80 };
    
    // Initial guess is slightly off
    const initialP4 = { x: 85, y: 85 };
    const expectedP4 = { x: 80, y: 80 };
    const moduleSize = 2;

    const { bestP4: foundP4 } = await findFourthCorner(
      imageData,
      width,
      height,
      p1,
      p2,
      p3,
      initialP4,
      moduleSize
    );

    // Should be closer to expected P4 than initial guess
    const distInitial = Math.sqrt(Math.pow(initialP4.x - expectedP4.x, 2) + Math.pow(initialP4.y - expectedP4.y, 2));
    const distFound = Math.sqrt(Math.pow(foundP4.x - expectedP4.x, 2) + Math.pow(foundP4.y - expectedP4.y, 2));

    expect(distFound).toBeLessThan(distInitial);
    // Allow small error margin due to discrete pixel grid
    expect(Math.abs(foundP4.x - expectedP4.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(foundP4.y - expectedP4.y)).toBeLessThanOrEqual(2);
  });
});
