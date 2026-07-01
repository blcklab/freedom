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
