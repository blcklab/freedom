/**
 * dom/handles.ts
 *
 * Creates invisible resize hit-targets around a window's perimeter. Visual
 * styling is intentionally minimal; consumers can skin the classes if they
 * want visible handles.
 */

import type { ResizeHandle } from '../core/types';

const CORNER_SIZE_PX = 14;
const EDGE_THICKNESS_PX = 8;

const EDGE_STYLES: Record<ResizeHandle, Partial<CSSStyleDeclaration>> = {
  nw: { top: '0', left: '0', width: `${CORNER_SIZE_PX}px`, height: `${CORNER_SIZE_PX}px`, cursor: 'nwse-resize' },
  ne: { top: '0', right: '0', width: `${CORNER_SIZE_PX}px`, height: `${CORNER_SIZE_PX}px`, cursor: 'nesw-resize' },
  sw: { bottom: '0', left: '0', width: `${CORNER_SIZE_PX}px`, height: `${CORNER_SIZE_PX}px`, cursor: 'nesw-resize' },
  se: { bottom: '0', right: '0', width: `${CORNER_SIZE_PX}px`, height: `${CORNER_SIZE_PX}px`, cursor: 'nwse-resize' },

  n: { top: '0', left: `${CORNER_SIZE_PX}px`, right: `${CORNER_SIZE_PX}px`, height: `${EDGE_THICKNESS_PX}px`, cursor: 'ns-resize' },
  s: { bottom: '0', left: `${CORNER_SIZE_PX}px`, right: `${CORNER_SIZE_PX}px`, height: `${EDGE_THICKNESS_PX}px`, cursor: 'ns-resize' },
  e: { right: '0', top: `${CORNER_SIZE_PX}px`, bottom: `${CORNER_SIZE_PX}px`, width: `${EDGE_THICKNESS_PX}px`, cursor: 'ew-resize' },
  w: { left: '0', top: `${CORNER_SIZE_PX}px`, bottom: `${CORNER_SIZE_PX}px`, width: `${EDGE_THICKNESS_PX}px`, cursor: 'ew-resize' },
};

export function createResizeHandle(handle: ResizeHandle): HTMLElement {
  const el = document.createElement('div');
  el.dataset.freedomResizeHandle = handle;
  el.className = `freedom-resize-handle freedom-resize-handle--${handle}`;

  Object.assign(el.style, {
    position: 'absolute',
    boxSizing: 'border-box',
    touchAction: 'none',
    userSelect: 'none',
    pointerEvents: 'auto',
    zIndex: '1',
    ...EDGE_STYLES[handle],
  });

  return el;
}
