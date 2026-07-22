export function run({ module, inputs }) {
  const manager = module.createManager({ baseZIndex: Number(inputs['base-z-index']) })
  const windows = ['terminal', 'inspector', 'preview'].map(createMockWindow)
  windows.forEach((win) => manager.register(win))

  const sequence = String(inputs.sequence).split(',').map((value) => value.trim()).filter(Boolean)
  for (const id of sequence) {
    const win = windows.find((candidate) => candidate.id === id)
    if (win) manager.focus(win)
  }

  const rows = [...windows]
    .sort((a, b) => b.getZIndex() - a.getZIndex())
    .map((win) => `<tr><td>${win.isFocused() ? `<mark>${win.id}</mark>` : win.id}</td><td>${win.getZIndex()}</td><td>${win.isFocused() ? 'focused' : 'background'}</td></tr>`)
    .join('')

  const focused = manager.getFocused()?.id ?? null
  manager.destroy()

  return {
    html: `<p><strong>Focus stack</strong></p><table><thead><tr><th>Window</th><th>z-index</th><th>State</th></tr></thead><tbody>${rows}</tbody></table><p>Focused window: <code>${focused ?? 'none'}</code></p>`,
    focusSequence: sequence,
    focused,
    windows: windows.map((win) => ({ id: win.id, zIndex: win.getZIndex(), focused: win.isFocused() })),
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
