# freeDOM

A lightweight, framework-agnostic TypeScript library for draggable and resizable DOM windows.


<p align="left">
  <img src="https://img.shields.io/npm/v/@blcklab/freedom?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/@blcklab/freedom?style=flat-square" alt="downloads" />
  <img src="https://github.com/blcklab/freedom/actions/workflows/test.yml/badge.svg?style=flat-square" alt="tests" />
  <img src="https://img.shields.io/github/license/blcklab/freedom?style=flat-square" alt="license" />
</p>


## Feature

- Draggable windows
- Optional resizing from edges and corners
- Safe first-render positioning, including centered windows
- Position-agnostic initialization: CSS `top/right`, `bottom/left`, `absolute`, `fixed`, `relative`, and normal-flow elements can be used as the starting point
- Zero runtime dependencies
- Pointer Events support: mouse, touch, and pen
- Works with any framework or vanilla JavaScript
- SSR-safe imports: DOM access only happens when you create a window
- Tree-shaking friendly subpath exports

## Installation

```bash
npm install @blcklab/freedom
```

## Quick start

```ts
import { freedom } from '@blcklab/freedom'

const element = document.getElementById('window')!

const win = freedom.window(element, {
  resizable: false
})
```

## Center without first-render flicker

Use `initialPosition: 'center'` to place the window in the center synchronously during initialization.

```ts
import { freedom } from '@blcklab/freedom'

const win = freedom.window(element, {
  initialPosition: 'center',
  initialSize: {
    width: 500,
    height: 320
  },
  resizable: false
})
```

For the strongest zero-flicker setup, hide the element before JavaScript runs:

```css
.my-window {
  position: fixed;
  visibility: hidden;
}
```

Then initialize it:

```ts
freedom.window(element, {
  initialPosition: 'center',
  initialSize: { width: 500, height: 320 }
})
```

By default, freeDOM will reveal an element that starts with `visibility: hidden` after it has synchronously written the initial size and position. Disable that behavior with `autoReveal: false`.

```ts
freedom.window(element, {
  initialPosition: 'center',
  autoReveal: false
})
```

## Custom initial position and size

```ts
freedom.window(element, {
  initialPosition: { x: 100, y: 100 },
  initialSize: { width: 500, height: 320 }
})
```

## Drag only

```ts
const win = freedom.window(element, {
  resizable: false
})
```

## Drag and resize

```ts
const win = freedom.window(element, {
  draggable: true,
  resizable: true,
  minWidth: 200,
  minHeight: 150,
  maxWidth: 800,
  maxHeight: 600
})
```

## Drag handle

Restrict dragging to a title bar or any child element.

```ts
freedom.window(element, {
  dragHandle: '.window-titlebar',
  resizable: true
})
```

## Position-agnostic initialization

freeDOM does not require your CSS to use `top` and `left`. It can start from CSS such as `top/right`, `bottom/left`, an existing `fixed` or `absolute` panel, or even a normal-flow element. During initialization it reads the current rendered location, normalizes the managed window, and then uses transform deltas for smooth movement.

This works:

```css
.my-window {
  position: fixed;
  top: 20px;
  right: 20px;
}
```

```ts
const win = freedom.window(element, {
  dragHandle: '.header',
  resizable: true
})

console.log(win.getPosition()) // the real visual x/y after CSS is resolved
```

Normal-flow elements are preserved by switching them to `position: relative` and moving with transform deltas, so the library does not need to force everything to `top: 0; left: 0`.

You can still force a mode when needed:

```ts
freedom.window(element, {
  positioning: 'fixed', // 'fixed' | 'absolute' | 'relative'
  initialPosition: 'center'
})
```

Available modes are `fixed`, `absolute`, and `relative`.

## Public imports

Root import for the main window API:

```ts
import { freedom, createWindow } from '@blcklab/freedom'
```

Tree-shaking friendly subpath import:

```ts
import { createWindow } from '@blcklab/freedom/window'
```

Optional manager:

```ts
import { createManager } from '@blcklab/freedom/manager'
```

Optional snap plugin:

```ts
import { snapPlugin } from '@blcklab/freedom/plugins/snap'
```

## API

```ts
const win = freedom.window(element)

win.setPosition({ x: 100, y: 100 })
win.setSize({ width: 400, height: 300 })

win.getPosition()
win.getSize()

win.enableDrag()
win.disableDrag()

win.enableResize()
win.disableResize()

win.destroy()
```

## Options

```ts
freedom.window(element, {
  id: 'settings-panel',

  draggable: true,
  resizable: true,

  initialPosition: 'center',
  initialSize: { width: 500, height: 320 },

  positioning: 'fixed', // 'fixed' | 'absolute' | 'relative'
  autoReveal: true,

  minWidth: 200,
  minHeight: 150,
  maxWidth: 800,
  maxHeight: 600,

  dragHandle: '.titlebar',
  bounds: 'viewport'
})
```

## Browser support

Modern browsers supporting the Pointer Events API.

## Notes

- Importing the package is SSR-safe.
- Creating a window must happen in the browser.
- freeDOM does not inject global CSS.
- Runtime styles are applied only to the controlled element and generated resize handles.
- Existing CSS positioning can be used as the initial source of truth; after initialization, freeDOM owns the managed position.
- Resize handles win over dragging, so resizing does not accidentally start a drag.

## License

MIT
