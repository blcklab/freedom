import type { Point, PositioningMode, Size } from '../core/types';

export interface BaseStyleOptions {
  positioning: PositioningMode;
  forcePositioning?: boolean;
}

export interface PositionRenderer {
    positioning: PositioningMode;
    origin: Point;
    baseTransform: string;
    flowRelative: boolean;
}

export function applyBaseStyles(element: HTMLElement, options: BaseStyleOptions): void {
  const style = element.style;
  const computedPosition = window.getComputedStyle?.(element).position ?? style.position;

  if (options.forcePositioning || computedPosition === 'static') {
    style.position = options.positioning;
  }

  if (!style.touchAction) style.touchAction = 'none';
  if (!style.userSelect) style.userSelect = 'none';
  if (!style.boxSizing) style.boxSizing = 'border-box';
  if (!style.willChange) style.willChange = 'transform';
}

export function readRenderedPosition(element: HTMLElement, positioning: PositioningMode): Point {
  const rect = element.getBoundingClientRect();

  if (positioning === 'fixed') {
    return { x: rect.left || 0, y: rect.top || 0 };
  }

  if (positioning === 'absolute') {
    const parent = element.offsetParent as HTMLElement | null;

    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      return {
        x: (rect.left || 0) - (parentRect.left || 0) + (parent.scrollLeft || 0),
        y: (rect.top || 0) - (parentRect.top || 0) + (parent.scrollTop || 0),
      };
    }

    return {
      x: (rect.left || 0) + (window.scrollX || 0),
      y: (rect.top || 0) + (window.scrollY || 0),
    };
  }

  // Normal-flow windows move relative to their original rendered position.
  return { x: rect.left || 0, y: rect.top || 0 };
}

export function createPositionRenderer(
  element: HTMLElement,
  positioning: PositioningMode,
  initialPosition: Point
): PositionRenderer {
  const baseTransform = normalizeTransform(element.style.transform);

  if (positioning === 'relative') {
    return {
      positioning,
      origin: readRenderedPosition(element, positioning),
      baseTransform,
      flowRelative: true,
    };
  }

  // Normalize right/bottom anchored CSS to left/top once for stable resizing.
  element.style.left = `${initialPosition.x}px`;
  element.style.top = `${initialPosition.y}px`;
  element.style.right = 'auto';
  element.style.bottom = 'auto';

  return {
    positioning,
    origin: { ...initialPosition },
    baseTransform: '',
    flowRelative: false,
  };
}

export function writePosition(element: HTMLElement, point: Point, renderer: PositionRenderer): void {
  const dx = point.x - renderer.origin.x;
  const dy = point.y - renderer.origin.y;
  const translate = dx === 0 && dy === 0 ? '' : `translate3d(${dx}px, ${dy}px, 0)`;
  element.style.transform = joinTransforms(renderer.baseTransform, translate);
}

export function writeSize(element: HTMLElement, size: Size): void {
  element.style.width = `${size.width}px`;
  element.style.height = `${size.height}px`;
}

function normalizeTransform(value: string | undefined): string {
  if (!value || value === 'none') return '';
  return value.trim();
}

function joinTransforms(base: string, translate: string): string {
  if (base && translate) return `${base} ${translate}`;
  if (base) return base;
  return translate;
}
