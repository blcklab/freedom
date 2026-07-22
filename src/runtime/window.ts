import type {
  BoundsInput,
  BoundsOption,
  DockEventData,
  DropZone,
  FreedomPlugin,
  FreedomWindow,
  FreedomWindowOptions,
  InitialPosition,
  MaximizeOptions,
  MinimizeOptions,
  PersistOptions,
  PersistedWindowState,
  Point,
  PositioningMode,
  PluginContext,
  Rect,
  ResizeHandle,
  Size,
  SnapEdge,
  SnapEventData,
  SnapTarget,
  WindowEventMap,
  WindowMode,
} from '../core/types';
import { Emitter } from '../core/events';
import { clampPointToBounds, clampSize, type SizeLimits } from '../core/math';
import { createDragEngine } from '../engine/drag';
import { createResizeEngine } from '../engine/resize';
import { constrainToBounds, resolveBounds } from '../engine/constraints';
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
const DEFAULT_MINIMIZED_HEIGHT = 48;
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
  const persist = resolvePersistOptions(options.persist, id);
  const persistedState = readPersistedState(persist);
  const restoredState = persist?.restore === false ? null : persistedState;

  let userBounds: BoundsOption | undefined = options.bounds;
  let dockedZone: DropZone | null = restoredState?.dockedZoneId
    ? findDropZone(options.dropZones, restoredState.dockedZoneId)
    : null;
  let mode: WindowMode = restoredState?.mode ?? 'normal';
  let restoreSnapshot = createRestoreSnapshot(restoredState);
  let lastDropZoneSnap: SnapEventData | null = null;

  applyBaseStyles(element, {
    positioning,
    forcePositioning: shouldForcePositioning(element, options),
  });

  let size: Size = clampSize(
    sanitizeSize(restoredState?.size ?? options.initialSize ?? readInitialSize(element), 'initialSize'),
    limits
  );
  let position: Point = resolveInitialPosition(
    restoredState?.position ?? options.initialPosition,
    element,
    size,
    userBounds,
    positioning
  );
  const renderer = createPositionRenderer(element, positioning, position);
  let zIndex = normalizeZIndex(options.zIndex ?? 0);
  let focused = false;
  let isDraggable = options.draggable ?? true;
  let isDestroyed = false;

  writeSize(element, size);
  writePosition(element, position, renderer);
  if (zIndex) element.style.zIndex = String(zIndex);
  applyModeClasses();
  if (dockedZone) element.classList.add('freedom-docked');
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

  function activeBounds(): BoundsOption | undefined {
    const zoneRect = getLockedZoneRect();
    return zoneRect ?? userBounds;
  }

  const pluginContext: PluginContext = {
    element,
    get window(): FreedomWindow {
      return api;
    },
    emit(event, data) {
      emitter.emit(event, data);
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
    bounds: () => activeBounds(),
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
    bounds: () => activeBounds(),
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
      position = applyDropZoneSnap(next, data.pointerEvent);
      const nextData = { ...data, position };
      paint(position);
      emitter.emit('drag', nextData);
    },
    onDragEnd(data) {
      element.classList.remove('freedom-dragging');
      if (!dockedZone) dockIfInsideDropZone(data.pointerEvent);
      if (dockedZone) position = clampToActiveBounds(position, size);
      paint(position);
      const nextData = { ...data, position };
      emitter.emit('dragend', nextData);
      saveState();
    },

    onResizeStart(data) {
      element.classList.add('freedom-resizing');
      emitter.emit('resizestart', data);
    },
    onResizeMove({ position: nextPosition, size: nextSize, data }) {
      size = nextSize;
      position = clampToActiveBounds(nextPosition, size);
      const nextData = { ...data, position, size };
      paint(position, size);
      emitter.emit('resize', nextData);
    },
    onResizeEnd(data) {
      element.classList.remove('freedom-resizing');
      position = clampToActiveBounds(position, size);
      paint(position);
      const nextData = { ...data, position, size };
      emitter.emit('resizeend', nextData);
      saveState();
    },
  });

  const initialResizeHandles = resolveEnabledHandles(options.resizable ?? true);
  if (initialResizeHandles.length > 0) setupResizeHandles(initialResizeHandles);

  function currentState(): PersistedWindowState {
    return {
      position: { ...position },
      size: { ...size },
      mode,
      restorePosition: restoreSnapshot?.position ? { ...restoreSnapshot.position } : undefined,
      restoreSize: restoreSnapshot?.size ? { ...restoreSnapshot.size } : undefined,
      dockedZoneId: dockedZone?.id,
    };
  }

  function saveState(): void {
    if (!persist || persist.save === false) return;
    const storage = getPersistStorage(persist);
    if (!storage) return;

    try {
      storage.setItem(persist.key, JSON.stringify(currentState()));
    } catch {
      // Storage can be unavailable in private or restricted contexts.
    }
  }

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
      position = clampToActiveBounds(sanitizePoint(point, 'setPosition'), size);
      paint(position);
      saveState();
    },

    setSize(nextSize: Size): void {
      assertAlive('setSize');
      size = clampSize(sanitizeSize(nextSize, 'setSize'), limits);
      position = clampToActiveBounds(position, size);
      paint(position, size);
      saveState();
    },

    getBounds(): BoundsOption | undefined {
      assertAlive('getBounds');
      return userBounds;
    },

    setBounds(bounds?: BoundsOption): void {
      assertAlive('setBounds');
      userBounds = bounds;
      position = clampToActiveBounds(position, size);
      paint(position);
      saveState();
    },

    dock(zone?: string | DropZone): void {
      assertAlive('dock');
      const target = typeof zone === 'string'
        ? findDropZone(options.dropZones, zone)
        : zone ?? findFirstDropZone(options.dropZones);

      if (!target) {
        throw new Error('freedom.window().dock() expected a valid drop zone.');
      }

      dockToZone(target);
    },

    undock(nextPosition?: Point): void {
      assertAlive('undock');
      if (!dockedZone) return;
      const previous = createDockEventData(dockedZone);
      dockedZone = null;
      element.classList.remove('freedom-docked');
      if (nextPosition) position = sanitizePoint(nextPosition, 'undock');
      paint(position);
      emitter.emit('undock', previous);
      saveState();
    },

    isDocked(): boolean {
      assertAlive('isDocked');
      return !!dockedZone;
    },

    getDockedZone(): DropZone | null {
      assertAlive('getDockedZone');
      return dockedZone;
    },

    minimize(minimizeOptions: MinimizeOptions = {}): void {
      assertAlive('minimize');
      if (mode === 'minimized') return;
      captureRestoreSnapshot();
      mode = 'minimized';
      size = clampSize({ width: minimizeOptions.width ?? size.width, height: minimizeOptions.height ?? DEFAULT_MINIMIZED_HEIGHT }, limits);
      position = clampToActiveBounds(position, size);
      applyModeClasses();
      paint(position, size);
      const state = currentState();
      emitter.emit('minimize', state);
      saveState();
    },

    maximize(maximizeOptions: MaximizeOptions = {}): void {
      assertAlive('maximize');
      if (mode !== 'maximized') captureRestoreSnapshot();
      const bounds = resolveBounds(maximizeOptions.bounds ?? activeBounds() ?? 'viewport', element)
        ?? resolveBounds('viewport', element)!;
      mode = 'maximized';
      position = { x: bounds.minX, y: bounds.minY };
      size = clampSize({ width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY }, limits);
      applyModeClasses();
      paint(position, size);
      const state = currentState();
      emitter.emit('maximize', state);
      saveState();
    },

    restore(): void {
      assertAlive('restore');
      if (mode === 'normal' || !restoreSnapshot) return;
      mode = 'normal';
      position = clampToActiveBounds(restoreSnapshot.position, restoreSnapshot.size);
      size = clampSize(restoreSnapshot.size, limits);
      restoreSnapshot = null;
      applyModeClasses();
      paint(position, size);
      const state = currentState();
      emitter.emit('restore', state);
      saveState();
    },

    isMinimized(): boolean {
      assertAlive('isMinimized');
      return mode === 'minimized';
    },

    isMaximized(): boolean {
      assertAlive('isMaximized');
      return mode === 'maximized';
    },

    saveState,

    restoreState(): boolean {
      assertAlive('restoreState');
      const state = readPersistedState(persist);
      if (!state) return false;
      applyPersistedState(state);
      saveState();
      return true;
    },

    clearState(): void {
      assertAlive('clearState');
      if (!persist) return;
      const storage = getPersistStorage(persist);
      try {
        storage?.removeItem(persist.key);
      } catch {
        // Storage removal is best-effort for restricted contexts.
      }
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
      element.classList.remove(
        'freedom-dragging',
        'freedom-resizing',
        'freedom-focused',
        'freedom-docked',
        'freedom-minimized',
        'freedom-maximized'
      );
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
  if (options.onSnap) api.on('snap', options.onSnap);
  if (options.onUnsnap) api.on('unsnap', options.onUnsnap);
  if (options.onDock) api.on('dock', options.onDock);
  if (options.onUndock) api.on('undock', options.onUndock);
  if (options.onMinimize) api.on('minimize', options.onMinimize);
  if (options.onMaximize) api.on('maximize', options.onMaximize);
  if (options.onRestore) api.on('restore', options.onRestore);

  for (const plugin of plugins) plugin.onInit?.(pluginContext);

  return api;

  function applyPersistedState(state: PersistedWindowState): void {
    size = clampSize(sanitizeSize(state.size, 'restoreState.size'), limits);
    position = clampToActiveBounds(sanitizePoint(state.position, 'restoreState.position'), size);
    mode = state.mode ?? 'normal';
    restoreSnapshot = createRestoreSnapshot(state);
    dockedZone = state.dockedZoneId ? findDropZone(options.dropZones, state.dockedZoneId) : null;
    applyModeClasses();
    toggleClass(element, 'freedom-docked', !!dockedZone);
    paint(position, size);
  }

  function captureRestoreSnapshot(): void {
    if (mode === 'normal') {
      restoreSnapshot = { position: { ...position }, size: { ...size } };
    }
  }

  function applyModeClasses(): void {
    toggleClass(element, 'freedom-minimized', mode === 'minimized');
    toggleClass(element, 'freedom-maximized', mode === 'maximized');
  }

  function getLockedZoneRect(): Rect | null {
    if (!dockedZone || dockedZone.lockOnDrop === false) return null;
    return resolveDropZoneRect(dockedZone, element, positioning);
  }

  function clampToActiveBounds(point: Point, nextSize: Size): Point {
    const bounds = activeBounds();
    return bounds ? constrainToBounds(point, nextSize, bounds, element) : point;
  }

  function applyDropZoneSnap(point: Point, pointerEvent: PointerEvent): Point {
    if (!options.dropZones?.length || dockedZone) {
      clearDropZoneSnap(point, pointerEvent);
      return point;
    }

    let next = point;
    let snapData: SnapEventData | null = null;

    for (const zone of options.dropZones) {
      if (zone.snap === false) continue;
      const rect = resolveDropZoneRect(zone, element, positioning);
      if (!rect) continue;

      const result = snapToRect(next, size, rect, zone.threshold ?? 24);
      next = result.position;

      if (result.edges.length > 0) {
        snapData = {
          target: { ...rect, id: zone.id, data: zone.data },
          edges: result.edges,
          position: next,
          size,
          pointerEvent,
        };
      }
    }

    if (snapData) {
      const currentKey = snapEventKey(snapData);
      if (!lastDropZoneSnap || snapEventKey(lastDropZoneSnap) !== currentKey) {
        lastDropZoneSnap = snapData;
        emitter.emit('snap', snapData);
      }
    } else {
      clearDropZoneSnap(next, pointerEvent);
    }

    return next;
  }

  function clearDropZoneSnap(point: Point, pointerEvent: PointerEvent): void {
    if (!lastDropZoneSnap) return;
    const data = { ...lastDropZoneSnap, position: point, size, pointerEvent };
    lastDropZoneSnap = null;
    emitter.emit('unsnap', data);
  }

  function dockIfInsideDropZone(pointerEvent: PointerEvent): void {
    for (const zone of options.dropZones ?? []) {
      const rect = resolveDropZoneRect(zone, element, positioning);
      if (!rect || !isInsideDropZone(position, size, rect, zone.contains ?? 'center')) continue;
      dockToZone(zone, pointerEvent);
      return;
    }
  }

  function dockToZone(zone: DropZone, pointerEvent?: PointerEvent): void {
    const rect = resolveDropZoneRect(zone, element, positioning);
    if (!rect) {
      throw new Error('freedom.window().dock() could not resolve the drop zone rect.');
    }

    dockedZone = zone;
    element.classList.add('freedom-docked');

    if (zone.snap !== false || zone.lockOnDrop !== false) {
      const bounds = { minX: rect.x, minY: rect.y, maxX: rect.x + rect.width, maxY: rect.y + rect.height };
      position = clampPointToBounds(position, size, bounds);
      paint(position);
    }

    const data = createDockEventData(zone, pointerEvent);
    emitter.emit('dock', data);
    saveState();
  }

  function createDockEventData(zone: DropZone, pointerEvent?: PointerEvent): DockEventData {
    const rect = resolveDropZoneRect(zone, element, positioning) ?? { x: position.x, y: position.y, width: size.width, height: size.height };
    return { zone, rect, position: { ...position }, size: { ...size }, pointerEvent };
  }
}


