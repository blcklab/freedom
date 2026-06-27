/**
 * engine/drag.ts
 *
 * Pure interaction logic for dragging: converts raw pointer movement into
 * a next `Point`, applying bounds and plugin transforms in order. Contains
 * no DOM writes — the caller (runtime/window.ts) decides how/when to paint.
 */

import type {
  BoundsOption,
  DragEventData,
  FreedomPlugin,
  Point,
  PluginContext,
  Size,
} from '../core/types';
import { createPointerDragController, type PointerDragController } from '../core/pointer';
import { constrainToBounds } from './constraints';

export interface DragEngineOptions {
  element: HTMLElement;
  bounds: BoundsOption | undefined;
  plugins: readonly FreedomPlugin[];
  pluginContext: PluginContext;
  getPosition(): Point;
  getSize(): Size;
  onStart(data: DragEventData): void;
  onMove(next: Point, data: DragEventData): void;
  onEnd(data: DragEventData): void;
}

export function createDragEngine(
  handle: HTMLElement,
  options: DragEngineOptions
): PointerDragController {
  let startPointer: Point = { x: 0, y: 0 };
  let startPosition: Point = { x: 0, y: 0 };

  return createPointerDragController(handle, {
    onStart(event) {
      startPointer = { x: event.clientX, y: event.clientY };
      startPosition = options.getPosition();
      options.onStart({ position: startPosition, delta: { x: 0, y: 0 }, pointerEvent: event });
    },

    onMove(event) {
      const delta: Point = {
        x: event.clientX - startPointer.x,
        y: event.clientY - startPointer.y,
      };

      let next: Point = { x: startPosition.x + delta.x, y: startPosition.y + delta.y };
      next = constrainToBounds(next, options.getSize(), options.bounds, options.element);

      for (const plugin of options.plugins) {
        if (!plugin.onDrag) continue;
        const result = plugin.onDrag(
          { position: next, delta, pointerEvent: event },
          options.pluginContext
        );
        if (result) next = result;
      }

      options.onMove(next, { position: next, delta, pointerEvent: event });
    },

    onEnd(event) {
      const delta: Point = {
        x: event.clientX - startPointer.x,
        y: event.clientY - startPointer.y,
      };
      options.onEnd({ position: options.getPosition(), delta, pointerEvent: event });
    },
  });
}
