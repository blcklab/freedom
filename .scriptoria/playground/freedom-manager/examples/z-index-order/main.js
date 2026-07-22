export function run({ module, inputs }) {
  const manager = module.createManager({ baseZIndex: Number(inputs.base) })
  const windows = ['one', 'two', 'three', 'four'].map(createMockWindow)
  windows.forEach((win) => manager.register(win))

  const cycles = Number(inputs.cycles)
  for (let index = 0; index < cycles; index += 1) {
    manager.bringToFront(windows[index % windows.length])
  }

  const order = [...windows].sort((a, b) => b.getZIndex() - a.getZIndex())
  const list = order.map((win, index) => `<li>${index === 0 ? `<mark>${win.id}</mark>` : win.id} — z-index ${win.getZIndex()}</li>`).join('')
  const focused = manager.getFocused()?.id ?? null
  manager.destroy()

  return {
    html: `<p><strong>Front-to-back order</strong></p><ol>${list}</ol><p>Focused: <code>${focused ?? 'none'}</code></p>`,
    cycles,
    focused,
    order: order.map((win) => ({ id: win.id, zIndex: win.getZIndex() })),
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
