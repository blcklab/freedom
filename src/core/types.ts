export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type BoundsOption = 'none' | 'viewport' | 'parent' | Rect;

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export type InitialPosition = Point | 'center';

export type PositioningMode = 'absolute' | 'fixed' | 'relative';

export interface DragEventData {
    position: Point;
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

export interface FreedomWindowOptions {
    id?: string;

    initialPosition?: InitialPosition;
  initialSize?: Size;

    positioning?: PositioningMode;

    autoReveal?: boolean;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

    draggable?: boolean;

    resizable?: boolean | ResizeHandle[];

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

export interface FreedomManagerOptions {
    baseZIndex?: number;
}

export interface FreedomManager {
  register(win: FreedomWindow): void;
  unregister(win: FreedomWindow): void;

    focus(win: FreedomWindow): void;
    bringToFront(win: FreedomWindow): void;

  getFocused(): FreedomWindow | null;
  list(): FreedomWindow[];

  on<K extends keyof ManagerEventMap>(
    event: K,
    handler: (data: ManagerEventMap[K]) => void
  ): () => void;

  destroy(): void;
}
