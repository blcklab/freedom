/**
 * dom/render.ts
 *
 * The ONLY functions in the library allowed to write to element.style for
 * position/size. Position is painted via `transform: translate3d(...)`
 * (compositor-only, no layout/reflow) while size uses width/height
 * (unavoidably triggers layout, but only while actively resizing).
 */

import type { Point, Size } from '../core/types';

export function applyBaseStyles(element: HTMLElement): void {
  const style = element.style;
  if (!style.position || style.position === 'static') {
    style.position = 'absolute';
  }
  style.top = '0px';
  style.left = '0px';
  style.touchAction = 'none'; // prevent the browser from scrolling/zooming on drag
  style.willChange = 'transform';
  if (!style.boxSizing) style.boxSizing = 'border-box';
}

export function writePosition(element: HTMLElement, point: Point): void {
  element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
}

export function writeSize(element: HTMLElement, size: Size): void {
  element.style.width = `${size.width}px`;
  element.style.height = `${size.height}px`;
}
