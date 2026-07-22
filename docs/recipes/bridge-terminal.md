# Recipe: Bridge Terminal Window

freeDOM is a good fit for a floating terminal or command palette.

```ts
const terminal = freedom.window(element, {
  id: 'bridge-terminal',
  initialPosition: 'center',
  initialSize: { width: 720, height: 460 },
  minWidth: 360,
  minHeight: 220,
  dragHandle: '.bridge-header',
  bounds: 'viewport',
  persist: {
    key: 'bridge:terminal',
    restore: true,
    save: true
  }
})
```

## Minimize

```ts
terminal.minimize({ height: 48 })
```

## Restore

```ts
terminal.restore()
```

## Maximize

```ts
terminal.maximize()
```

## Recommended CSS

```css
.bridge-terminal {
  position: fixed;
  visibility: hidden;
  overflow: hidden;
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.94);
  color: white;
}

.bridge-header {
  height: 48px;
  cursor: move;
  user-select: none;
}

.bridge-terminal.freedom-minimized .bridge-body {
  display: none;
}
```
