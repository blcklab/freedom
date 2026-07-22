# Recipe: API-Controlled Task Board

This recipe shows how to use backend zone names such as `todo`, `inprogress`, and `completed` as freeDOM dock ids.

## API shape

```ts
const zones = [
  { id: 'todo', name: 'Todo' },
  { id: 'inprogress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' }
]

const tasks = [
  { id: 1, title: 'Fix login bug', zone: 'inprogress' },
  { id: 2, title: 'Update docs', zone: 'completed' }
]
```

## Vue setup

```ts
const zoneRefs = new Map<string, HTMLElement>()
const taskRefs = new Map<number, HTMLElement>()
const panes = new Map<number, FreedomWindow>()

function setZoneRef(id: string, el: Element | null) {
  if (el instanceof HTMLElement) zoneRefs.set(id, el)
  else zoneRefs.delete(id)
}

function setTaskRef(id: number, el: Element | null) {
  if (el instanceof HTMLElement) taskRefs.set(id, el)
  else taskRefs.delete(id)
}
```

## Create windows from tasks

```ts
for (const task of tasks.value) {
  const element = taskRefs.get(task.id)
  if (!element) continue

  const win = freedom.window(element, {
    id: `task-${task.id}`,
    positioning: 'fixed',
    initialPosition: { x: 40, y: 40 },
    initialSize: { width: 280, height: 160 },
    dragHandle: '.task-header',
    bounds: 'viewport',
    persist: false,

    dropZones: zones.value.map((zone) => ({
      id: zone.id,
      element: () => zoneRefs.get(zone.id),
      snap: true,
      threshold: 28,
      lockOnDrop: true,
      contains: 'center'
    })),

    async onDock(data) {
      task.zone = data.zone.id ?? ''
      await api.patch(`/tasks/${task.id}`, { zone: task.zone })
    },

    async onUndock() {
      task.zone = ''
      await api.patch(`/tasks/${task.id}`, { zone: null })
    }
  })

  panes.set(task.id, win)

  if (task.zone) {
    win.dock(task.zone)
  }
}
```

## Why this is good

- freeDOM handles drag, snap, dock, and lock behavior.
- Your backend owns the task state.
- Your app can restore each task by calling `win.dock(task.zone)` on page load.
