# freeDOM

A lightweight, framework-agnostic library for draggable and resizable windows.

- Draggable windows
- Optional resizing
- Zero dependencies
- pointer Events support (mouse, touch & pen)
- Works with any framework or vanilla JavaScript
- Written in TypeScript

## Installation

```bash
npm install @blcklab/freedom
```

## Usage

```ts
import { freedom } from '@blcklab/freedom'

const element = document.getElementById('window')!

const win = freedom.window(element, {
  resizable: false
})
```

## Drag Only

```ts
const win = freedom.window(element, {
  resizable: false
})
```

## Drag & Resize

```ts
const win = freedom.window(element, {
  resizable: true
})
```

## Options

```ts
freedom.window(element, {
  draggable: true,
  resizable: true,
  minWidth: 200,
  minHeight: 150,
  maxWidth: 800,
  maxHeight: 600
})
```

## API

```ts
const win = freedom.window(element)

win.setPosition({ x: 100, y: 100 })
win.setSize({ width: 400, height: 300 })

win.getPosition()
win.getSize()

win.destroy()
```

## Browser Support

Modern browsers supporting the Pointer Events API.

## License

MIT