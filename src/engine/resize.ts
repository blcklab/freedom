/**
 * engine/resize.ts
 *
 * Pure interaction logic for corner resizing. The opposite edge from the
 * dragged corner is always treated as the anchor: e.g. dragging the `nw`
 * handle keeps the bottom-right corner fixed while width/height/position
 * update together. Min/max size and bounds are enforced before plugins run.
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
import { createPointerDragController, type PointerDragController } from '../core/pointer';
import { clamp } from '../core/math';
import { constrainToBounds, type SizeLimits } from './constraints';

export interface ResizeEngineOptions extends SizeLimits {
  element: HTMLElement;
  bounds: BoundsOption | undefined;
  plugins: readonly FreedomPlugin[];
  pluginContext: PluginContext;
  getPosition(): Point;
  getSize(): Size;
  onStart(data: ResizeEventData): void;
  onMove(result: { position: Point; size: Size }, data: ResizeEventData): void;
  onEnd(data: ResizeEventData): void;
}

const WEST_HANDLES: readonly ResizeHandle[] = ['nw', 'sw'];
const NORTH_HANDLES: readonly ResizeHandle[] = ['nw', 'ne'];

export function createResizeEngine(
  handleEl: HTMLElement,
  handle: ResizeHandle,
  options: ResizeEngineOptions
): PointerDragController {
  let startPointer: Point = { x: 0, y: 0 };
  let startPosition: Point = { x: 0, y: 0 };
  let startSize: Size = { width: 0, height: 0 };

  const affectsWest = WEST_HANDLES.includes(handle);
  const affectsNorth = NORTH_HANDLES.includes(handle);

  return createPointerDragController(handleEl, {
    onStart(event) {
      startPointer = { x: event.clientX, y: event.clientY };
      startPosition = options.getPosition();
      startSize = options.getSize();
      options.onStart({ size: startSize, position: startPosition, handle, pointerEvent: event });
    },

    onMove(event) {
      const dx = event.clientX - startPointer.x;
      const dy = event.clientY - startPointer.y;

      let x = startPosition.x;
      let y = startPosition.y;
      let width = affectsWest ? startSize.width - dx : startSize.width + dx;
      let height = affectsNorth ? startSize.height - dy : startSize.height + dy;

      const clampedWidth = clamp(width, options.minWidth, Math.max(options.minWidth, options.maxWidth));
      const clampedHeight = clamp(height, options.minHeight, Math.max(options.minHeight, options.maxHeight));

      // Re-anchor the opposite edge whenever clamping changed the size,
      // so the corner that ISN'T being dragged never visually moves.
      if (affectsWest) x = startPosition.x + (startSize.width - clampedWidth);
      if (affectsNorth) y = startPosition.y + (startSize.height - clampedHeight);

      let nextSize: Size = { width: clampedWidth, height: clampedHeight };
      let nextPosition: Point = constrainToBounds({ x, y }, nextSize, options.bounds, options.element);

      for (const plugin of options.plugins) {
        if (!plugin.onResize) continue;
        const result = plugin.onResize(
          { size: nextSize, position: nextPosition, handle, pointerEvent: event },
          options.pluginContext
        );
        if (result) {
          nextSize = result.size;
          nextPosition = result.position;
        }
      }

      options.onMove(
        { position: nextPosition, size: nextSize },
        { size: nextSize, position: nextPosition, handle, pointerEvent: event }
      );
    },

    onEnd(event) {
      options.onEnd({
        size: options.getSize(),
        position: options.getPosition(),
        handle,
        pointerEvent: event,
      });
    },
  });
}
