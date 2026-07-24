export function run({ module }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const log = document.querySelector('#log')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const lines = []
  const write = (event, detail = '') => { lines.unshift(`${event}${detail ? ` · ${detail}` : ''}`); lines.splice(12); if (log) log.textContent = lines.join('\n') }
  const win = module.freedom.window(target, {
    initialPosition: { x: 62, y: 68 }, initialSize: { width: 340, height: 210 }, dragHandle: '.window__header', bounds: desktop, resizable: true,
    onDragStart: () => write('dragstart'),
    onDragEnd: ({ position }) => write('dragend', `${Math.round(position.x)}, ${Math.round(position.y)}`),
    onResizeStart: ({ handle }) => write('resizestart', handle),
    onResizeEnd: ({ size }) => write('resizeend', `${Math.round(size.width)} × ${Math.round(size.height)}`),
    onFocus: () => write('focus'), onBlur: () => write('blur'),
  })
  const focus = () => win.focus(); const blur = () => win.blur(); const clear = () => { lines.length = 0; if (log) log.textContent = 'Log cleared.' }
  document.querySelector('#focus')?.addEventListener('click', focus)
  document.querySelector('#blur')?.addEventListener('click', blur)
  document.querySelector('#clear')?.addEventListener('click', clear)
  return () => { document.querySelector('#focus')?.removeEventListener('click', focus); document.querySelector('#blur')?.removeEventListener('click', blur); document.querySelector('#clear')?.removeEventListener('click', clear); win.destroy() }
}
