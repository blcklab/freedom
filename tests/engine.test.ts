/**
 * tests/engine.test.ts
 *
 * Same coverage as the original hand-rolled smoke test, ported to vitest.
 * Uses a minimal fake EventTarget instead of jsdom — the engines only need
 * addEventListener/removeEventListener, not a full DOM.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createDragEngine } from '../src/engine/drag';
import { createResizeEngine } from '../src/engine/resize';
import { createManager } from '../src/manager/manager';
import { clamp, clampSize, clampPointToBounds } from '../src/core/math';
import type { FreedomWindow, PluginContext } from '../src/core/types';

class FakeEventTarget {
  private listeners = new Map<string, Set<(e: any) => void>>();
  addEventListener(type: string, handler: (e: any) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(handler);
  }
  removeEventListener(type: string, handler: (e: any) => void): void {
    this.listeners.get(type)?.delete(handler);
  }
  dispatch(type: string, event: any): void {
    for (const handler of this.listeners.get(type) ?? []) handler(event);
  }
}

class FakeElement extends FakeEventTarget {
  style: Record<string, string> = {};
  setPointerCapture(_id: number): void {}
  releasePointerCapture(_id: number): void {}
}

beforeEach(() => {
  (globalThis as any).window = new FakeEventTarget();
});

function fire(target: FakeEventTarget, win: FakeEventTarget, type: string, props: Record<string, unknown>) {
  const event = { pointerId: 1, pointerType: 'mouse', button: 0, ...props };
  if (type === 'pointerdown') target.dispatch('pointerdown', event);
  else win.dispatch(type, event);
}

describe('core/math', () => {
  it('clamp passes through, clamps low, clamps high', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });

  it('clampSize respects min/max', () => {
    const result = clampSize(
      { width: 50, height: 5000 },
      { minWidth: 100, minHeight: 50, maxWidth: 800, maxHeight: 600 }
    );
    expect(result).toEqual({ width: 100, height: 600 });
  });

  it('clampPointToBounds pins the rect inside the bounds', () => {
    const result = clampPointToBounds(
      { x: -50, y: 9999 },
      { width: 200, height: 100 },
      { minX: 0, minY: 0, maxX: 1000, maxY: 800 }
    );
    expect(result).toEqual({ x: 0, y: 700 });
  });
});

describe('engine/drag', () => {
  it('applies the pointer delta to the starting position', () => {
    const handle = new FakeElement();
    const win = (globalThis as any).window as FakeEventTarget;
    let position = { x: 100, y: 100 };
    const size = { width: 200, height: 150 };
    const moves: Array<{ x: number; y: number }> = [];

    createDragEngine(handle as unknown as HTMLElement, {
      element: handle as unknown as HTMLElement,
      bounds: undefined,
      plugins: [],
      pluginContext: {} as PluginContext,
      getPosition: () => position,
      getSize: () => size,
      onStart: () => {},
      onMove: (next) => {
        position = next;
        moves.push(next);
      },
      onEnd: () => {},
    });

    fire(handle, win, 'pointerdown', { clientX: 50, clientY: 50 });
    fire(handle, win, 'pointermove', { clientX: 80, clientY: 40 }); // delta (+30, -10)
    fire(handle, win, 'pointerup', { clientX: 80, clientY: 40 });

    expect(moves).toHaveLength(1);
    expect(position).toEqual({ x: 130, y: 90 });
  });
});

describe('engine/resize', () => {
  it('nw handle shrinks size and anchors the opposite (se) corner', () => {
    const handleEl = new FakeElement();
    const elementEl = new FakeElement();
    const win = (globalThis as any).window as FakeEventTarget;

    let position = { x: 100, y: 100 };
    let size = { width: 300, height: 200 };

    createResizeEngine(handleEl as unknown as HTMLElement, 'nw', {
      element: elementEl as unknown as HTMLElement,
      bounds: undefined,
      minWidth: 50,
      minHeight: 50,
      maxWidth: Infinity,
      maxHeight: Infinity,
      plugins: [],
      pluginContext: {} as PluginContext,
      getPosition: () => position,
      getSize: () => size,
      onStart: () => {},
      onMove: (result) => {
        position = result.position;
        size = result.size;
      },
      onEnd: () => {},
    });

    fire(handleEl, win, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(handleEl, win, 'pointermove', { clientX: 20, clientY: 10 });
    fire(handleEl, win, 'pointerup', { clientX: 20, clientY: 10 });

    expect(size).toEqual({ width: 280, height: 190 });
    expect(position).toEqual({ x: 120, y: 110 });
    expect(position.x + size.width).toBe(400);
    expect(position.y + size.height).toBe(300);
  });

  it('se handle respects minWidth/minHeight without moving the top-left anchor', () => {
    const handleEl = new FakeElement();
    const elementEl = new FakeElement();
    const win = (globalThis as any).window as FakeEventTarget;

    let position = { x: 0, y: 0 };
    let size = { width: 100, height: 100 };

    createResizeEngine(handleEl as unknown as HTMLElement, 'se', {
      element: elementEl as unknown as HTMLElement,
      bounds: undefined,
      minWidth: 80,
      minHeight: 80,
      maxWidth: Infinity,
      maxHeight: Infinity,
      plugins: [],
      pluginContext: {} as PluginContext,
      getPosition: () => position,
      getSize: () => size,
      onStart: () => {},
      onMove: (result) => {
        position = result.position;
        size = result.size;
      },
      onEnd: () => {},
    });

    fire(handleEl, win, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(handleEl, win, 'pointermove', { clientX: -50, clientY: -50 });
    fire(handleEl, win, 'pointerup', { clientX: -50, clientY: -50 });

    expect(size).toEqual({ width: 80, height: 80 });
    expect(position).toEqual({ x: 0, y: 0 });
  });
});

describe('manager/manager', () => {
  function createMockWindow(id: string): FreedomWindow {
    const handlers = new Map<string, Set<(d: unknown) => void>>();
    let zIndex = 0;
    let focused = false;
    return {
      id,
      element: {} as HTMLElement,
      getPosition: () => ({ x: 0, y: 0 }),
      getSize: () => ({ width: 0, height: 0 }),
      setPosition: () => {},
      setSize: () => {},
      focus: () => { focused = true; },
      blur: () => { focused = false; },
      isFocused: () => focused,
      setZIndex: (z: number) => { zIndex = z; },
      getZIndex: () => zIndex,
      enableDrag: () => {},
      disableDrag: () => {},
      enableResize: () => {},
      disableResize: () => {},
      destroy: () => {
        for (const set of handlers.values()) for (const h of set) h(undefined);
      },
      on: (event, handler) => {
        const key = String(event);
        if (!handlers.has(key)) handlers.set(key, new Set());
        handlers.get(key)!.add(handler as (d: unknown) => void);
        return () => handlers.get(key)?.delete(handler as (d: unknown) => void);
      },
    };
  }

  it('assigns increasing z-index on register, and tracks focus/blur', () => {
    const manager = createManager({ baseZIndex: 10 });
    const a = createMockWindow('a');
    const b = createMockWindow('b');
    const c = createMockWindow('c');

    manager.register(a);
    manager.register(b);
    manager.register(c);
    expect([a.getZIndex(), b.getZIndex(), c.getZIndex()]).toEqual([11, 12, 13]);

    manager.focus(a);
    expect(a.isFocused()).toBe(true);
    expect(a.getZIndex()).toBe(14);
    expect(manager.getFocused()).toBe(a);

    manager.focus(b);
    expect(a.isFocused()).toBe(false);
    expect(b.isFocused()).toBe(true);

    manager.unregister(b);
    expect(manager.list()).toHaveLength(2);
    expect(manager.getFocused()).toBeNull();
  });
});
