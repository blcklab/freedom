# Minimize, Maximize, and Restore

freeDOM provides behavior helpers. You control the UI buttons and styling.

## Minimize

```ts
win.minimize({ height: 52 })
win.isMinimized()
```

## Maximize

```ts
win.maximize()
win.isMaximized()
```

Maximize to custom bounds:

```ts
win.maximize({
  bounds: () => workspace.getBoundingClientRect()
})
```

## Restore

```ts
win.restore()
```

Restore returns to the previous normal position and size when available.

## Styling modes

freeDOM adds classes:

```css
.freedom-minimized {}
.freedom-maximized {}
```

Example:

```css
.panel.freedom-minimized .panel-body {
  display: none;
}
```
