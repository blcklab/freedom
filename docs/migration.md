# Migration Notes

## From early drag/resize-only versions

Basic usage still works:

```ts
freedom.window(element, {
  resizable: false
})
```

The new APIs are optional and additive.

## Recommended stable setup

```ts
freedom.window(element, {
  initialPosition: 'center',
  initialSize: { width: 420, height: 260 },
  dragHandle: '.header',
  bounds: 'viewport'
})
```

## Positioning

Older versions assumed a top-left controlled position. Newer versions are position agnostic and can read existing CSS positions.

For predictable floating app windows, use:

```css
.panel {
  position: fixed;
  visibility: hidden;
}
```
