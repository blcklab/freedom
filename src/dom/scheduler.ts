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
