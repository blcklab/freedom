# Drop Zones and Docking

Drop zones let a window snap into a named area and optionally stay trapped there.

## Basic dock zone

```ts
freedom.window(element, {
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
    console.log('docked in', data.zone.id)
  },

  onUndock(data) {
    console.log('undocked from', data.zone.id)
  }
})
```

## Multiple dock zones

```ts
dropZones: [
  { id: 'todo', element: () => todoEl, snap: true, lockOnDrop: true },
  { id: 'inprogress', element: () => progressEl, snap: true, lockOnDrop: true },
  { id: 'completed', element: () => completedEl, snap: true, lockOnDrop: true }
]
```

A window should be docked to one active zone at a time.

## Manual docking

```ts
win.dock('inprogress')
win.getDockedZone()
win.isDocked()
```

## Undock

```ts
win.undock({ x: 40, y: 40 })
```

## Detection modes

```ts
contains: 'center'
contains: 'intersect'
contains: 'full'
```

Use `center` for task cards and panels. It feels forgiving because the user only needs to move the center into the zone.

## API-controlled default dock

If your backend returns the task zone, use that zone as the dock id:

```ts
const task = {
  id: 123,
  title: 'Fix login bug',
  zone: 'inprogress'
}

const win = freedom.window(element, {
  dropZones: zones.map((zone) => ({
    id: zone.id,
    element: () => zoneRefs.get(zone.id),
    snap: true,
    lockOnDrop: true,
    contains: 'center'
  }))
})

win.dock(task.zone)
```
