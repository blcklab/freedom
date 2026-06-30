# freeDOM

A lightweight, framework-agnostic TypeScript library for draggable and resizable DOM windows.

- Draggable windows
- Optional resizing from edges and corners
- Safe first-render positioning, including centered windows
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

## Positioning mode

By default, static elements become `absolute`. Centered viewport windows become `fixed` so overlays center predictably.

You can force a mode when needed:

```ts
freedom.window(element, {
  positioning: 'fixed',
  initialPosition: 'center'
})
```

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

  positioning: 'fixed',
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
- Resize handles win over dragging, so resizing does not accidentally start a drag.

## License

MIT
