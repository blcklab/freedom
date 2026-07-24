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

export function run({ module, inputs }) {
  const manager = module.createManager({ baseZIndex: Number(inputs.base) })
  const elements = ['a', 'b', 'c'].map((id) => document.querySelector(`#managed-${id}`))
  if (elements.some((el) => !(el instanceof HTMLElement))) throw new Error('Managed windows were not found.')
  const windows = elements.map((element, index) => createManagedWindow(element, ['alpha', 'beta', 'gamma'][index]))
  const status = document.querySelector('#status')
  const listeners = windows.map((win) => { manager.register(win); const focus = () => manager.focus(win); win.element.addEventListener('pointerdown', focus); return () => win.element.removeEventListener('pointerdown', focus) })
  const off = manager.on('focus', (win) => { if (status) status.textContent = `${win.id} · z ${win.getZIndex()}` })
  manager.focus(windows[1])
  return () => { off(); for (const remove of listeners) remove(); for (const win of windows) win.destroy(); manager.destroy() }
}
