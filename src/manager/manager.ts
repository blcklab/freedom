import type {
  FreedomManager,
  FreedomManagerOptions,
  FreedomWindow,
  ManagerEventMap,
} from '../core/types';
import { Emitter } from '../core/events';

export function createManager(options: FreedomManagerOptions = {}): FreedomManager {
  const baseZIndex = options.baseZIndex ?? 1;

  const windows: FreedomWindow[] = [];
  const unsubscribeDestroy = new Map<FreedomWindow, () => void>();
  const emitter = new Emitter<ManagerEventMap>();

  let topZIndex = baseZIndex;
  let focused: FreedomWindow | null = null;

  function register(win: FreedomWindow): void {
    if (windows.includes(win)) return;

    windows.push(win);
    topZIndex += 1;
    win.setZIndex(topZIndex);

    const off = win.on('destroy', () => unregister(win));
    unsubscribeDestroy.set(win, off);

    emitter.emit('register', win);
  }

  function unregister(win: FreedomWindow): void {
    const index = windows.indexOf(win);
    if (index === -1) return;

    windows.splice(index, 1);
    unsubscribeDestroy.get(win)?.();
    unsubscribeDestroy.delete(win);

    if (focused === win) {
      focused = null;
      win.blur();
    }

    emitter.emit('unregister', win);
  }

  function focus(win: FreedomWindow): void {
    if (!windows.includes(win) || focused === win) return;

    const previous = focused;
    topZIndex += 1;
    win.setZIndex(topZIndex);
    win.focus();
    focused = win;

    if (previous) {
      previous.blur();
      emitter.emit('blur', previous);
    }
    emitter.emit('focus', win);
  }

  function destroy(): void {
    for (const win of windows) unsubscribeDestroy.get(win)?.();
    windows.length = 0;
    unsubscribeDestroy.clear();
    focused = null;
    emitter.clear();
  }

  return {
    register,
    unregister,
    focus,
    bringToFront: focus,
    getFocused: () => focused,
    list: () => [...windows],
    on: (event, handler) => emitter.on(event, handler),
    destroy,
  };
}
