import type { FreedomPlugin, Point, Rect, SnapEdge, SnapEventData, SnapTarget, Size } from '../core/types';

export interface SnapPluginOptions {
  threshold?: number;
  snapToViewport?: boolean;
  getSnapTargets?(): Array<Rect | SnapTarget>;
  onSnap?(data: SnapEventData): void;
  onUnsnap?(data: SnapEventData): void;
}

export function snapPlugin(options: SnapPluginOptions = {}): FreedomPlugin {
  const threshold = options.threshold ?? 8;
  const snapToViewport = options.snapToViewport ?? true;
  let lastSnap: SnapEventData | null = null;

  return {
    name: 'freedom-snap',

    onDrag(data, ctx) {
      const size = ctx.window.getSize();
      const result = snapPoint(data.position, size, getTargets(), threshold);

      if (result.snap) {
        const snapData: SnapEventData = {
          target: result.snap.target,
          edges: result.snap.edges,
          position: result.position,
          size,
          pointerEvent: data.pointerEvent,
        };

        const key = snapKey(snapData);
        if (!lastSnap || snapKey(lastSnap) !== key) {
          lastSnap = snapData;
          options.onSnap?.(snapData);
          ctx.emit('snap', snapData);
        }
      } else if (lastSnap) {
        const unsnapData = { ...lastSnap, position: result.position, size, pointerEvent: data.pointerEvent };
        lastSnap = null;
        options.onUnsnap?.(unsnapData);
        ctx.emit('unsnap', unsnapData);
      }

      return result.position;
    },

    onDestroy() {
      lastSnap = null;
    },
  };

  function getTargets(): SnapTarget[] {
    const targets: SnapTarget[] = [];

    if (snapToViewport && typeof window !== 'undefined') {
      targets.push({ id: 'viewport', x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    }

    if (options.getSnapTargets) {
      for (const target of options.getSnapTargets()) {
        targets.push({ ...target });
      }
    }

    return targets;
  }
}

export function snapPoint(
  point: Point,
  size: Size,
  targets: SnapTarget[],
  threshold: number
): { position: Point; snap: { target: SnapTarget; edges: SnapEdge[] } | null } {
  let x = point.x;
  let y = point.y;
  let snap: { target: SnapTarget; edges: SnapEdge[] } | null = null;

  for (const target of targets) {
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

    if (edges.length > 0) {
      snap = { target, edges };
    }
  }

  return { position: { x, y }, snap };
}

function snapKey(data: SnapEventData): string {
  return `${data.target.id ?? `${data.target.x}:${data.target.y}:${data.target.width}:${data.target.height}`}:${data.edges.join(',')}`;
}
