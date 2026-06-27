/**
 * dom/handles.ts
 *
 * Creates the small invisible hit-targets placed at each corner. Visual
 * styling is intentionally minimal (transparent, cursor-only) — consumers
 * are expected to skin `.freedom-resize-handle` themselves, or rely on the
 * default cursor affordance alone.
 */

import type { ResizeHandle } from '../core/types';

const HANDLE_SIZE_PX = 14;

const EDGE_STYLES: Record<ResizeHandle, Partial<CSSStyleDeclaration>> = {
  nw: { top: '0', left: '0', cursor: 'nwse-resize' },
  ne: { top: '0', right: '0', cursor: 'nesw-resize' },
  sw: { bottom: '0', left: '0', cursor: 'nesw-resize' },
  se: { bottom: '0', right: '0', cursor: 'nwse-resize' },
};

export function createResizeHandle(handle: ResizeHandle): HTMLElement {
  const el = document.createElement('div');
  el.dataset.freedomResizeHandle = handle;
  el.className = `freedom-resize-handle freedom-resize-handle--${handle}`;

  Object.assign(el.style, {
    position: 'absolute',
    width: `${HANDLE_SIZE_PX}px`,
    height: `${HANDLE_SIZE_PX}px`,
    touchAction: 'none',
    zIndex: '1',
    ...EDGE_STYLES[handle],
  });

  return el;
}
