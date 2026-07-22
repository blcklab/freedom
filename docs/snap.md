# Snap

Snap moves a window to nearby edges while dragging.

## Viewport snap

```ts
import { snapPlugin } from '@blcklab/freedom/plugins/snap'

freedom.window(element, {
  plugins: [
    snapPlugin({
      threshold: 16,
      snapToViewport: true
    })
  ]
})
```

## Custom snap targets

```ts
snapPlugin({
  threshold: 24,
  snapToViewport: false,
  getSnapTargets: () => [
    { id: 'dock', x: 100, y: 100, width: 600, height: 400 }
  ]
})
```

## Snap events

```ts
freedom.window(element, {
  onSnap(data) {
    console.log(data.target.id, data.edges)
  },

  onUnsnap(data) {
    console.log('unsnapped from', data.target.id)
  }
})
```

The snap plugin also accepts callbacks:

```ts
snapPlugin({
  onSnap(data) {},
  onUnsnap(data) {}
})
```
