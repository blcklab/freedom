export function run({ module }) {
  const manager = module.createManager({ baseZIndex: 20 })
  const terminal = createMockWindow('terminal')
  const inspector = createMockWindow('inspector')
  const preview = createMockWindow('preview')
  const rows = []

  manager.register(terminal)
  rows.push(snapshot('register terminal', manager))
  manager.register(inspector)
  rows.push(snapshot('register inspector', manager))
  manager.register(preview)
  rows.push(snapshot('register preview', manager))
  manager.unregister(inspector)
  rows.push(snapshot('unregister inspector', manager))
  terminal.destroy()
  rows.push(snapshot('destroy terminal', manager))
  manager.destroy()

  return rows
}

function snapshot(action, manager) {
  return {
    action,
    count: manager.list().length,
    windows: manager.list().map((win) => win.id).join(', ') || 'none',
  }
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
