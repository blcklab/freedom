# Persistence

freeDOM can persist layout locally, or your app can save state manually to an API.

## Built-in localStorage persistence

```ts
freedom.window(element, {
  id: 'terminal',
  persist: true
})
```

This stores position, size, window mode, restore snapshot, and docked zone id.

## Custom key

```ts
freedom.window(element, {
  id: 'terminal',
  persist: {
    key: 'my-app:terminal',
    restore: true,
    save: true
  }
})
```

## Manual state methods

```ts
win.saveState()
win.restoreState()
win.clearState()
```

## App-owned backend persistence

Use events and instance getters:

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
  onUndock: saveLayout,
  onMinimize: saveLayout,
  onMaximize: saveLayout,
  onRestore: saveLayout
})
```

For company apps, app-owned backend persistence is usually the best choice.
