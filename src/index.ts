/**
 * index.ts
 *
 * Minimal public package entry. Importing this file performs no DOM access by
 * itself — `freedom.window()` only touches the DOM once it is actually called,
 * which keeps the package safe to import during SSR.
 */

import { createWindow } from './runtime/window';

export const freedom = {
  window: createWindow,
};

export default freedom;

export { createWindow };
export { createWindow as window };

export type {
  Point,
  Size,
  Rect,
  Bounds,
  BoundsOption,
  ResizeHandle,
  InitialPosition,
  PositioningMode,
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
