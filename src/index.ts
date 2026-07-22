import { createWindow } from './runtime/window';

export const freedom = {
  window: createWindow,
};

export default freedom;

export { createWindow };
export { createWindow as window };

export type {
  Bounds,
  BoundsInput,
  BoundsOption,
  BoundsResolver,
  DockEventData,
  DragEventData,
  DropZone,
  FreedomManager,
  FreedomManagerOptions,
  FreedomPlugin,
  FreedomWindow,
  FreedomWindowOptions,
  InitialPosition,
  ManagerEventMap,
  MaximizeOptions,
  MinimizeOptions,
  PersistOptions,
  PersistedWindowState,
  PluginContext,
  Point,
  PositioningMode,
  Rect,
  ResizeEventData,
  ResizeHandle,
  Size,
  SnapEdge,
  SnapEventData,
  SnapTarget,
  WindowEventMap,
  WindowMode,
} from './core/types';
