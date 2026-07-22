import type { Bounds, BoundsInput, BoundsOption, Point, Rect, Size } from '../core/types';
import { clampPointToBounds, clampSize, type SizeLimits } from '../core/math';

export { clampPointToBounds, clampSize };
export type { SizeLimits };

export function resolveBounds(
  option: BoundsOption | undefined,
  element: HTMLElement
): Bounds | null {
  const resolved = resolveBoundsInput(option);
  if (!resolved || resolved === 'none') return null;

  if (resolved === 'viewport') {
    return { minX: 0, minY: 0, maxX: window.innerWidth, maxY: window.innerHeight };
  }

  if (resolved === 'parent') {
    const parent = element.offsetParent as HTMLElement | null;
    if (!parent) return null;
    return { minX: 0, minY: 0, maxX: parent.clientWidth, maxY: parent.clientHeight };
  }

  const rect = isHTMLElementLike(resolved) ? readElementRect(resolved, element) : resolved;

  return {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height,
  };
}

export function constrainToBounds(
  point: Point,
  size: Size,
  option: BoundsOption | undefined,
  element: HTMLElement
): Point {
  const bounds = resolveBounds(option, element);
  return bounds ? clampPointToBounds(point, size, bounds) : point;
}

function resolveBoundsInput(option: BoundsOption | undefined): BoundsInput | null | undefined {
  let current: BoundsOption | null | undefined = option;

  for (let i = 0; i < 5 && typeof current === 'function'; i += 1) {
    current = current();
  }

  return typeof current === 'function' ? null : current;
}

function isHTMLElementLike(value: unknown): value is HTMLElement {
  return !!value && typeof value === 'object' && typeof (value as HTMLElement).getBoundingClientRect === 'function';
}

function readElementRect(target: HTMLElement, element: HTMLElement): Rect {
  const rect = target.getBoundingClientRect();
  const computed = window.getComputedStyle(element);

  if (computed.position === 'absolute') {
    const parent = element.offsetParent as HTMLElement | null;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      return {
        x: rect.left - parentRect.left + (parent.scrollLeft || 0),
        y: rect.top - parentRect.top + (parent.scrollTop || 0),
        width: rect.width,
        height: rect.height,
      };
    }
  }

  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}
