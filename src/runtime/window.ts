import type {
  BoundsOption,
  FreedomPlugin,
  FreedomWindow,
  FreedomWindowOptions,
  InitialPosition,
  Point,
  PositioningMode,
  PluginContext,
  ResizeHandle,
  Size,
  WindowEventMap,
} from '../core/types';
import { Emitter } from '../core/events';
import { clampSize, type SizeLimits } from '../core/math';
import { createDragEngine } from '../engine/drag';
import { createResizeEngine } from '../engine/resize';
import { createInteractionManager } from '../core/interaction-manager';
import {
  applyBaseStyles,
  createPositionRenderer,
  readRenderedPosition,
  writePosition,
  writeSize,
} from '../dom/render';
import { createResizeHandle } from '../dom/handles';
import { createFrameScheduler } from '../dom/scheduler';

const ALL_HANDLES: readonly ResizeHandle[] = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
const instances = new WeakMap<HTMLElement, FreedomWindow>();

let autoId = 0;

export function createWindow(element: HTMLElement, options: FreedomWindowOptions = {}): FreedomWindow {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    throw new Error('freedom.window() requires a browser environment. Importing is SSR-safe, but creating a window must run in the browser.');
  }

  assertHTMLElement(element);

  if (instances.has(element)) {
    throw new Error('freedom.window() was called more than once for the same element. Destroy the existing instance before creating a new one.');
  }

  const id = options.id ?? `freedom-window-${++autoId}`;
  const emitter = new Emitter<WindowEventMap>();
  const plugins: readonly FreedomPlugin[] = options.plugins ?? [];
  const limits = normalizeSizeLimits(options);
  const positioning = resolvePositioning(element, options);

  // Initialization stays synchronous to prevent top-left first paint.
  applyBaseStyles(element, {
    positioning,
    forcePositioning: shouldForcePositioning(element, options),
  });

  let size: Size = clampSize(sanitizeSize(options.initialSize ?? readInitialSize(element), 'initialSize'), limits);
  let position: Point = resolveInitialPosition(options.initialPosition, element, size, options.bounds, positioning);
  const renderer = createPositionRenderer(element, positioning, position);
  let zIndex = normalizeZIndex(options.zIndex ?? 0);
  let focused = false;
  let isDraggable = options.draggable ?? true;
  let isDestroyed = false;

  writeSize(element, size);
  writePosition(element, position, renderer);
  if (zIndex) element.style.zIndex = String(zIndex);
  revealIfRequested(element, options);

  let pendingPosition: Point | null = null;
  let pendingSize: Size | null = null;

  const scheduler = createFrameScheduler(() => {
    if (isDestroyed) return;

    if (pendingPosition) {
      writePosition(element, pendingPosition, renderer);
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

  function assertAlive(method: string): void {
    if (isDestroyed) {
      throw new Error(`Cannot call ${method}() on a destroyed freedom window.`);
    }
  }

  const pluginContext: PluginContext = {
    element,
    get window(): FreedomWindow {
      return api;
    },
  };

  const dragHandleElement = resolveDragHandle(element, options.dragHandle);

  function isDragTarget(target: EventTarget | null): boolean {
    if (!isDraggable || !dragHandleElement) return false;
    if (!(target instanceof Node)) return false;
    return dragHandleElement === target || dragHandleElement.contains(target);
  }

  const dragEngine = createDragEngine({
    element,
    bounds: options.bounds,
    plugins,
    pluginContext,
    getPosition: () => position,
    getSize: () => size,
  });

  const resizeHandleElements = new Map<ResizeHandle, HTMLElement>();

  function resolveResizeHandle(target: EventTarget | null): ResizeHandle | null {
    if (!(target instanceof Element)) return null;
    const handleEl = target.closest<HTMLElement>('.freedom-resize-handle');
    if (!handleEl) return null;

    for (const [handle, el] of resizeHandleElements) {
      if (el === handleEl) return handle;
    }

    return null;
  }

  const resizeEngine = createResizeEngine({
    element,
    bounds: options.bounds,
    ...limits,
    plugins,
    pluginContext,
    getPosition: () => position,
    getSize: () => size,
  });

  function setupResizeHandles(handles: readonly ResizeHandle[]): void {
    const normalizedHandles = normalizeResizeHandles(handles);
    for (const handle of normalizedHandles) {
      if (resizeHandleElements.has(handle)) continue;
      const handleEl = createResizeHandle(handle);
      element.appendChild(handleEl);
      resizeHandleElements.set(handle, handleEl);
    }
  }

  function teardownResizeHandles(handles: readonly ResizeHandle[] = ALL_HANDLES): void {
    for (const handle of handles) {
      const handleEl = resizeHandleElements.get(handle);
      if (handleEl) {
        handleEl.remove();
        resizeHandleElements.delete(handle);
      }
    }
  }

  const interactionManager = createInteractionManager({
    element,
    dragEngine,
    resizeEngine,
    resolveResizeHandle,
    isDragTarget,

    onDragStart(data) {
      element.classList.add('freedom-dragging');
      emitter.emit('dragstart', data);
    },
    onDragMove({ position: next, data }) {
      position = next;
      paint(position);
      emitter.emit('drag', data);
    },
    onDragEnd(data) {
      element.classList.remove('freedom-dragging');
      emitter.emit('dragend', data);
    },

    onResizeStart(data) {
      element.classList.add('freedom-resizing');
      emitter.emit('resizestart', data);
    },
    onResizeMove({ position: nextPosition, size: nextSize, data }) {
      position = nextPosition;
      size = nextSize;
      paint(position, size);
      emitter.emit('resize', data);
    },
    onResizeEnd(data) {
      element.classList.remove('freedom-resizing');
      emitter.emit('resizeend', data);
    },
  });

  const initialResizeHandles = resolveEnabledHandles(options.resizable ?? true);
  if (initialResizeHandles.length > 0) setupResizeHandles(initialResizeHandles);

  const api: FreedomWindow = {
    id,
    element,

    getPosition(): Point {
      assertAlive('getPosition');
      return { ...position };
    },

    getSize(): Size {
      assertAlive('getSize');
      return { ...size };
    },

    setPosition(point: Point): void {
      assertAlive('setPosition');
      position = sanitizePoint(point, 'setPosition');
      paint(position);
    },

    setSize(nextSize: Size): void {
      assertAlive('setSize');
      size = clampSize(sanitizeSize(nextSize, 'setSize'), limits);
      paint(undefined, size);
    },

    focus(): void {
      assertAlive('focus');
      if (focused) return;
      focused = true;
      element.classList.add('freedom-focused');
      emitter.emit('focus', undefined);
      options.onFocus?.();
    },

    blur(): void {
      assertAlive('blur');
      if (!focused) return;
      focused = false;
      element.classList.remove('freedom-focused');
      emitter.emit('blur', undefined);
      options.onBlur?.();
    },

    isFocused(): boolean {
      assertAlive('isFocused');
      return focused;
    },

    setZIndex(next: number): void {
      assertAlive('setZIndex');
      zIndex = normalizeZIndex(next);
      element.style.zIndex = String(zIndex);
    },

    getZIndex(): number {
      assertAlive('getZIndex');
      return zIndex;
    },

    enableDrag(): void {
      assertAlive('enableDrag');
      isDraggable = true;
    },

    disableDrag(): void {
      assertAlive('disableDrag');
      isDraggable = false;
      if (interactionManager.active === 'drag') {
        interactionManager.cancel();
        element.classList.remove('freedom-dragging');
      }
    },

    enableResize(handles: ResizeHandle[] = ALL_HANDLES as ResizeHandle[]): void {
      assertAlive('enableResize');
      setupResizeHandles(handles);
    },

    disableResize(): void {
      assertAlive('disableResize');
      if (interactionManager.active === 'resize') {
        interactionManager.cancel();
        element.classList.remove('freedom-resizing');
      }
      teardownResizeHandles();
    },

    destroy(): void {
      if (isDestroyed) return;
      isDestroyed = true;
      interactionManager.destroy();
      teardownResizeHandles();
      scheduler.cancel();
      element.classList.remove('freedom-dragging', 'freedom-resizing', 'freedom-focused');
      for (const plugin of plugins) plugin.onDestroy?.(pluginContext);
      emitter.emit('destroy', undefined);
      emitter.clear();
      instances.delete(element);
    },

    on(event, handler) {
      assertAlive('on');
      return emitter.on(event, handler);
    },
  };

  instances.set(element, api);

  if (options.onDragStart) api.on('dragstart', options.onDragStart);
  if (options.onDrag) api.on('drag', options.onDrag);
  if (options.onDragEnd) api.on('dragend', options.onDragEnd);
  if (options.onResizeStart) api.on('resizestart', options.onResizeStart);
  if (options.onResize) api.on('resize', options.onResize);
  if (options.onResizeEnd) api.on('resizeend', options.onResizeEnd);

  for (const plugin of plugins) plugin.onInit?.(pluginContext);

  return api;
}

function assertHTMLElement(element: unknown): asserts element is HTMLElement {
  const maybeElement = element as Partial<HTMLElement> | null | undefined;
  const isUsableElement =
    !!maybeElement &&
    typeof maybeElement === 'object' &&
    (maybeElement as { nodeType?: number }).nodeType === 1 &&
    typeof maybeElement.getBoundingClientRect === 'function' &&
    !!maybeElement.style &&
    typeof maybeElement.addEventListener === 'function' &&
    typeof maybeElement.removeEventListener === 'function';

  if (!isUsableElement) {
    throw new TypeError('freedom.window(element) expected a real HTMLElement. Received null, undefined, or a non-element value.');
  }
}

function normalizeSizeLimits(options: FreedomWindowOptions): SizeLimits {
  const minWidth = finiteNonNegative(options.minWidth, 0);
  const minHeight = finiteNonNegative(options.minHeight, 0);
  const maxWidth = finitePositiveOrInfinity(options.maxWidth, Infinity);
  const maxHeight = finitePositiveOrInfinity(options.maxHeight, Infinity);

  return {
    minWidth,
    minHeight,
    maxWidth: Math.max(minWidth, maxWidth),
    maxHeight: Math.max(minHeight, maxHeight),
  };
}

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function finitePositiveOrInfinity(value: number | undefined, fallback: number): number {
  if (value === Infinity) return Infinity;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeZIndex(value: number): number {
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function sanitizePoint(point: Point, source: string): Point {
  if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new TypeError(`freedom.window(): ${source} expected a finite { x, y } point.`);
  }
  return { x: point.x, y: point.y };
}

function sanitizeSize(size: Size, source: string): Size {
  if (!size || typeof size.width !== 'number' || typeof size.height !== 'number' || !Number.isFinite(size.width) || !Number.isFinite(size.height)) {
    throw new TypeError(`freedom.window(): ${source} expected a finite { width, height } size.`);
  }
  return { width: Math.max(0, size.width), height: Math.max(0, size.height) };
}

function shouldForcePositioning(element: HTMLElement, options: FreedomWindowOptions): boolean {
  const computed = window.getComputedStyle(element).position;
  return Boolean(options.positioning) || computed === 'static';
}

function resolvePositioning(element: HTMLElement, options: FreedomWindowOptions): PositioningMode {
  if (options.positioning) return options.positioning;

  const computed = window.getComputedStyle(element);
  if (computed.position === 'fixed') return 'fixed';
  if (computed.position === 'absolute') return 'absolute';
  if (computed.position === 'relative' || computed.position === 'sticky') return 'relative';

  if (hasAuthoredInset(computed)) return 'fixed';

  if (options.initialPosition !== undefined) {
    return options.bounds === 'parent' ? 'absolute' : 'fixed';
  }

  return 'relative';
}

function hasAuthoredInset(style: CSSStyleDeclaration): boolean {
  return [style.top, style.right, style.bottom, style.left].some((value) => {
    if (!value || value === 'auto') return false;
    return value !== '0px' && value !== '0';
  });
}

function resolveInitialPosition(
  initialPosition: InitialPosition | undefined,
  element: HTMLElement,
  size: Size,
  bounds: BoundsOption | undefined,
  positioning: PositioningMode
): Point {
  if (initialPosition === 'center') {
    return centerPosition(element, size, bounds, positioning);
  }

  if (initialPosition) {
    return sanitizePoint(initialPosition, 'initialPosition');
  }

  return readRenderedPosition(element, positioning);
}

function centerPosition(
  element: HTMLElement,
  size: Size,
  bounds: BoundsOption | undefined,
  positioning: PositioningMode
): Point {
  const box = resolveCenterBox(element, bounds, positioning);

  return {
    x: Math.round(box.x + Math.max(0, box.width - size.width) / 2),
    y: Math.round(box.y + Math.max(0, box.height - size.height) / 2),
  };
}

function resolveCenterBox(
  element: HTMLElement,
  bounds: BoundsOption | undefined,
  positioning: PositioningMode
): { x: number; y: number; width: number; height: number } {
  if (bounds && typeof bounds === 'object') {
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  }

  if (bounds === 'parent') {
    const parent = element.offsetParent as HTMLElement | null;
    if (parent) return { x: 0, y: 0, width: parent.clientWidth, height: parent.clientHeight };
  }

  if (positioning === 'absolute' && bounds !== 'viewport') {
    const parent = element.offsetParent as HTMLElement | null;
    if (parent) return { x: 0, y: 0, width: parent.clientWidth, height: parent.clientHeight };
  }

  const root = document.documentElement;
  return {
    x: 0,
    y: 0,
    width: window.innerWidth || root.clientWidth,
    height: window.innerHeight || root.clientHeight,
  };
}

function readInitialSize(element: HTMLElement): Size {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width || element.offsetWidth || 0,
    height: rect.height || element.offsetHeight || 0,
  };
}

function revealIfRequested(element: HTMLElement, options: FreedomWindowOptions): void {
  if (options.autoReveal === false) return;
  const visibility = window.getComputedStyle(element).visibility;
  if (visibility === 'hidden') {
    element.style.visibility = 'visible';
  }
}

function resolveDragHandle(
  element: HTMLElement,
  handleOption: FreedomWindowOptions['dragHandle']
): HTMLElement | null {
  if (handleOption === null) return null;
  if (handleOption === undefined) return element;
  if (typeof handleOption === 'string') return element.querySelector<HTMLElement>(handleOption);
  return handleOption;
}

function resolveEnabledHandles(option: NonNullable<FreedomWindowOptions['resizable']>): ResizeHandle[] {
  if (option === false) return [];
  if (option === true) return [...ALL_HANDLES];
  return normalizeResizeHandles(option);
}

function normalizeResizeHandles(handles: readonly ResizeHandle[]): ResizeHandle[] {
  const unique = new Set<ResizeHandle>();

  for (const handle of handles) {
    if (!ALL_HANDLES.includes(handle)) {
      throw new TypeError(`freedom.window(): invalid resize handle "${String(handle)}".`);
    }
    unique.add(handle);
  }

  return [...unique];
}
