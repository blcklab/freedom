# Playground

The freeDOM Playground is split into three focused modules:

- **freeDOM Window** — package exports, browser-boundary verification, configuration builders, positioning, bounds, docking, modes, and persistence state.
- **Window Manager** — live execution of the real `createManager()` focus, registration, event, and z-index behavior.
- **Snap Plugin** — live execution of the real `snapPlugin()` against deterministic custom targets.

## Why window dragging is not interactive here

freeDOM is a browser DOM engine. Creating a real window requires an `HTMLElement`, Pointer Events, layout geometry, and animation frames.

Scriptoria's module adapter intentionally executes editable JavaScript inside a disposable Web Worker. The secure HTML result preview is rendered in a separate no-script iframe. That security model does not expose the preview DOM to the package runner.

Therefore:

- Importing freeDOM is fully supported and SSR-safe.
- The manager and snap plugin can execute in the Worker and are demonstrated live.
- `freedom.window(element, options)` is documented through configuration/state previews and its real browser guard.
- Actual drag, resize, docking, and persistence behavior should be tested in a browser application or a future trusted DOM-specific Scriptoria adapter.

The Playground deliberately avoids pretending that static HTML is a draggable freeDOM window.

## Dedicated Playground

Open the repository's **Playground** page and select one of the three plugins. Every saved example has a permanent URL and editable controls.

## Inline examples

The default inline module is the root freeDOM package. These snippets are safe to run because they do not attempt DOM creation.

### Inspect package exports

```javascript playground
return {
  exports: Object.keys(module).sort(),
  hasWindowFactory: typeof module.freedom?.window === 'function',
}
```

### Verify the browser boundary

```javascript playground
try {
  module.createWindow({})
  return { guarded: false }
} catch (error) {
  return {
    guarded: true,
    message: error instanceof Error ? error.message : String(error),
  }
}
```

### Build browser options

```javascript playground
return {
  initialPosition: 'center',
  initialSize: { width: 420, height: 260 },
  dragHandle: '.panel-header',
  bounds: 'viewport',
  resizable: true,
}
```

## Browser quick start

Use the generated Playground configuration in a real page:

```ts
import { freedom } from '@blcklab/freedom'

const element = document.querySelector<HTMLElement>('#panel')!

const win = freedom.window(element, {
  initialPosition: 'center',
  initialSize: { width: 420, height: 260 },
  dragHandle: '.panel-header',
  bounds: 'viewport',
  resizable: true,
})
```

Destroy the instance when the controlled element is removed:

```ts
win.destroy()
```
