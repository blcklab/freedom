/**
 * engine/constraints.ts
 *
 * Resolves a `BoundsOption` (which may reference live DOM state, like the
 * viewport or an offsetParent) into a concrete `Bounds` box, and re-exports
 * the pure clamping helpers used by both engines.
 */

import type { Bounds, BoundsOption, Point, Size } from '../core/types';
import { clampPointToBounds, clampSize, type SizeLimits } from '../core/math';

export { clampPointToBounds, clampSize };
export type { SizeLimits };

export function resolveBounds(
  option: BoundsOption | undefined,
  element: HTMLElement
): Bounds | null {
  if (!option || option === 'none') return null;

  if (option === 'viewport') {
    return { minX: 0, minY: 0, maxX: window.innerWidth, maxY: window.innerHeight };
  }

  if (option === 'parent') {
    const parent = element.offsetParent as HTMLElement | null;
    if (!parent) return null;
    return { minX: 0, minY: 0, maxX: parent.clientWidth, maxY: parent.clientHeight };
  }

  // Explicit Rect supplied by the caller.
  return {
    minX: option.x,
    minY: option.y,
    maxX: option.x + option.width,
    maxY: option.y + option.height,
  };
}

/** Convenience used by the resize engine: clamp position given a size. */
export function constrainToBounds(
  point: Point,
  size: Size,
  option: BoundsOption | undefined,
  element: HTMLElement
): Point {
  const bounds = resolveBounds(option, element);
  return bounds ? clampPointToBounds(point, size, bounds) : point;
}
