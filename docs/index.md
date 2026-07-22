# freeDOM Documentation

freeDOM is a lightweight, framework-agnostic DOM window engine for draggable, resizable, and dockable interfaces.

It is designed for apps that need floating panels without buying into a UI framework or a heavy drag-and-drop system.

## What freeDOM handles

- Dragging
- Resizing
- Drag handles
- Dynamic bounds
- Snap targets
- Drop zones and docking
- Minimize, maximize, and restore helpers
- Optional local state persistence
- Framework integration through normal DOM refs

## What freeDOM does not handle

- Task data
- Backend persistence
- Authentication
- Permissions
- UI components or styling
- Kanban list sorting
- Database state

The intended model is simple:

```txt
freeDOM handles window behavior.
Your app handles business data.
```

## Install

```bash
npm install @blcklab/freedom
```

## Quick example

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

## Recommended docs order

1. [Installation](./installation.md)
2. [Quick Start](./quick-start.md)
3. [Positioning](./positioning.md)
4. [Vue Usage](./vue.md)
5. [Dynamic Bounds](./bounds.md)
6. [Snap](./snap.md)
7. [Drop Zones and Docking](./docking.md)
8. [Persistence](./persistence.md)
9. [Minimize and Maximize](./minimize-maximize.md)
10. [Manager](./manager.md)
11. [API Reference](./api/reference.md)
12. [Task Board Recipe](./recipes/task-board.md)
13. [Bridge Terminal Recipe](./recipes/bridge-terminal.md)
14. [Troubleshooting](./troubleshooting.md)
