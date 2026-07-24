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
  const manager = module.createManager({ baseZIndex: 50 })
  const log = document.querySelector('#log')
  const lines = []
  const write = (event, win) => { lines.unshift(`${event.padEnd(10)} ${win.id}`); lines.splice(10); if (log) log.textContent = lines.join('\n') }
  const windows = ['a', 'b', 'c'].map((id, index) => {
    const element = document.querySelector(`#managed-${id}`)
    if (!(element instanceof HTMLElement)) throw new Error(`Missing managed-${id}`)
    return createManagedWindow(element, ['alpha', 'beta', 'gamma'][index])
  })
  const offs = ['register', 'unregister', 'focus', 'blur'].map((event) => manager.on(event, (win) => write(event, win)))
  const removes = windows.map((win) => { manager.register(win); const focus = () => manager.focus(win); win.element.addEventListener('pointerdown', focus); return () => win.element.removeEventListener('pointerdown', focus) })
  manager.focus(windows[0])
  return () => { for (const off of offs) off(); for (const remove of removes) remove(); for (const win of windows) win.destroy(); manager.destroy() }
}
