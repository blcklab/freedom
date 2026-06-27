/**
 * dom/scheduler.ts
 *
 * Batches DOM writes to one per animation frame. Pointermove can fire
 * faster than the display refresh rate; without batching, fast mice cause
 * redundant style writes that the browser then has to discard anyway.
 */

export interface FrameScheduler {
  schedule(): void;
  cancel(): void;
}

export function createFrameScheduler(flush: () => void): FrameScheduler {
  let frameHandle: number | null = null;

  return {
    schedule(): void {
      if (frameHandle !== null) return;
      frameHandle = requestAnimationFrame(() => {
        frameHandle = null;
        flush();
      });
    },
    cancel(): void {
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle);
        frameHandle = null;
      }
    },
  };
}
