/**
 * core/pointer.ts
 *
 * A single, reusable Pointer Events controller. Both the drag engine and
 * the resize engine build on this instead of touching addEventListener
 * directly — this is the ONLY place that talks to the raw Pointer Events
 * API, which keeps mouse/touch/pen handling consistent everywhere.
 *
 * Responsibilities:
 *  - Ignore secondary pointers while a gesture is active (no multi-touch chaos)
 *  - Ignore non-primary mouse buttons (right/middle click)
 *  - Use native pointer capture so the gesture keeps tracking even if the
 *    cursor leaves the handle element
 *  - Clean up listeners deterministically on pointerup/pointercancel
 */

export interface PointerDragHandlers {
  onStart(event: PointerEvent): void;
  onMove(event: PointerEvent): void;
  onEnd(event: PointerEvent): void;
}

export interface PointerDragController {
  /** Removes all listeners and releases any active pointer capture. */
  destroy(): void;
}

export function createPointerDragController(
  target: HTMLElement,
  handlers: PointerDragHandlers
): PointerDragController {
  let activePointerId: number | null = null;

  const handlePointerDown = (event: PointerEvent): void => {
    if (activePointerId !== null) return; // a gesture is already in progress
    if (event.pointerType === 'mouse' && event.button !== 0) return; // primary button only

    activePointerId = event.pointerId;
    target.setPointerCapture?.(event.pointerId);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    handlers.onStart(event);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return;
    handlers.onMove(event);
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return;
    handlers.onEnd(event);
    teardownActiveGesture();
  };

  const teardownActiveGesture = (): void => {
    if (activePointerId !== null) {
      target.releasePointerCapture?.(activePointerId);
    }
    activePointerId = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  };

  target.addEventListener('pointerdown', handlePointerDown);

  return {
    destroy(): void {
      target.removeEventListener('pointerdown', handlePointerDown);
      teardownActiveGesture();
    },
  };
}
