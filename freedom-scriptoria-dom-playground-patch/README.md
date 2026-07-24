# freeDOM

A lightweight, framework-agnostic DOM window engine for draggable, resizable, and dockable UI.

freeDOM is designed for apps that need floating panels, workspace windows, terminal overlays, dashboards, builders, or dockable task panels without bringing in a heavy UI framework.

## Features

- Draggable windows
- Optional resizing from edges and corners
- Drag handles
- Safe first-render positioning, including centered windows
- Position-agnostic initialization from existing CSS
- Dynamic bounds
- Drop zones and docking
- Snap events
- Optional state persistence
- Minimize, maximize, and restore helpers
- Window manager for focus and z-index
- Zero runtime dependencies
- TypeScript-first
- SSR-safe imports
- Tree-shaking-friendly subpath exports

## Installation

```bash
npm install @blcklab/freedom
```

## Quick start

```ts
import { freedom } from '@blcklab/freedom'

const element = document.querySelector<HTMLElement>('#panel')!

const win = freedom.window(element, {
  initialPosition: 'center',
  initialSize: { width: 420, height: 260 },
  dragHandle: '.panel-header',
  bounds: 'viewport'
})
```

```css
.panel {
  position: fixed;
  visibility: hidden;
  overflow: hidden;
}

.panel-header {
  cursor: move;
  user-select: none;
}
```

The `visibility: hidden` pattern prevents top-left first paint. freeDOM reveals the element after the initial position and size are applied.

## Imports

```ts
import { freedom, createWindow } from '@blcklab/freedom'
import { createWindow } from '@blcklab/freedom/window'
import { createManager } from '@blcklab/freedom/manager'
import { snapPlugin } from '@blcklab/freedom/plugins/snap'
```

## Vue example

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { freedom, type FreedomWindow } from '@blcklab/freedom'

const panel = ref<HTMLElement | null>(null)
const win = shallowRef<FreedomWindow | null>(null)

onMounted(() => {
  if (!panel.value) return

  win.value = freedom.window(panel.value, {
    initialPosition: 'center',
    initialSize: { width: 420, height: 260 },
    dragHandle: '.panel-header',
    bounds: 'viewport'
  })
})

onBeforeUnmount(() => {
  win.value?.destroy()
})
</script>

<template>
  <div ref="panel" class="panel">
    <div class="panel-header">Panel</div>
    <div class="panel-body">Drag me from the header.</div>
  </div>
</template>
```

## Dock zones

```ts
const win = freedom.window(element, {
  positioning: 'fixed',
  initialPosition: { x: 40, y: 40 },
  initialSize: { width: 360, height: 220 },
  dragHandle: '.panel-header',
  bounds: 'viewport',

  dropZones: [
    {
      id: 'inprogress',
      element: () => document.querySelector<HTMLElement>('#inprogress'),
      snap: true,
      threshold: 28,
      lockOnDrop: true,
      contains: 'center'
    }
  ],

  onDock(data) {
    console.log('Docked:', data.zone.id)
  }
})

win.dock('inprogress')
win.undock({ x: 40, y: 40 })
```

## App-owned persistence

freeDOM can persist to `localStorage`, but production apps can save layout to their own backend.

```ts
async function saveLayout() {
  await api.patch('/layout/task-123', {
    position: win.getPosition(),
    size: win.getSize(),
    dockedZone: win.getDockedZone()?.id ?? null,
    minimized: win.isMinimized(),
    maximized: win.isMaximized()
  })
}

freedom.window(element, {
  persist: false,
  onDragEnd: saveLayout,
  onResizeEnd: saveLayout,
  onDock: saveLayout,
  onUndock: saveLayout
})
```

## Instance API

```ts
win.setPosition({ x: 100, y: 100 })
win.setSize({ width: 400, height: 300 })

win.getPosition()
win.getSize()

win.setBounds('viewport')
win.getBounds()

win.dock('dock')
win.undock({ x: 40, y: 40 })
win.isDocked()
win.getDockedZone()

win.minimize({ height: 52 })
win.maximize()
win.restore()

win.saveState()
win.restoreState()
win.clearState()

win.enableDrag()
win.disableDrag()
win.enableResize()
win.disableResize()

win.destroy()
```

## Documentation

Complete docs are included in the repository under [`/docs`](./docs/index.md).

Start here:

- [Installation](./docs/installation.md)
- [Quick Start](./docs/quick-start.md)
- [Interactive Playground](./docs/playground.md)
- [Vue Usage](./docs/vue.md)
- [Dynamic Bounds](./docs/bounds.md)
- [Drop Zones and Docking](./docs/docking.md)
- [Persistence](./docs/persistence.md)
- [Task Board Recipe](./docs/recipes/task-board.md)
- [API Reference](./docs/api/reference.md)

The docs folder is intentionally not included in the npm `files` list, so package installs stay lightweight.

## Browser support

Modern browsers with Pointer Events support.

## Notes

- Importing is SSR-safe.
- Creating a window must run in the browser.
- freeDOM does not inject global CSS.
- Runtime styles are applied only to the controlled element and generated resize handles.
- Existing CSS positioning can be used as the initial source of truth.
- Resize handles win over dragging.

## License

MIT
