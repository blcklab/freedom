export function run({ module }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const win = module.freedom.window(target, { initialPosition: { x: 48, y: 56 }, initialSize: { width: 330, height: 205 }, dragHandle: '.window__header', bounds: desktop, resizable: true })
  let dragEnabled = true
  let resizeEnabled = true
  const update = () => { if (status) { const p = win.getPosition(); const s = win.getSize(); status.textContent = `${Math.round(p.x)}, ${Math.round(p.y)} · ${Math.round(s.width)} × ${Math.round(s.height)}` } }
  const on = (id, fn) => { const el = document.querySelector(id); el?.addEventListener('click', fn); return () => el?.removeEventListener('click', fn) }
  const cleanups = [
    on('#move', () => { win.setPosition({ x: 280, y: 180 }); update() }),
    on('#grow', () => { win.setSize({ width: 460, height: 280 }); update() }),
    on('#reset', () => { win.setPosition({ x: 48, y: 56 }); win.setSize({ width: 330, height: 205 }); update() }),
    on('#toggle-drag', (event) => { dragEnabled = !dragEnabled; dragEnabled ? win.enableDrag() : win.disableDrag(); event.currentTarget.textContent = dragEnabled ? 'Disable drag' : 'Enable drag' }),
    on('#toggle-resize', (event) => { resizeEnabled = !resizeEnabled; resizeEnabled ? win.enableResize() : win.disableResize(); event.currentTarget.textContent = resizeEnabled ? 'Disable resize' : 'Enable resize' }),
  ]
  update()
  return () => { for (const cleanup of cleanups) cleanup(); win.destroy() }
}
