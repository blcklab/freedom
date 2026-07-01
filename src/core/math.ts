/**
 *
 * Pure mathematical numeric helpers. No DOM access.
 */

import type { Bounds, Point, Size } from './types';

export function clamp(value: number, min: number, max: number): number {
  if (min > max) return min; // degenerate bounds: never produce NaN/garbage
  return Math.min(Math.max(value, min), max);
}

export interface SizeLimits {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

export function clampSize(size: Size, limits: SizeLimits): Size {
  return {
    width: clamp(size.width, limits.minWidth, Math.max(limits.minWidth, limits.maxWidth)),
    height: clamp(size.height, limits.minHeight, Math.max(limits.minHeight, limits.maxHeight)),
  };
}

/**
 * Clamps a position so that the full rect (position + size) stays inside
 * `bounds`. If the rect is larger than the bounds, it is pinned to the
 * min edge rather than producing a negative-width allowance.
 */
export function clampPointToBounds(point: Point, size: Size, bounds: Bounds): Point {
  const maxX = Math.max(bounds.minX, bounds.maxX - size.width);
  const maxY = Math.max(bounds.minY, bounds.maxY - size.height);
  return {
    x: clamp(point.x, bounds.minX, maxX),
    y: clamp(point.y, bounds.minY, maxY),
  };
}
