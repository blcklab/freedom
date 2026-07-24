export function run({ module, inputs }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')

  const win = module.freedom.window(target, {
    initialPosition: { x: 56, y: 62 },
    initialSize: { width: 320, height: 210 },
    minWidth: Number(inputs.minwidth),
    minHeight: Number(inputs.minheight),
    maxWidth: Number(inputs.maxwidth),
    maxHeight: Number(inputs.maxheight),
    dragHandle: '.window__header',
    bounds: desktop,
    resizable: true,
    onResize({ size }) {
      if (status) status.textContent = `${Math.round(size.width)} × ${Math.round(size.height)}`
    },
  })
  return () => win.destroy()
}
