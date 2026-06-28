/**
 * core/interaction-manager.ts
 *
 * The single owner of raw Pointer Events for a window. Every FreedomWindow
 * has exactly one InteractionManager, and exactly one interaction — drag OR
 * resize, never both — can be active on it at a time. This is now the ONLY
 * place in the library that calls addEventListener, setPointerCapture, or
 * releasePointerCapture. DragEngine/ResizeEngine are pure calculators that
 * never see a raw event listener.
 *
 * Responsibilities:
 *  - One delegated `pointerdown` listener on the window's root element
 *    (resize handles and the drag area are both children of it, so
 *    bubbling gives a single listener instead of one per handle).
 *  - Resolve a pointerdown target to "resize handle X", "drag area", or
 *    "neither" — resize wins ties, since a corner handle visually sits
 *    inside the draggable area too.
 *  - Window-level `pointermove` / `pointerup` / `pointercancel` listeners
 *    that exist ONLY while a gesture is active, and ignore any pointerId
 *    other than the one that started the gesture (no multi-touch chaos).
 *  - Native pointer capture so the gesture keeps tracking even if the
 *    cursor leaves the original target.
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

  /**
   * Resolve a pointerdown target to one of our OWN resize handles, or null.
   * Implicitly encodes "is resizing currently enabled" — return null if
   * resizing (or this specific handle) is disabled right now.
   */
  resolveResizeHandle(target: EventTarget | null): ResizeHandle | null;
  /**
   * Whether a pointerdown target falls within the current drag area.
   * Implicitly encodes "is dragging currently enabled".
   */
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
    if (this._active !== null) return;
    this._active = 'drag';
    this.captureGesture(event);
    const data = this.options.dragEngine.begin(toPoint(event), event);
    this.options.onDragStart(data);
  }

  /** Begins a resize gesture from a pointerdown event. */
  startResize(handle: ResizeHandle, event: PointerEvent): void {
    if (this._active !== null) return;
    this._active = 'resize';
    this.captureGesture(event);
    const data = this.options.resizeEngine.begin(handle, toPoint(event), event);
    this.options.onResizeStart(data);
  }

  /**
   * Aborts whatever is active, silently — no `*end` callback fires.
   * Used when a window disables drag/resize (or is destroyed) mid-gesture,
   * so window-level listeners don't outlive the feature being turned off.
   */
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
    this.captureTarget.setPointerCapture?.(event.pointerId);

    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  private teardown(): void {
    if (this.activePointerId !== null && this.captureTarget) {
      this.captureTarget.releasePointerCapture?.(this.activePointerId);
    }
    this.activePointerId = null;
    this.captureTarget = null;
    this._active = null;
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (this._active !== null) return; // a gesture is already in progress — this is the line that kills the old race
    if (event.pointerType === 'mouse' && event.button !== 0) return; // primary button only

    // Resize wins ties: a corner handle visually sits inside the
    // draggable area too, and should take the gesture over a plain drag.
    const resizeHandle = this.options.resolveResizeHandle(event.target);
    if (resizeHandle) {
      this.startResize(resizeHandle, event);
      return;
    }

    if (this.options.isDragTarget(event.target)) {
      this.startDrag(event);
    }
    // Otherwise: pointerdown landed somewhere we don't care about (a
    // disabled handle, or outside the drag area) — ignore it entirely.
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;

    if (this._active === 'drag') {
      this.options.onDragMove(this.options.dragEngine.move(toPoint(event), event));
    } else if (this._active === 'resize') {
      this.options.onResizeMove(this.options.resizeEngine.move(toPoint(event), event));
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) return;

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
