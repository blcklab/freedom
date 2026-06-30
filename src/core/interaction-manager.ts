/**
 * core/interaction-manager.ts
 *
 * The single owner of raw Pointer Events for a window. Every FreedomWindow
 * has exactly one InteractionManager, and exactly one interaction — drag OR
 * resize, never both — can be active on it at a time.
 */

import type { Point, ResizeHandle, DragEventData, ResizeEventData } from './types';
import type { DragEngine, DragMoveResult } from '../engine/drag';
import type { ResizeEngine, ResizeMoveResult } from '../engine/resize';

export type ActiveInteraction = 'drag' | 'resize' | null;

export interface InteractionManagerOptions {
  /** The window's root element. The single pointerdown listener lives here. */
  element: HTMLElement;

  dragEngine: DragEngine;
  resizeEngine: ResizeEngine;

  resolveResizeHandle(target: EventTarget | null): ResizeHandle | null;
  isDragTarget(target: EventTarget | null): boolean;

  onDragStart(data: DragEventData): void;
  onDragMove(result: DragMoveResult): void;
  onDragEnd(data: DragEventData): void;

  onResizeStart(data: ResizeEventData): void;
  onResizeMove(result: ResizeMoveResult): void;
  onResizeEnd(data: ResizeEventData): void;
}

function toPoint(event: PointerEvent): Point {
  return { x: event.clientX, y: event.clientY };
}

export class InteractionManager {
  private readonly options: InteractionManagerOptions;
  private activePointerId: number | null = null;
  private captureTarget: Element | null = null;
  private _active: ActiveInteraction = null;
  private destroyed = false;

  constructor(options: InteractionManagerOptions) {
    this.options = options;
    this.options.element.addEventListener('pointerdown', this.handlePointerDown);
  }

  get active(): ActiveInteraction {
    return this._active;
  }

  /** Begins a drag gesture from a pointerdown event. */
  startDrag(event: PointerEvent): void {
    if (this.destroyed || this._active !== null) return;
    this._active = 'drag';
    this.captureGesture(event);
    const data = this.options.dragEngine.begin(toPoint(event), event);
    this.options.onDragStart(data);
  }

  /** Begins a resize gesture from a pointerdown event. */
  startResize(handle: ResizeHandle, event: PointerEvent): void {
    if (this.destroyed || this._active !== null) return;
    this._active = 'resize';
    this.captureGesture(event);
    const data = this.options.resizeEngine.begin(handle, toPoint(event), event);
    this.options.onResizeStart(data);
  }

  /** Aborts whatever is active, silently — no `*end` callback fires. */
  cancel(): void {
    this.teardown();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.options.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.teardown();
  }

  private captureGesture(event: PointerEvent): void {
    this.activePointerId = event.pointerId;
    this.captureTarget = event.target instanceof Element ? event.target : this.options.element;

    try {
      this.captureTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture can fail if the browser has already cancelled the
      // pointer or the target is detached. Window-level listeners below still
      // keep the gesture usable, so this should never crash consumers.
    }

    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  private teardown(): void {
    if (this.activePointerId !== null && this.captureTarget) {
      try {
        this.captureTarget.releasePointerCapture?.(this.activePointerId);
      } catch {
        // Same as setPointerCapture: release may throw after cancellation or
        // detachment. Teardown must be best-effort and safe.
      }
    }

    this.activePointerId = null;
    this.captureTarget = null;
    this._active = null;

    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this.destroyed || this._active !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    // Resize wins ties: a resize handle may visually sit inside the draggable
    // area, but it must start resizing, not dragging.
    const resizeHandle = this.options.resolveResizeHandle(event.target);
    if (resizeHandle) {
      event.preventDefault();
      event.stopPropagation();
      this.startResize(resizeHandle, event);
      return;
    }

    if (this.options.isDragTarget(event.target)) {
      this.startDrag(event);
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.destroyed || event.pointerId !== this.activePointerId) return;

    if (this._active === 'drag') {
      this.options.onDragMove(this.options.dragEngine.move(toPoint(event), event));
    } else if (this._active === 'resize') {
      this.options.onResizeMove(this.options.resizeEngine.move(toPoint(event), event));
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.destroyed || event.pointerId !== this.activePointerId) return;

    if (this._active === 'drag') {
      this.options.onDragEnd(this.options.dragEngine.end(toPoint(event), event));
    } else if (this._active === 'resize') {
      this.options.onResizeEnd(this.options.resizeEngine.end(toPoint(event), event));
    }

    this.teardown();
  };
}

export function createInteractionManager(options: InteractionManagerOptions): InteractionManager {
  return new InteractionManager(options);
}
