/**
 * engine/drag.ts
 *
 * Pure interaction logic for dragging: converts raw pointer movement into
 * a next `Point`, applying bounds and plugin transforms in order. Contains
 * no DOM writes and no DOM listeners — it's driven entirely by
 * InteractionManager, which feeds it pointer coordinates and consumes the
 * geometry it calculates back. begin()/move()/end() map 1:1 onto
 * pointerdown/pointermove/pointerup.
 */

import type {
  BoundsOption,
  DragEventData,
  FreedomPlugin,
  Point,
  PluginContext,
  Size,
} from '../core/types';
import { constrainToBounds } from './constraints';

export interface DragEngineOptions {
  element: HTMLElement;
  bounds: BoundsOption | undefined;
  plugins: readonly FreedomPlugin[];
  pluginContext: PluginContext;
  getPosition(): Point;
  getSize(): Size;
}

export interface DragMoveResult {
  position: Point;
  data: DragEventData;
}

export interface DragEngine {
  /** Call once, on pointerdown, before any move(). Returns the dragstart payload. */
  begin(pointer: Point, pointerEvent: PointerEvent): DragEventData;
  /** Call on every pointermove while dragging. */
  move(pointer: Point, pointerEvent: PointerEvent): DragMoveResult;
  /** Call once, on pointerup/pointercancel. Returns the dragend payload. */
  end(pointer: Point, pointerEvent: PointerEvent): DragEventData;
}

export function createDragEngine(options: DragEngineOptions): DragEngine {
  let startPointer: Point = { x: 0, y: 0 };
  let startPosition: Point = { x: 0, y: 0 };

  return {
    begin(pointer, pointerEvent) {
      startPointer = pointer;
      startPosition = options.getPosition();
      return { position: startPosition, delta: { x: 0, y: 0 }, pointerEvent };
    },

    move(pointer, pointerEvent) {
      const delta: Point = {
        x: pointer.x - startPointer.x,
        y: pointer.y - startPointer.y,
      };

      let next: Point = { x: startPosition.x + delta.x, y: startPosition.y + delta.y };
      next = constrainToBounds(next, options.getSize(), options.bounds, options.element);

      for (const plugin of options.plugins) {
        if (!plugin.onDrag) continue;
        const result = plugin.onDrag(
          { position: next, delta, pointerEvent },
          options.pluginContext
        );
        if (result) next = result;
      }

      return { position: next, data: { position: next, delta, pointerEvent } };
    },

    end(pointer, pointerEvent) {
      const delta: Point = {
        x: pointer.x - startPointer.x,
        y: pointer.y - startPointer.y,
      };
      return { position: options.getPosition(), delta, pointerEvent };
    },
  };
}
