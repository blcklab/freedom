/**
 * core/types.ts
 *
 * Single source of truth for every public and internal type in the library.
 * No DOM side effects live here — this file is pure data shapes.
 */

// ---------------------------------------------------------------------------
// Primitive geometry
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

/** Axis-aligned box expressed as min/max edges, used for clamping. */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * How a window's movement/size should be constrained.
 * - 'none'      -> unconstrained (default)
 * - 'viewport'  -> clamped to the browser viewport
 * - 'parent'    -> clamped to the element's offsetParent
 * - Rect        -> clamped to an explicit, caller-supplied box
 */
export type BoundsOption = 'none' | 'viewport' | 'parent' | Rect;

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

// ---------------------------------------------------------------------------
// Interaction event payloads
// ---------------------------------------------------------------------------

export interface DragEventData {
  /** Logical position after this update (already bounds/plugin-resolved). */
  position: Point;
  /** Cumulative pointer delta since drag start. */
  delta: Point;
  pointerEvent: PointerEvent;
}

export interface ResizeEventData {
  size: Size;
  position: Point;
  handle: ResizeHandle;
  pointerEvent: PointerEvent;
}

export interface WindowEventMap {
  dragstart: DragEventData;
  drag: DragEventData;
  dragend: DragEventData;
  resizestart: ResizeEventData;
  resize: ResizeEventData;
  resizeend: ResizeEventData;
  focus: undefined;
  blur: undefined;
  destroy: undefined;
}

export interface ManagerEventMap {
  register: FreedomWindow;
  unregister: FreedomWindow;
  focus: FreedomWindow;
  blur: FreedomWindow;
}

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

/**
 * Plugins observe and may transform geometry before it is committed/painted.
 * Returning a value overrides the proposed geometry for that frame;
 * returning void/undefined leaves it untouched. Plugins must stay pure and
 * fast — they run synchronously inside the pointermove hot path.
 */
export interface FreedomPlugin {
  readonly name: string;
  onInit?(ctx: PluginContext): void;
  onDrag?(data: DragEventData, ctx: PluginContext): Point | void;
  onResize?(data: ResizeEventData, ctx: PluginContext): { position: Point; size: Size } | void;
  onDestroy?(ctx: PluginContext): void;
}

export interface PluginContext {
  readonly window: FreedomWindow;
  readonly element: HTMLElement;
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

export interface FreedomWindowOptions {
  /** Stable identifier. Auto-generated if omitted. */
  id?: string;

  initialPosition?: Point;
  initialSize?: Size;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  /** Enables/disables dragging entirely. Default: true. */
  draggable?: boolean;

  /**
   * Which corners can resize the window.
   * `true` = all four corners, `false` = none, or an explicit subset.
   * Default: true.
   */
  resizable?: boolean | ResizeHandle[];

  /**
   * Restricts dragging to a specific sub-element (e.g. a title bar).
   * - undefined -> the whole element is draggable
   * - string    -> CSS selector resolved against the element
   * - HTMLElement -> used directly
   * - null      -> dragging disabled regardless of `draggable`
   */
  dragHandle?: string | HTMLElement | null;

  bounds?: BoundsOption;

  zIndex?: number;

  plugins?: FreedomPlugin[];

  onDragStart?(data: DragEventData): void;
  onDrag?(data: DragEventData): void;
  onDragEnd?(data: DragEventData): void;
  onResizeStart?(data: ResizeEventData): void;
  onResize?(data: ResizeEventData): void;
  onResizeEnd?(data: ResizeEventData): void;
  onFocus?(): void;
  onBlur?(): void;
}

export interface FreedomWindow {
  readonly id: string;
  readonly element: HTMLElement;

  getPosition(): Point;
  getSize(): Size;
  setPosition(point: Point): void;
  setSize(size: Size): void;

  focus(): void;
  blur(): void;
  isFocused(): boolean;

  setZIndex(zIndex: number): void;
  getZIndex(): number;

  enableDrag(): void;
  disableDrag(): void;
  enableResize(handles?: ResizeHandle[]): void;
  disableResize(): void;

  destroy(): void;

  on<K extends keyof WindowEventMap>(
    event: K,
    handler: (data: WindowEventMap[K]) => void
  ): () => void;
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

export interface FreedomManagerOptions {
  /** z-index assigned to the first registered window. Default: 1. */
  baseZIndex?: number;
}

export interface FreedomManager {
  register(win: FreedomWindow): void;
  unregister(win: FreedomWindow): void;

  /** Brings a window to the front and marks it focused, blurring the rest. */
  focus(win: FreedomWindow): void;
  /** Alias of `focus` for readability at call sites. */
  bringToFront(win: FreedomWindow): void;

  getFocused(): FreedomWindow | null;
  list(): FreedomWindow[];

  on<K extends keyof ManagerEventMap>(
    event: K,
    handler: (data: ManagerEventMap[K]) => void
  ): () => void;

  destroy(): void;
}
