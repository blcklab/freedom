export function run({ module }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const values = new Map()
  let frozen = false
  const storage = {
    get length() { return values.size },
    clear() { values.clear() },
    getItem(key) { return values.has(key) ? values.get(key) : null },
    key(index) { return [...values.keys()][index] ?? null },
    removeItem(key) { values.delete(key) },
    setItem(key, value) { if (!frozen) values.set(key, String(value)) },
  }
  const win = module.freedom.window(target, { id: 'memory-demo', initialPosition: { x: 58, y: 64 }, initialSize: { width: 350, height: 220 }, dragHandle: '.window__header', bounds: desktop, resizable: true, persist: { key: 'freedom-demo', storage, restore: true, save: true } })
  const set = (value) => { if (status) status.textContent = value }
  const save = () => { frozen = false; win.saveState(); frozen = true; set('Snapshot saved') }
  const move = () => { win.setPosition({ x: 330, y: 230 }); win.setSize({ width: 260, height: 160 }); set('Moved without overwriting') }
  const restore = () => { set(win.restoreState() ? 'Snapshot restored' : 'Nothing to restore') }
  const clear = () => { frozen = false; win.clearState(); frozen = true; set('Snapshot cleared') }
  document.querySelector('#save')?.addEventListener('click', save)
  document.querySelector('#move')?.addEventListener('click', move)
  document.querySelector('#restore')?.addEventListener('click', restore)
  document.querySelector('#clear')?.addEventListener('click', clear)
  return () => { document.querySelector('#save')?.removeEventListener('click', save); document.querySelector('#move')?.removeEventListener('click', move); document.querySelector('#restore')?.removeEventListener('click', restore); document.querySelector('#clear')?.removeEventListener('click', clear); win.destroy() }
}
