# Dynamic Bounds

Bounds limit where a window can move or resize.

## Static bounds

```ts
freedom.window(element, {
  bounds: 'viewport'
})
```

```ts
freedom.window(element, {
  bounds: { x: 20, y: 20, width: 800, height: 500 }
})
```

## Parent bounds

```ts
freedom.window(element, {
  positioning: 'absolute',
  bounds: 'parent'
})
```

The parent should be positioned:

```css
.workspace {
  position: relative;
}
```

## Dynamic bounds function

```ts
freedom.window(element, {
  bounds: () => workspace.value?.getBoundingClientRect()
})
```

This is useful when the available area changes because of sidebars, panels, responsive layout, or docking.

## Change bounds later

```ts
win.setBounds('viewport')
win.setBounds(() => workspace.getBoundingClientRect())
win.setBounds(undefined)
```

## Supported values

```ts
type BoundsInput =
  | 'none'
  | 'viewport'
  | 'parent'
  | Rect
  | HTMLElement

type BoundsOption = BoundsInput | (() => BoundsInput | null | undefined)
```
