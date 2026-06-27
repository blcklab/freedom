/**
 * runtime/window.ts
 *
 * The composition root for a single window: owns the authoritative state
 * (position/size/zIndex/focus), wires the drag/resize engines to the DOM,
 * batches paints through the frame scheduler, and exposes the public
 * FreedomWindow API. This is the only place in the library where the SSR
 * guard lives — every other module assumes a browser environment because
 * it is only ever reached through this function.
 */

import type {
  DragEventData,
  FreedomPlugin,
  FreedomWindow,
  FreedomWindowOptions,
  Point,
  PluginContext,
  ResizeEventData,
  ResizeHandle,
  Size,
  WindowEventMap,
} from '../core/types';
import { Emitter } from '../core/events';
import { clampSize, type SizeLimits } from '../core/math';
import { createDragEngine } from '../engine/drag';
import { createResizeEngine } from '../engine/resize';
import type { PointerDragController } from '../core/pointer';
import { applyBaseStyles, writePosition, writeSize } from '../dom/render';
import { createResizeHandle } from '../dom/handles';
import { createFrameScheduler } from '../dom/scheduler';

const ALL_HANDLES: readonly ResizeHandle[] = ['nw', 'ne', 'sw', 'se'];

let autoId = 0;

export function createWindow(element: HTMLElement, options: FreedomWindowOptions = {}): FreedomWindow {
  if (typeof document === 'undefined') {
    throw new Error('freedom.window() requires a browser environment (document is undefined).');
  }

  const id = options.id ?? `freedom-window-${++autoId}`;
  const emitter = new Emitter<WindowEventMap>();
  const plugins: readonly FreedomPlugin[] = options.plugins ?? [];

  const limits: SizeLimits = {
    minWidth: options.minWidth ?? 0,
    minHeight: options.minHeight ?? 0,
    maxWidth: options.maxWidth ?? Infinity,
    maxHeight: options.maxHeight ?? Infinity,
  };

  // ---- authoritative state -------------------------------------------------
  let position: Point = options.initialPosition ?? readInitialPosition(element);
  let size: Size = clampSize(options.initialSize ?? readInitialSize(element), limits);
  let zIndex = options.zIndex ?? 0;
  let focused = false;
  let isDraggable = options.draggable ?? true;
  let isDestroyed = false;

  applyBaseStyles(element);
  writePosition(element, position);
  writeSize(element, size);
  if (zIndex) element.style.zIndex = String(zIndex);

  // ---- batched painting ------------------------------------------------------
  let pendingPosition: Point | null = null;
  let pendingSize: Size | null = null;

  const scheduler = createFrameScheduler(() => {
    if (pendingPosition) {
      writePosition(element, pendingPosition);
      pendingPosition = null;
    }
    if (pendingSize) {
      writeSize(element, pendingSize);
      pendingSize = null;
    }
  });

  function paint(nextPosition?: Point, nextSize?: Size): void {
    if (nextPosition) pendingPosition = nextPosition;
    if (nextSize) pendingSize = nextSize;
    scheduler.schedule();
  }

  // pluginContext.window is filled in once `api` exists (see below), but the
  // object reference is created up front so engines can close over it.
  const pluginContext: PluginContext = {
    element,
    get window(): FreedomWindow {
      return api;
    },
  };

  // ---- drag ------------------------------------------------------------------
  const dragHandleElement = resolveDragHandle(element, options.dragHandle);
  let dragController: PointerDragController | null = null;

  function setupDrag(): void {
    if (dragController || !dragHandleElement) return;
    dragController = createDragEngine(dragHandleElement, {
      element,
      bounds: options.bounds,
      plugins,
      pluginContext,
      getPosition: () => position,
      getSize: () => size,
      onStart(data: DragEventData) {
        element.classList.add('freedom-dragging');
        emitter.emit('dragstart', data);
      },
      onMove(next: Point, data: DragEventData) {
        position = next;
        paint(position);
        emitter.emit('drag', data);
      },
      onEnd(data: DragEventData) {
        element.classList.remove('freedom-dragging');
        emitter.emit('dragend', data);
      },
    });
  }

  function teardownDrag(): void {
    dragController?.destroy();
    dragController = null;
  }

  // ---- resize ------------------------------------------------------------------
  const resizeHandleElements = new Map<ResizeHandle, HTMLElement>();
  const resizeControllers = new Map<ResizeHandle, PointerDragController>();

  function setupResize(handles: readonly ResizeHandle[]): void {
    for (const handle of handles) {
      if (resizeControllers.has(handle)) continue;

      let handleEl = resizeHandleElements.get(handle);
      if (!handleEl) {
        handleEl = createResizeHandle(handle);
        element.appendChild(handleEl);
        resizeHandleElements.set(handle, handleEl);
      }

      const controller = createResizeEngine(handleEl, handle, {
        element,
        bounds: options.bounds,
        ...limits,
        plugins,
        pluginContext,
        getPosition: () => position,
        getSize: () => size,
        onStart(data: ResizeEventData) {
          element.classList.add('freedom-resizing');
          emitter.emit('resizestart', data);
        },
        onMove(result, data: ResizeEventData) {
          position = result.position;
          size = result.size;
          paint(position, size);
          emitter.emit('resize', data);
        },
        onEnd(data: ResizeEventData) {
          element.classList.remove('freedom-resizing');
          emitter.emit('resizeend', data);
        },
      });

      resizeControllers.set(handle, controller);
    }
  }

  function teardownResize(handles: readonly ResizeHandle[] = ALL_HANDLES): void {
    for (const handle of handles) {
      resizeControllers.get(handle)?.destroy();
      resizeControllers.delete(handle);

      const handleEl = resizeHandleElements.get(handle);
      if (handleEl) {
        handleEl.remove();
        resizeHandleElements.delete(handle);
      }
    }
  }

  if (isDraggable) setupDrag();
  const initialResizeHandles = resolveEnabledHandles(options.resizable ?? true);
  if (initialResizeHandles.length > 0) setupResize(initialResizeHandles);

  for (const plugin of plugins) plugin.onInit?.(pluginContext);

  // ---- public API ------------------------------------------------------------
  const api: FreedomWindow = {
    id,
    element,

    getPosition: () => ({ ...position }),
    getSize: () => ({ ...size }),

    setPosition(point: Point): void {
      position = { ...point };
      paint(position);
    },

    setSize(nextSize: Size): void {
      size = clampSize(nextSize, limits);
      paint(undefined, size);
    },

    focus(): void {
      if (focused) return;
      focused = true;
      element.classList.add('freedom-focused');
      emitter.emit('focus', undefined);
      options.onFocus?.();
    },

    blur(): void {
      if (!focused) return;
      focused = false;
      element.classList.remove('freedom-focused');
      emitter.emit('blur', undefined);
      options.onBlur?.();
    },

    isFocused: () => focused,

    setZIndex(next: number): void {
      zIndex = next;
      element.style.zIndex = String(next);
    },
    getZIndex: () => zIndex,

    enableDrag(): void {
      isDraggable = true;
      setupDrag();
    },
    disableDrag(): void {
      isDraggable = false;
      teardownDrag();
    },

    enableResize(handles: ResizeHandle[] = ALL_HANDLES as ResizeHandle[]): void {
      setupResize(handles);
    },
    disableResize(): void {
      teardownResize();
    },

    destroy(): void {
      if (isDestroyed) return;
      isDestroyed = true;
      teardownDrag();
      teardownResize();
      scheduler.cancel();
      for (const plugin of plugins) plugin.onDestroy?.(pluginContext);
      emitter.emit('destroy', undefined);
      emitter.clear();
    },

    on(event, handler) {
      return emitter.on(event, handler);
    },
  };

  // Wire convenience option callbacks onto the same emitter consumers use.
  if (options.onDragStart) api.on('dragstart', options.onDragStart);
  if (options.onDrag) api.on('drag', options.onDrag);
  if (options.onDragEnd) api.on('dragend', options.onDragEnd);
  if (options.onResizeStart) api.on('resizestart', options.onResizeStart);
  if (options.onResize) api.on('resize', options.onResize);
  if (options.onResizeEnd) api.on('resizeend', options.onResizeEnd);

  return api;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readInitialPosition(element: HTMLElement): Point {
  return { x: element.offsetLeft, y: element.offsetTop };
}

function readInitialSize(element: HTMLElement): Size {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width || element.offsetWidth,
    height: rect.height || element.offsetHeight,
  };
}

function resolveDragHandle(
  element: HTMLElement,
  handleOption: FreedomWindowOptions['dragHandle']
): HTMLElement | null {
  if (handleOption === null) return null;
  if (handleOption === undefined) return element;
  if (typeof handleOption === 'string') {
    return element.querySelector<HTMLElement>(handleOption);
  }
  return handleOption;
}

function resolveEnabledHandles(option: NonNullable<FreedomWindowOptions['resizable']>): ResizeHandle[] {
  if (option === false) return [];
  if (option === true) return [...ALL_HANDLES];
  return option;
}
