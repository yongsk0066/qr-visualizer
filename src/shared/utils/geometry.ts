/**
 * Geometry utility functions
 */

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  p1: Point;
  p2: Point;
}

/**
 * Calculate the intersection point of two lines
 * @returns The intersection point or null if lines are parallel
 */
export function calculateLineIntersection(line1: Line, line2: Line): Point | null {
  const x1 = line1.p1.x;
  const y1 = line1.p1.y;
  const x2 = line1.p2.x;
  const y2 = line1.p2.y;
  const x3 = line2.p1.x;
  const y3 = line2.p1.y;
  const x4 = line2.p2.x;
  const y4 = line2.p2.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return null; // Parallel lines

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Calculate the center point of multiple points
 */
export function calculateCenter(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

/**
 * Scale points from a center point by a given factor
 */
export function scaleFromCenter(points: Point[], center: Point, scale: number): Point[] {
  return points.map(point => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale,
  }));
}