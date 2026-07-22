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

export type BoundsInput = 'none' | 'viewport' | 'parent' | Rect | HTMLElement;
export type BoundsOption = BoundsInput | BoundsResolver;
export type BoundsResolver = () => BoundsOption | null | undefined;

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
export type InitialPosition = Point | 'center';
export type PositioningMode = 'absolute' | 'fixed' | 'relative';
export type SnapEdge = 'left' | 'right' | 'top' | 'bottom';
export type WindowMode = 'normal' | 'minimized' | 'maximized';

export interface SnapTarget extends Rect {
  id?: string;
  data?: unknown;
}

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

export interface SnapEventData {
  target: SnapTarget;
  edges: SnapEdge[];
  position: Point;
  size: Size;
  pointerEvent?: PointerEvent;
}

export interface DropZone {
  id?: string;
  element?: HTMLElement | (() => HTMLElement | null | undefined);
  rect?: Rect | (() => Rect | null | undefined);
  threshold?: number;
  snap?: boolean;
  lockOnDrop?: boolean;
  contains?: 'center' | 'intersect' | 'full';
  data?: unknown;
}

export interface DockEventData {
  zone: DropZone;
  rect: Rect;
  position: Point;
  size: Size;
  pointerEvent?: PointerEvent;
}

export interface PersistOptions {
  key?: string;
  storage?: Storage;
  restore?: boolean;
  save?: boolean;
}

export interface PersistedWindowState {
  position: Point;
  size: Size;
  mode?: WindowMode;
  restorePosition?: Point;
  restoreSize?: Size;
  dockedZoneId?: string;
}

export interface MinimizeOptions {
  height?: number;
  width?: number;
}

export interface MaximizeOptions {
  bounds?: BoundsOption;
}

export interface WindowEventMap {
  dragstart: DragEventData;
  drag: DragEventData;
  dragend: DragEventData;
  resizestart: ResizeEventData;
  resize: ResizeEventData;
  resizeend: ResizeEventData;
  snap: SnapEventData;
  unsnap: SnapEventData;
  dock: DockEventData;
  undock: DockEventData;
  minimize: PersistedWindowState;
  maximize: PersistedWindowState;
  restore: PersistedWindowState;
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
  emit<K extends keyof WindowEventMap>(event: K, data: WindowEventMap[K]): void;
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
  dropZones?: DropZone[];
  persist?: boolean | PersistOptions;

  zIndex?: number;
  plugins?: FreedomPlugin[];

  onDragStart?(data: DragEventData): void;
  onDrag?(data: DragEventData): void;
  onDragEnd?(data: DragEventData): void;
  onResizeStart?(data: ResizeEventData): void;
  onResize?(data: ResizeEventData): void;
  onResizeEnd?(data: ResizeEventData): void;
  onSnap?(data: SnapEventData): void;
  onUnsnap?(data: SnapEventData): void;
  onDock?(data: DockEventData): void;
  onUndock?(data: DockEventData): void;
  onMinimize?(state: PersistedWindowState): void;
  onMaximize?(state: PersistedWindowState): void;
  onRestore?(state: PersistedWindowState): void;
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

  getBounds(): BoundsOption | undefined;
  setBounds(bounds?: BoundsOption): void;

  dock(zone?: string | DropZone): void;
  undock(position?: Point): void;
  isDocked(): boolean;
  getDockedZone(): DropZone | null;

  minimize(options?: MinimizeOptions): void;
  maximize(options?: MaximizeOptions): void;
  restore(): void;
  isMinimized(): boolean;
  isMaximized(): boolean;

  saveState(): void;
  restoreState(): boolean;
  clearState(): void;

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
