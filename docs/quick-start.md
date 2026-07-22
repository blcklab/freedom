# Quick Start

## HTML

```html
<div id="panel" class="panel">
  <div class="panel-header">Panel</div>
  <div class="panel-body">Drag me around.</div>
</div>
```

## CSS

```css
.panel {
  position: fixed;
  visibility: hidden;
  overflow: hidden;
  width: 420px;
  height: 260px;
  border-radius: 16px;
  background: #0f172a;
  color: white;
}

.panel-header {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  cursor: move;
  user-select: none;
  background: #334155;
}

.panel-body {
  padding: 20px;
}
```

The `visibility: hidden` pattern prevents a top-left first paint. freeDOM reveals the element after initial position and size are applied.

## TypeScript

```ts
import { freedom } from '@blcklab/freedom'

const element = document.querySelector<HTMLElement>('#panel')!

const win = freedom.window(element, {
  initialPosition: 'center',
  initialSize: { width: 420, height: 260 },
  dragHandle: '.panel-header',
  bounds: 'viewport',
  resizable: true
})
```

## Instance methods

```ts
win.setPosition({ x: 100, y: 100 })
win.setSize({ width: 500, height: 320 })

console.log(win.getPosition())
console.log(win.getSize())

win.destroy()
```
