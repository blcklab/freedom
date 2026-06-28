/**
 * dom/handles.ts
 *
 * Creates the small invisible hit-targets placed at each corner. Visual
 * styling is intentionally minimal (transparent, cursor-only) — consumers
 * are expected to skin `.freedom-resize-handle` themselves, or rely on the
 * default cursor affordance alone.
 */

/**
 * dom/handles.ts
 *
 * Creates the invisible hit-targets around a window's perimeter: a small
 * square at each of the 4 corners (diagonal resize) plus a thin strip
 * along each of the 4 edges (single-axis resize), tiled so they cover the
 * full border with no gaps and no overlap. Everything inside that border
 * is left uncovered, so it remains a normal drag target.
 *
 * Visual styling is intentionally minimal (transparent, cursor-only) —
 * consumers are expected to skin `.freedom-resize-handle` themselves, or
 * rely on the default cursor affordance alone.
 */

import type { ResizeHandle } from '../core/types';

const CORNER_SIZE_PX = 14;
const EDGE_THICKNESS_PX = 8;

// Edges are inset by CORNER_SIZE_PX on their long axis so they start
// exactly where the adjacent corners end — no dead zone, no double cover.
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
    touchAction: 'none',
    zIndex: '1',
    ...EDGE_STYLES[handle],
  });

  return el;
}