export function run({ module, inputs }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const win = module.freedom.window(target, {
    initialPosition: 'center',
    initialSize: { width: Number(inputs.width), height: Number(inputs.height) },
    dragHandle: '.window__header',
    bounds: desktop,
    resizable: true,
    autoReveal: true,
  })
  return () => win.destroy()
}
