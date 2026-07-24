export function run({ module }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const win = module.freedom.window(target, { initialPosition: { x: 70, y: 74 }, initialSize: { width: 360, height: 230 }, dragHandle: '.window__header', bounds: desktop, resizable: true })
  const set = (value) => { if (status) status.textContent = value }
  const minimize = () => { win.minimize({ height: 48 }); set('Minimized') }
  const maximize = () => { win.maximize({ bounds: desktop }); set('Maximized') }
  const restore = () => { win.restore(); set('Normal') }
  document.querySelector('#minimize')?.addEventListener('click', minimize)
  document.querySelector('#maximize')?.addEventListener('click', maximize)
  document.querySelector('#restore')?.addEventListener('click', restore)
  return () => { document.querySelector('#minimize')?.removeEventListener('click', minimize); document.querySelector('#maximize')?.removeEventListener('click', maximize); document.querySelector('#restore')?.removeEventListener('click', restore); win.destroy() }
}