function toggleClass(element: HTMLElement, className: string, force: boolean): void {
  if (force) element.classList.add(className);
  else element.classList.remove(className);
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
  if (initialPosition === 'center') return centerPosition(element, size, bounds, positioning);
  if (initialPosition) return sanitizePoint(initialPosition, 'initialPosition');
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
): Rect {
  const resolved = bounds ? resolveBounds(bounds, element) : null;
  if (resolved) {
    return {
      x: resolved.minX,
      y: resolved.minY,
      width: resolved.maxX - resolved.minX,
      height: resolved.maxY - resolved.minY,
    };
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

function resolvePersistOptions(option: FreedomWindowOptions['persist'], id: string): (PersistOptions & { key: string }) | null {
  if (!option) return null;
  if (option === true) return { key: `freedom:${id}` };
  return { ...option, key: option.key ?? `freedom:${id}` };
}

function getPersistStorage(option: PersistOptions | null): Storage | null {
  if (!option) return null;
  if (option.storage) return option.storage;
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readPersistedState(option: (PersistOptions & { key: string }) | null): PersistedWindowState | null {
  if (!option || option.restore === false) return null;
  const storage = getPersistStorage(option);
  if (!storage) return null;

  try {
    const raw = storage.getItem(option.key);
    if (!raw) return null;
    return normalizePersistedState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function normalizePersistedState(value: unknown): PersistedWindowState | null {
  const state = value as Partial<PersistedWindowState> | null;
  if (!state || !state.position || !state.size) return null;

  return {
    position: sanitizePoint(state.position, 'persist.position'),
    size: sanitizeSize(state.size, 'persist.size'),
    mode: state.mode === 'minimized' || state.mode === 'maximized' ? state.mode : 'normal',
    restorePosition: state.restorePosition ? sanitizePoint(state.restorePosition, 'persist.restorePosition') : undefined,
    restoreSize: state.restoreSize ? sanitizeSize(state.restoreSize, 'persist.restoreSize') : undefined,
    dockedZoneId: typeof state.dockedZoneId === 'string' ? state.dockedZoneId : undefined,
  };
}

function createRestoreSnapshot(state: PersistedWindowState | null): { position: Point; size: Size } | null {
  if (!state?.restorePosition || !state.restoreSize) return null;
  return { position: { ...state.restorePosition }, size: { ...state.restoreSize } };
}

function findFirstDropZone(zones: DropZone[] | undefined): DropZone | null {
  return zones?.[0] ?? null;
}

function findDropZone(zones: DropZone[] | undefined, id: string): DropZone | null {
  return zones?.find((zone) => zone.id === id) ?? null;
}

function resolveDropZoneRect(
  zone: DropZone,
  element: HTMLElement,
  positioning: PositioningMode
): Rect | null {
  const rect = typeof zone.rect === 'function' ? zone.rect() : zone.rect;
  if (rect) return rect;

  const target = typeof zone.element === 'function' ? zone.element() : zone.element;
  if (!target) return null;

  const targetRect = target.getBoundingClientRect();

  if (positioning === 'absolute') {
    const parent = element.offsetParent as HTMLElement | null;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      return {
        x: targetRect.left - parentRect.left + (parent.scrollLeft || 0),
        y: targetRect.top - parentRect.top + (parent.scrollTop || 0),
        width: targetRect.width,
        height: targetRect.height,
      };
    }
  }

  return { x: targetRect.left, y: targetRect.top, width: targetRect.width, height: targetRect.height };
}

function isInsideDropZone(position: Point, size: Size, rect: Rect, mode: DropZone['contains']): boolean {
  const right = position.x + size.width;
  const bottom = position.y + size.height;
  const rectRight = rect.x + rect.width;
  const rectBottom = rect.y + rect.height;

  if (mode === 'full') {
    return position.x >= rect.x && position.y >= rect.y && right <= rectRight && bottom <= rectBottom;
  }

  if (mode === 'intersect') {
    return right >= rect.x && position.x <= rectRight && bottom >= rect.y && position.y <= rectBottom;
  }

  const centerX = position.x + size.width / 2;
  const centerY = position.y + size.height / 2;
  return centerX >= rect.x && centerX <= rectRight && centerY >= rect.y && centerY <= rectBottom;
}

function snapToRect(point: Point, size: Size, target: SnapTarget, threshold: number): { position: Point; edges: SnapEdge[] } {
  let x = point.x;
  let y = point.y;
  const edges: SnapEdge[] = [];

  if (Math.abs(x - target.x) <= threshold) {
    x = target.x;
    edges.push('left');
  }

  if (Math.abs(x + size.width - (target.x + target.width)) <= threshold) {
    x = target.x + target.width - size.width;
    edges.push('right');
  }

  if (Math.abs(y - target.y) <= threshold) {
    y = target.y;
    edges.push('top');
  }

  if (Math.abs(y + size.height - (target.y + target.height)) <= threshold) {
    y = target.y + target.height - size.height;
    edges.push('bottom');
  }

  return { position: { x, y }, edges };
}

function snapEventKey(data: SnapEventData): string {
  return `${data.target.id ?? `${data.target.x}:${data.target.y}:${data.target.width}:${data.target.height}`}:${data.edges.join(',')}`;
}
