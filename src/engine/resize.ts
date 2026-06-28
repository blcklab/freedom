/**
 * engine/resize.ts
 *
 * Pure interaction logic for corner resizing. The opposite edge from the
 * dragged corner is always treated as the anchor: e.g. dragging the `nw`
 * handle keeps the bottom-right corner fixed while width/height/position
 * update together. Min/max size and bounds are enforced before plugins run.
 *
 * No DOM listeners, no pointer capture — one shared engine instance now
 * serves all four corners; `begin()` takes the handle for that gesture.
 */

/**
 * engine/resize.ts
 *
 * Pure interaction logic for resizing from any of 8 handles: 4 corners
 * (diagonal — both width and height change together) and 4 edges
 * (single-axis — only width OR only height changes). For corner/edge
 * combinations that touch the west or north edge, that edge is always
 * treated as the anchor: e.g. dragging `nw` or plain `w` keeps the
 * right edge fixed while the left edge (and width/position) move.
 * Min/max size and bounds are enforced before plugins run.
 *
 * No DOM listeners, no pointer capture — one shared engine instance
 * serves all 8 handles; `begin()` takes the handle for that gesture.
 */

import type {
  BoundsOption,
  FreedomPlugin,
  Point,
  PluginContext,
  ResizeEventData,
  ResizeHandle,
  Size,
} from '../core/types';
import { clamp } from '../core/math';
import { constrainToBounds, type SizeLimits } from './constraints';

export interface ResizeEngineOptions extends SizeLimits {
  element: HTMLElement;
  bounds: BoundsOption | undefined;
  plugins: readonly FreedomPlugin[];
  pluginContext: PluginContext;
  getPosition(): Point;
  getSize(): Size;
}

export interface ResizeMoveResult {
  position: Point;
  size: Size;
  data: ResizeEventData;
}

export interface ResizeEngine {
  /** Call once, on pointerdown on a resize handle, before any move(). */
  begin(handle: ResizeHandle, pointer: Point, pointerEvent: PointerEvent): ResizeEventData;
  /** Call on every pointermove while resizing. */
  move(pointer: Point, pointerEvent: PointerEvent): ResizeMoveResult;
  /** Call once, on pointerup/pointercancel. */
  end(pointer: Point, pointerEvent: PointerEvent): ResizeEventData;
}

// A handle's *anchor* (which edge stays fixed) and its *axis* (which
// dimension(s) it's allowed to touch) are independent properties.
const WEST_HANDLES: readonly ResizeHandle[] = ['nw', 'w', 'sw'];
const NORTH_HANDLES: readonly ResizeHandle[] = ['nw', 'n', 'ne'];
const VERTICAL_ONLY_HANDLES: readonly ResizeHandle[] = ['n', 's']; // height changes, width fixed
const HORIZONTAL_ONLY_HANDLES: readonly ResizeHandle[] = ['e', 'w']; // width changes, height fixed

export function createResizeEngine(options: ResizeEngineOptions): ResizeEngine {
  let activeHandle: ResizeHandle = 'se';
  let startPointer: Point = { x: 0, y: 0 };
  let startPosition: Point = { x: 0, y: 0 };
  let startSize: Size = { width: 0, height: 0 };
  let affectsWest = false;
  let affectsNorth = false;
  let affectsWidth = true;
  let affectsHeight = true;

  return {
    begin(handle, pointer, pointerEvent) {
      activeHandle = handle;
      affectsWest = WEST_HANDLES.includes(handle);
      affectsNorth = NORTH_HANDLES.includes(handle);
      affectsWidth = !VERTICAL_ONLY_HANDLES.includes(handle);
      affectsHeight = !HORIZONTAL_ONLY_HANDLES.includes(handle);
      startPointer = pointer;
      startPosition = options.getPosition();
      startSize = options.getSize();
      return { size: startSize, position: startPosition, handle, pointerEvent };
    },

    move(pointer, pointerEvent) {
      const dx = pointer.x - startPointer.x;
      const dy = pointer.y - startPointer.y;

      let x = startPosition.x;
      let y = startPosition.y;

      // Edge handles (n/s/e/w) leave the perpendicular axis untouched —
      // this is what was missing before: every handle changed both
      // dimensions, so there was no way to resize width-only or
      // height-only, and the plain edges had no handle at all to catch
      // the pointerdown (it fell through to drag instead).
      const width = affectsWidth
        ? (affectsWest ? startSize.width - dx : startSize.width + dx)
        : startSize.width;
      const height = affectsHeight
        ? (affectsNorth ? startSize.height - dy : startSize.height + dy)
        : startSize.height;

      const clampedWidth = clamp(width, options.minWidth, Math.max(options.minWidth, options.maxWidth));
      const clampedHeight = clamp(height, options.minHeight, Math.max(options.minHeight, options.maxHeight));

      // Re-anchor the opposite edge whenever clamping changed the size,
      // so the edge that ISN'T being dragged never visually moves.
      if (affectsWest) x = startPosition.x + (startSize.width - clampedWidth);
      if (affectsNorth) y = startPosition.y + (startSize.height - clampedHeight);

      let nextSize: Size = { width: clampedWidth, height: clampedHeight };
      let nextPosition: Point = constrainToBounds({ x, y }, nextSize, options.bounds, options.element);

      for (const plugin of options.plugins) {
        if (!plugin.onResize) continue;
        const result = plugin.onResize(
          { size: nextSize, position: nextPosition, handle: activeHandle, pointerEvent },
          options.pluginContext
        );
        if (result) {
          nextSize = result.size;
          nextPosition = result.position;
        }
      }

      return {
        position: nextPosition,
        size: nextSize,
        data: { size: nextSize, position: nextPosition, handle: activeHandle, pointerEvent },
      };
    },

    end(pointer, pointerEvent) {
      return {
        size: options.getSize(),
        position: options.getPosition(),
        handle: activeHandle,
        pointerEvent,
      };
    },
  };
}