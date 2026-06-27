/**
 * index.ts
 *
 * Public package entry point. Importing this file performs no DOM access
 * by itself — `freedom.window()` only touches the DOM once it's actually
 * called, which keeps the package safe to import during SSR.
 */

import { createWindow } from './runtime/window';
import { createManager } from './manager/manager';
import { snapPlugin } from './plugins/snap';

export const freedom = {
  window: createWindow,
  manager: createManager,
  plugins: {
    snap: snapPlugin,
  },
};

export default freedom;

// Named exports for consumers who prefer `import { window } from 'freedom'`
export { createWindow as window, createManager as manager, snapPlugin };

export type {
  Point,
  Size,
  Rect,
  Bounds,
  BoundsOption,
  ResizeHandle,
  DragEventData,
  ResizeEventData,
  WindowEventMap,
  ManagerEventMap,
  FreedomPlugin,
  PluginContext,
  FreedomWindow,
  FreedomWindowOptions,
  FreedomManager,
  FreedomManagerOptions,
} from './core/types';

export type { SnapPluginOptions } from './plugins/snap';
