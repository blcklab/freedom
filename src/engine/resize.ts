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
    begin(handle: ResizeHandle, pointer: Point, pointerEvent: PointerEvent): ResizeEventData;
    move(pointer: Point, pointerEvent: PointerEvent): ResizeMoveResult;
    end(pointer: Point, pointerEvent: PointerEvent): ResizeEventData;
}

const WEST_HANDLES: readonly ResizeHandle[] = ['nw', 'w', 'sw'];
const NORTH_HANDLES: readonly ResizeHandle[] = ['nw', 'n', 'ne'];
const VERTICAL_ONLY_HANDLES: readonly ResizeHandle[] = ['n', 's'];
const HORIZONTAL_ONLY_HANDLES: readonly ResizeHandle[] = ['e', 'w'];

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

      const width = affectsWidth
        ? (affectsWest ? startSize.width - dx : startSize.width + dx)
        : startSize.width;
      const height = affectsHeight
        ? (affectsNorth ? startSize.height - dy : startSize.height + dy)
        : startSize.height;

      const clampedWidth = clamp(width, options.minWidth, Math.max(options.minWidth, options.maxWidth));
      const clampedHeight = clamp(height, options.minHeight, Math.max(options.minHeight, options.maxHeight));

      // Keep the opposite edge visually anchored after size clamping.
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
