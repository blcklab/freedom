/**
 * plugins/snap.ts
 *
 * Reference plugin: snaps a window's edges to the viewport and/or to a
 * caller-supplied list of target rects (e.g. other windows' current
 * bounds) whenever it comes within `threshold` pixels during a drag.
 *
 * This is intentionally the *only* built-in plugin — it doubles as the
 * template for anyone writing their own (grid-snap, edge-tiling, etc.).
 * Plugins only ever see/return geometry; they never touch the DOM.
 */

import type { FreedomPlugin, Rect } from '../core/types';

export interface SnapPluginOptions {
  /** Distance in pixels within which an edge snaps. Default: 8. */
  threshold?: number;
  /** Snap to the browser viewport edges. Default: true. */
  snapToViewport?: boolean;
  /** Lazily supplies additional rects to snap against (e.g. sibling windows). */
  getSnapTargets?(): Rect[];
}

export function snapPlugin(options: SnapPluginOptions = {}): FreedomPlugin {
  const threshold = options.threshold ?? 8;
  const snapToViewport = options.snapToViewport ?? true;

  return {
    name: 'freedom-snap',

    onDrag(data, ctx) {
      const size = ctx.window.getSize();
      let { x, y } = data.position;

      const targets: Rect[] = [];
      if (snapToViewport && typeof window !== 'undefined') {
        targets.push({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
      }
      if (options.getSnapTargets) targets.push(...options.getSnapTargets());

      for (const target of targets) {
        if (Math.abs(x - target.x) <= threshold) x = target.x;
        if (Math.abs(x + size.width - (target.x + target.width)) <= threshold) {
          x = target.x + target.width - size.width;
        }
        if (Math.abs(y - target.y) <= threshold) y = target.y;
        if (Math.abs(y + size.height - (target.y + target.height)) <= threshold) {
          y = target.y + target.height - size.height;
        }
      }

      return { x, y };
    },
  };
}
