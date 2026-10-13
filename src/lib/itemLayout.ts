export type Point = { x: number; y: number };
export type ItemLayout = { width: number; height: number };
const edgeGap = 16;

export function clampPosition(point: Point, size: number, layout: ItemLayout): Point {
  return {
    x: Math.max(-layout.width / 2 + edgeGap, Math.min(layout.width / 2 - size - edgeGap, point.x)),
    y: Math.max(edgeGap, Math.min(layout.height - size - edgeGap, point.y)),
  };
}

export function isMargin(point: Point, size: number, layout: ItemLayout): boolean {
  const columnHalfWidth = Math.min(680, layout.width - 32) / 2;
  return point.x >= columnHalfWidth || point.x + size <= -columnHalfWidth;
}
