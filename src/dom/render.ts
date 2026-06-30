/**
 * dom/render.ts
 *
 * The ONLY functions in the library allowed to write to element.style for
 * position/size. Position is painted via `transform: translate3d(...)`
 * (compositor-only, no layout/reflow) while size uses width/height
 * (unavoidably triggers layout, but only while actively resizing).
 */

import type { Point, PositioningMode, Size } from '../core/types';

export interface BaseStyleOptions {
  positioning: PositioningMode;
  forcePositioning?: boolean;
}

export function applyBaseStyles(element: HTMLElement, options: BaseStyleOptions): void {
  const style = element.style;

  const computedPosition = window.getComputedStyle?.(element).position ?? style.position;
  if (options.forcePositioning || style.position === 'static' || (!style.position && computedPosition === 'static')) {
    style.position = options.positioning;
  }

  // All logical movement is applied through transform. Keeping top/left at 0
  // gives a stable origin and prevents stale author CSS from offsetting the
  // controlled position.
  style.top = '0px';
  style.left = '0px';

  if (!style.touchAction) style.touchAction = 'none';
  if (!style.userSelect) style.userSelect = 'none';
  if (!style.boxSizing) style.boxSizing = 'border-box';
  if (!style.willChange) style.willChange = 'transform';
}

export function writePosition(element: HTMLElement, point: Point): void {
  element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
}

export function writeSize(element: HTMLElement, size: Size): void {
  element.style.width = `${size.width}px`;
  element.style.height = `${size.height}px`;
}
