export function run({ module }) {
  const manager = module.createManager({ baseZIndex: 50 })
  const events = []
  const windows = [createMockWindow('alpha'), createMockWindow('beta')]

  for (const event of ['register', 'unregister', 'focus', 'blur']) {
    manager.on(event, (win) => events.push({ event, window: win.id, 'z-index': win.getZIndex() }))
  }

  manager.register(windows[0])
  manager.register(windows[1])
  manager.focus(windows[0])
  manager.focus(windows[1])
  manager.unregister(windows[0])
  manager.destroy()

  return events
}


function createMockWindow(id) {
  let zIndex = 0
  let focused = false
  const listeners = new Map()

  return {
    id,
    element: null,
    setZIndex(value) { zIndex = value },
    getZIndex() { return zIndex },
    focus() { focused = true },
    blur() { focused = false },
    isFocused() { return focused },
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event).add(handler)
      return () => listeners.get(event)?.delete(handler)
    },
    destroy() {
      for (const handler of listeners.get('destroy') ?? []) handler()
    },
  }
}
