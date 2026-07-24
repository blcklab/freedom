function createManagedWindow(element, id) {
  let zIndex = 0
  let focused = false
  const destroyHandlers = new Set()
  return {
    id,
    element,
    setZIndex(value) { zIndex = value; element.style.zIndex = String(value) },
    getZIndex() { return zIndex },
    focus() { focused = true; element.classList.add('is-focused', 'freedom-focused') },
    blur() { focused = false; element.classList.remove('is-focused', 'freedom-focused') },
    isFocused() { return focused },
    on(event, handler) { if (event === 'destroy') destroyHandlers.add(handler); return () => destroyHandlers.delete(handler) },
    destroy() { for (const handler of [...destroyHandlers]) handler(); destroyHandlers.clear() },
  }
}

export function run({ module }) {
  const manager = module.createManager({ baseZIndex: 20 })
  const ids = ['a', 'b', 'c']
  const entries = new Map()
  const status = document.querySelector('#status')
  for (const [index, id] of ids.entries()) {
    const element = document.querySelector(`#managed-${id}`)
    if (!(element instanceof HTMLElement)) throw new Error(`Missing managed-${id}`)
    const win = createManagedWindow(element, ['alpha', 'beta', 'gamma'][index])
    manager.register(win)
    entries.set(id, { win, registered: true })
  }
  const update = () => { if (status) status.textContent = `${manager.list().length} registered` }
  const cleanups = ids.map((id) => {
    const button = document.querySelector(`#toggle-${id}`)
    const entry = entries.get(id)
    const toggle = () => { entry.registered ? manager.unregister(entry.win) : manager.register(entry.win); entry.registered = !entry.registered; entry.win.element.style.opacity = entry.registered ? '1' : '.35'; update() }
    button?.addEventListener('click', toggle)
    return () => button?.removeEventListener('click', toggle)
  })
  update()
  return () => { for (const cleanup of cleanups) cleanup(); for (const entry of entries.values()) entry.win.destroy(); manager.destroy() }
}
