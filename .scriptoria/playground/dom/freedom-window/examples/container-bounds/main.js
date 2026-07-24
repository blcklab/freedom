export function run({ module }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const win = module.freedom.window(target, {
    positioning: 'absolute',
    initialPosition: { x: 360, y: 230 },
    initialSize: { width: 280, height: 180 },
    dragHandle: '.window__header',
    bounds: desktop,
    resizable: true,
    onDragEnd({ position }) { if (status) status.textContent = `Clamped at ${Math.round(position.x)}, ${Math.round(position.y)}` },
  })
  return () => win.destroy()
}
