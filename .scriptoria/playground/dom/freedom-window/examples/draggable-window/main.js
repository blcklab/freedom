export function run({ module, inputs }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')

  const win = module.freedom.window(target, {
    initialPosition: { x: 44, y: 52 },
    initialSize: { width: Number(inputs.width), height: Number(inputs.height) },
    dragHandle: '.window__header',
    bounds: desktop,
    resizable: false,
    onDragEnd({ position }) {
      if (status) status.textContent = `x ${Math.round(position.x)} · y ${Math.round(position.y)}`
    },
  })

  return () => win.destroy()
}
