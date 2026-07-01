import { describe, it, expect, beforeEach } from 'vitest';
import { createDragEngine } from '../src/engine/drag';
import { createResizeEngine } from '../src/engine/resize';
import { createManager } from '../src/manager/manager';
import { clamp, clampSize, clampPointToBounds } from '../src/core/math';
import type { FreedomWindow, PluginContext, ResizeHandle } from '../src/core/types';

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
    const element = new FakeElement();
    let position = { x: 100, y: 100 };
    const size = { width: 200, height: 150 };

    const engine = createDragEngine({
      element: element as unknown as HTMLElement,
      bounds: undefined,
      plugins: [],
      pluginContext: {} as PluginContext,
      getPosition: () => position,
      getSize: () => size,
    });

    engine.begin({ x: 50, y: 50 }, {} as PointerEvent);
    const result = engine.move({ x: 80, y: 40 }, {} as PointerEvent);
    position = result.position;

    expect(position).toEqual({ x: 130, y: 90 });
  });
});

describe('engine/resize', () => {
  function makeEngine(handle: ResizeHandle) {
    const elementEl = new FakeElement();
    let position = { x: 100, y: 100 };
    let size = { width: 300, height: 200 };

    const engine = createResizeEngine({
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
    });

    engine.begin(handle, { x: 0, y: 0 }, {} as PointerEvent);

    return {
      move(pointer: { x: number; y: number }) {
        const result = engine.move(pointer, {} as PointerEvent);
        position = result.position;
        size = result.size;
        return result;
      },
      get position() {
        return position;
      },
      get size() {
        return size;
      },
    };
  }

  it('nw handle shrinks size and anchors the opposite (se) corner', () => {
    const resize = makeEngine('nw');
    resize.move({ x: 20, y: 10 });

    expect(resize.size).toEqual({ width: 280, height: 190 });
    expect(resize.position).toEqual({ x: 120, y: 110 });
    expect(resize.position.x + resize.size.width).toBe(400);
    expect(resize.position.y + resize.size.height).toBe(300);
  });

  it('se handle respects minWidth/minHeight without moving the top-left anchor', () => {
    const elementEl = new FakeElement();
    let position = { x: 0, y: 0 };
    let size = { width: 100, height: 100 };

    const engine = createResizeEngine({
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
    });

    engine.begin('se', { x: 0, y: 0 }, {} as PointerEvent);
    const result = engine.move({ x: -50, y: -50 }, {} as PointerEvent);
    position = result.position;
    size = result.size;

    expect(size).toEqual({ width: 80, height: 80 });
    expect(position).toEqual({ x: 0, y: 0 });
  });

  it('e and w handles resize width only', () => {
    const east = makeEngine('e');
    east.move({ x: 25, y: 80 });
    expect(east.size).toEqual({ width: 325, height: 200 });
    expect(east.position).toEqual({ x: 100, y: 100 });

    const west = makeEngine('w');
    west.move({ x: 25, y: 80 });
    expect(west.size).toEqual({ width: 275, height: 200 });
    expect(west.position).toEqual({ x: 125, y: 100 });
    expect(west.position.x + west.size.width).toBe(400);
  });

  it('n and s handles resize height only', () => {
    const south = makeEngine('s');
    south.move({ x: 80, y: 25 });
    expect(south.size).toEqual({ width: 300, height: 225 });
    expect(south.position).toEqual({ x: 100, y: 100 });

    const north = makeEngine('n');
    north.move({ x: 80, y: 25 });
    expect(north.size).toEqual({ width: 300, height: 175 });
    expect(north.position).toEqual({ x: 100, y: 125 });
    expect(north.position.y + north.size.height).toBe(300);
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

import { createWindow } from '../src/runtime/window';

class FakeHTMLElement extends FakeEventTarget {
  nodeType = 1;
  style: Record<string, string> = {};
  classList = {
    add: (..._tokens: string[]) => {},
    remove: (..._tokens: string[]) => {},
  };
  dataset: Record<string, string> = {};
  offsetLeft = 0;
  offsetTop = 0;
  offsetWidth = 0;
  offsetHeight = 0;
  clientWidth = 0;
  clientHeight = 0;
  offsetParent: FakeHTMLElement | null = null;
  children: FakeHTMLElement[] = [];

  constructor(private rect = { left: 0, top: 0, width: 0, height: 0 }) {
    super();
  }

  getBoundingClientRect() {
    return this.rect;
  }

  appendChild(child: FakeHTMLElement): FakeHTMLElement {
    this.children.push(child);
    return child;
  }

  querySelector(): FakeHTMLElement | null {
    return null;
  }

  contains(target: unknown): boolean {
    return target === this || this.children.includes(target as FakeHTMLElement);
  }

  closest(): FakeHTMLElement | null {
    return null;
  }

  remove(): void {}
}

function installRuntimeDom() {
  const fakeWindow = new FakeEventTarget() as any;
  fakeWindow.innerWidth = 1000;
  fakeWindow.innerHeight = 700;
  fakeWindow.scrollX = 0;
  fakeWindow.scrollY = 0;
  fakeWindow.requestAnimationFrame = (callback: FrameRequestCallback) => { callback(0); return 1; };
  fakeWindow.cancelAnimationFrame = () => {};
  fakeWindow.getComputedStyle = (element: FakeHTMLElement) => ({
    position: element.style.position || 'static',
    visibility: element.style.visibility || 'visible',
    top: element.style.top || 'auto',
    right: element.style.right || 'auto',
    bottom: element.style.bottom || 'auto',
    left: element.style.left || 'auto',
  });

  (globalThis as any).requestAnimationFrame = fakeWindow.requestAnimationFrame;
  (globalThis as any).cancelAnimationFrame = fakeWindow.cancelAnimationFrame;

  (globalThis as any).window = fakeWindow;
  (globalThis as any).document = {
    documentElement: { clientWidth: 1000, clientHeight: 700 },
    createElement: () => new FakeHTMLElement(),
  };
  (globalThis as any).Node = FakeHTMLElement;
  (globalThis as any).Element = FakeHTMLElement;
}

describe('runtime/window initialization', () => {
  beforeEach(() => {
    installRuntimeDom();
  });

  it('centers synchronously without a top-left first paint', () => {
    const element = new FakeHTMLElement({ left: 0, top: 0, width: 500, height: 300 }) as unknown as HTMLElement;

    const win = createWindow(element, {
      initialPosition: 'center',
      resizable: false,
    });

    expect(element.style.position).toBe('fixed');
    expect(element.style.top).toBe('200px');
    expect(element.style.left).toBe('250px');
    expect(element.style.right).toBe('auto');
    expect(element.style.bottom).toBe('auto');
    expect(element.style.width).toBe('500px');
    expect(element.style.height).toBe('300px');
    expect(element.style.transform).toBe('');
    expect(win.getPosition()).toEqual({ x: 250, y: 200 });
  });

  it('uses custom initial position synchronously', () => {
    const element = new FakeHTMLElement({ left: 0, top: 0, width: 400, height: 240 }) as unknown as HTMLElement;

    createWindow(element, {
      initialPosition: { x: 40, y: 80 },
      initialSize: { width: 400, height: 240 },
      resizable: false,
    });

    expect(element.style.position).toBe('fixed');
    expect(element.style.left).toBe('40px');
    expect(element.style.top).toBe('80px');
    expect(element.style.transform).toBe('');
    expect(element.style.width).toBe('400px');
    expect(element.style.height).toBe('240px');
  });

  it('supports the hidden-until-initialized zero-flicker CSS pattern', () => {
    const element = new FakeHTMLElement({ left: 0, top: 0, width: 300, height: 200 }) as unknown as HTMLElement;
    element.style.visibility = 'hidden';

    createWindow(element, {
      initialPosition: 'center',
      resizable: false,
    });

    expect(element.style.visibility).toBe('visible');
    expect(element.style.left).toBe('350px');
    expect(element.style.top).toBe('250px');
    expect(element.style.transform).toBe('');
  });

  it('normalizes fixed top/right CSS without assuming top-left input', () => {
    const element = new FakeHTMLElement({ left: 580, top: 20, width: 400, height: 240 }) as unknown as HTMLElement;
    element.style.position = 'fixed';
    element.style.top = '20px';
    element.style.right = '20px';

    const win = createWindow(element, { resizable: false });

    expect(element.style.position).toBe('fixed');
    expect(element.style.left).toBe('580px');
    expect(element.style.top).toBe('20px');
    expect(element.style.right).toBe('auto');
    expect(element.style.bottom).toBe('auto');
    expect(element.style.transform).toBe('');
    expect(win.getPosition()).toEqual({ x: 580, y: 20 });
  });

  it('keeps normal-flow elements position agnostic by using relative + transform deltas', () => {
    const element = new FakeHTMLElement({ left: 120, top: 80, width: 300, height: 200 }) as unknown as HTMLElement;

    const win = createWindow(element, { resizable: false });

    expect(element.style.position).toBe('relative');
    expect(element.style.left).toBeUndefined();
    expect(element.style.top).toBeUndefined();
    expect(element.style.transform).toBe('');
    expect(win.getPosition()).toEqual({ x: 120, y: 80 });

    win.setPosition({ x: 150, y: 130 });
    expect(element.style.transform).toBe('translate3d(30px, 50px, 0)');
    expect(win.getPosition()).toEqual({ x: 150, y: 130 });
  });

  it('throws clear errors for invalid elements, duplicate instances, and destroyed instances', () => {
    expect(() => createWindow(null as unknown as HTMLElement)).toThrow(/expected a real HTMLElement/i);

    const element = new FakeHTMLElement({ left: 0, top: 0, width: 100, height: 100 }) as unknown as HTMLElement;
    const win = createWindow(element, { resizable: false });

    expect(() => createWindow(element, { resizable: false })).toThrow(/more than once/i);

    win.destroy();
    expect(() => win.setPosition({ x: 1, y: 1 })).toThrow(/destroyed/i);
  });
});
