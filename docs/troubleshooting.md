# Troubleshooting

## The element flashes in the top-left corner

Use the zero-flicker CSS pattern:

```css
.panel {
  position: fixed;
  visibility: hidden;
}
```

Then initialize with size and position:

```ts
freedom.window(element, {
  initialPosition: 'center',
  initialSize: { width: 420, height: 260 }
})
```

freeDOM reveals the element after the initial layout is applied.

## `getPosition()` is not reactive in Vue

`getPosition()` returns a snapshot. Store it in a Vue ref during events:

```ts
const position = ref({ x: 0, y: 0 })

onDrag() {
  position.value = win.getPosition()
}
```

## Dragging starts from the whole window

Set a drag handle:

```ts
freedom.window(element, {
  dragHandle: '.panel-header'
})
```

## Buttons inside the header start dragging

Stop click/pointer propagation on controls when needed:

```vue
<button @pointerdown.stop @click.stop>Close</button>
```

## Docked window is not trapped

Use `lockOnDrop: true`:

```ts
{
  id: 'dock',
  element: () => dockElement,
  lockOnDrop: true,
  contains: 'center'
}
```

## `npm ci` fails in GitHub Actions

Make sure `package-lock.json` is committed and synced with `package.json`:

```bash
rm -rf node_modules package-lock.json
npm install
npm ci
```

Commit both files after the lockfile is regenerated.

## Bundle-size checker says build error

Avoid relying on unconfigured tools such as `npx size-limit` in package scripts. Use `npm pack --dry-run` for package validation, or add a real size-limit config and dependency before enabling it.
