# Positioning

freeDOM is position agnostic. It can use your existing CSS as the starting point.

Supported positioning modes:

```ts
type PositioningMode = 'fixed' | 'absolute' | 'relative'
```

## Recommended floating window

```css
.panel {
  position: fixed;
  visibility: hidden;
}
```

```ts
freedom.window(element, {
  initialPosition: 'center',
  initialSize: { width: 420, height: 260 }
})
```

## Existing top/right CSS

```css
.panel {
  position: fixed;
  top: 20px;
  right: 20px;
}
```

```ts
const win = freedom.window(element, {
  dragHandle: '.panel-header'
})
```

freeDOM reads the rendered position, then normalizes it internally for stable dragging/resizing.

## Absolute inside a parent

```css
.workspace {
  position: relative;
}

.panel {
  position: absolute;
  top: 20px;
  left: 20px;
}
```

```ts
freedom.window(element, {
  positioning: 'absolute',
  bounds: 'parent'
})
```

## Normal-flow elements

If the element starts in normal layout flow, freeDOM uses relative positioning and transform deltas.

```ts
freedom.window(element, {
  resizable: false
})
```

Use this only when preserving normal document layout is important. For floating app windows, prefer `position: fixed`.
